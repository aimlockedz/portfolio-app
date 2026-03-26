import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const YAHOO_BASE = "https://query1.finance.yahoo.com/v10/finance/quoteSummary";

function raw(v: unknown): number {
  if (v && typeof v === "object" && "raw" in v) return (v as { raw: number }).raw || 0;
  if (typeof v === "number") return v;
  return 0;
}

function fmtDate(ts: unknown): string {
  if (!ts) return "";
  const epoch = raw(ts);
  if (!epoch) return "";
  const d = new Date(epoch * 1000);
  const q = Math.floor(d.getMonth() / 3) + 1;
  return `Q${q} ${d.getFullYear()}`;
}

function fmtDateAnnual(ts: unknown): string {
  if (!ts) return "";
  const epoch = raw(ts);
  if (!epoch) return "";
  return new Date(epoch * 1000).getFullYear().toString();
}

export async function GET(request: NextRequest) {
  const symbol = request.nextUrl.searchParams.get("symbol");
  const period = request.nextUrl.searchParams.get("period") || "quarterly";

  if (!symbol) {
    return NextResponse.json({ error: "Symbol required" }, { status: 400 });
  }

  const isQuarterly = period !== "annual";

  const modules = isQuarterly
    ? "incomeStatementHistoryQuarterly,balanceSheetHistoryQuarterly,cashflowStatementHistoryQuarterly,defaultKeyStatistics,financialData"
    : "incomeStatementHistory,balanceSheetHistory,cashflowStatementHistory,defaultKeyStatistics,financialData";

  try {
    const url = `${YAHOO_BASE}/${encodeURIComponent(symbol)}?modules=${modules}`;
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      next: { revalidate: isQuarterly ? 21600 : 86400 },
    });

    const json = await res.json();
    const result = json?.quoteSummary?.result?.[0];

    if (!result) {
      return NextResponse.json({ error: "No financial data available", periods: [] });
    }

    const incomeKey = isQuarterly ? "incomeStatementHistoryQuarterly" : "incomeStatementHistory";
    const balanceKey = isQuarterly ? "balanceSheetHistoryQuarterly" : "balanceSheetHistory";
    const cashflowKey = isQuarterly ? "cashflowStatementHistoryQuarterly" : "cashflowStatementHistory";

    const incomeStatements: Record<string, unknown>[] =
      result[incomeKey]?.incomeStatementHistory || [];
    const balanceSheets: Record<string, unknown>[] =
      result[balanceKey]?.balanceSheetStatements || [];
    const cashflows: Record<string, unknown>[] =
      result[cashflowKey]?.cashflowStatements || [];

    const keyStats = result.defaultKeyStatistics || {};
    const finData = result.financialData || {};

    if (incomeStatements.length === 0) {
      return NextResponse.json({ error: "No financial data available", periods: [] });
    }

    const fmtLabel = isQuarterly ? fmtDate : fmtDateAnnual;

    const periods = incomeStatements.map((inc, i) => {
      const bal = balanceSheets[i] || {};
      const cf = cashflows[i] || {};

      const revenue = raw(inc.totalRevenue);
      const grossProfit = raw(inc.grossProfit);
      const netIncome = raw(inc.netIncome);
      const operatingIncome = raw(inc.operatingIncome);
      const ebitda = raw(inc.ebitda);
      const rnd = raw(inc.researchDevelopment);
      const sga = raw(inc.sellingGeneralAdministrative);
      const totalOpExp = raw(inc.totalOperatingExpenses);

      const cash = raw(bal.cash) + raw(bal.shortTermInvestments);
      const shortTermDebt = raw(bal.shortLongTermDebt);
      const longTermDebt = raw(bal.longTermDebt);
      const totalDebt = shortTermDebt + longTermDebt;

      const opCashFlow = raw(cf.totalCashFromOperatingActivities);
      const capex = raw(cf.capitalExpenditures);
      const dividendsPaid = Math.abs(raw(cf.dividendsPaid));
      const fcf = opCashFlow - Math.abs(capex);

      return {
        label: fmtLabel(inc.endDate),
        date: inc.endDate ? new Date(raw(inc.endDate) * 1000).toISOString().split("T")[0] : "",
        revenue,
        grossProfit,
        netIncome,
        operatingIncome,
        ebitda,
        eps: raw(inc.dilutedEPS),
        rnd,
        sga,
        operatingExpenses: totalOpExp,
        operatingCashFlow: opCashFlow,
        freeCashFlow: fcf,
        capitalExpenditure: capex,
        dividendsPaid,
        cash,
        shortTermDebt,
        longTermDebt,
        totalDebt,
        netDebt: totalDebt - cash,
        grossMargin: revenue > 0 ? (grossProfit / revenue) * 100 : null,
        netMargin: revenue > 0 ? (netIncome / revenue) * 100 : null,
        operatingMargin: revenue > 0 ? (operatingIncome / revenue) * 100 : null,
        // Ratios from keyStats/financialData (same across all periods - latest only)
        peRatio: raw(keyStats.forwardPE) || raw(keyStats.trailingPE) || null,
        priceToSales: raw(keyStats.priceToSalesTrailing12Months) || null,
        evToEbitda: raw(keyStats.enterpriseToEbitda) || null,
        priceToBook: raw(keyStats.priceToBook) || null,
        roe: raw(finData.returnOnEquity) ? raw(finData.returnOnEquity) * 100 : null,
        roa: raw(finData.returnOnAssets) ? raw(finData.returnOnAssets) * 100 : null,
        debtToEquity: raw(finData.debtToEquity) || null,
        currentRatio: raw(finData.currentRatio) || null,
      };
    });

    // Reverse so oldest is first (chart reads left-to-right)
    return NextResponse.json({ symbol, periods: periods.reverse() });
  } catch {
    return NextResponse.json({ error: "Failed to fetch financials" }, { status: 500 });
  }
}
