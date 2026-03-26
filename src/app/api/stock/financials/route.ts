import { NextRequest, NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";

export const dynamic = "force-dynamic";

const yahooFinance = new YahooFinance();

function raw(v: unknown): number {
  if (v && typeof v === "object" && "raw" in v) return (v as { raw: number }).raw || 0;
  if (typeof v === "number" && isFinite(v)) return v;
  return 0;
}

function fmtQ(date: string): string {
  if (!date) return "";
  const d = new Date(date);
  const q = Math.floor(d.getMonth() / 3) + 1;
  return `Q${q} ${d.getFullYear()}`;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function get(obj: any, path: string): any {
  return path.split(".").reduce((o, k) => o?.[k], obj);
}

export async function GET(request: NextRequest) {
  const symbol = request.nextUrl.searchParams.get("symbol");
  const period = request.nextUrl.searchParams.get("period") || "quarterly";

  if (!symbol) {
    return NextResponse.json({ error: "Symbol required" }, { status: 400 });
  }

  const isQuarterly = period !== "annual";

  try {
    const modules: any = isQuarterly
      ? { modules: ["incomeStatementHistoryQuarterly", "balanceSheetHistoryQuarterly", "cashflowStatementHistoryQuarterly", "defaultKeyStatistics", "financialData"] }
      : { modules: ["incomeStatementHistory", "balanceSheetHistory", "cashflowStatementHistory", "defaultKeyStatistics", "financialData"] };

    const result: any = await yahooFinance.quoteSummary(symbol, modules);

    if (!result) {
      return NextResponse.json({ error: "No financial data available", periods: [] });
    }

    const incArr: any[] = isQuarterly
      ? get(result, "incomeStatementHistoryQuarterly.incomeStatementHistory") || []
      : get(result, "incomeStatementHistory.incomeStatementHistory") || [];

    const balArr: any[] = isQuarterly
      ? get(result, "balanceSheetHistoryQuarterly.balanceSheetStatements") || []
      : get(result, "balanceSheetHistory.balanceSheetStatements") || [];

    const cfArr: any[] = isQuarterly
      ? get(result, "cashflowStatementHistoryQuarterly.cashflowStatements") || []
      : get(result, "cashflowStatementHistory.cashflowStatements") || [];

    const ks: any = result.defaultKeyStatistics || {};
    const fd: any = result.financialData || {};

    if (incArr.length === 0) {
      return NextResponse.json({
        error: "No financial data available",
        debug: { keys: Object.keys(result || {}) },
        periods: [],
      });
    }

    // Temporary: dump first record's keys + values for field mapping
    const _dbgInc = incArr[0] ? Object.fromEntries(Object.entries(incArr[0]).map(([k, v]) => [k, v])) : {};
    const _dbgBal = balArr[0] ? Object.fromEntries(Object.entries(balArr[0]).map(([k, v]) => [k, v])) : {};
    const _dbgCf = cfArr[0] ? Object.fromEntries(Object.entries(cfArr[0]).map(([k, v]) => [k, v])) : {};

    const periods = incArr.map((inc: any, i: number) => {
      const bal: any = balArr[i] || {};
      const cf: any = cfArr[i] || {};

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
      const capex = Math.abs(raw(cf.capitalExpenditures));
      const dividendsPaid = Math.abs(raw(cf.dividendsPaid));
      const fcf = opCashFlow - capex;

      const endDate = inc.endDate instanceof Date
        ? inc.endDate.toISOString().split("T")[0]
        : typeof inc.endDate === "string" ? inc.endDate : "";
      const label = isQuarterly ? fmtQ(endDate) : endDate.slice(0, 4);

      return {
        label,
        date: endDate,
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
        peRatio: raw(ks.forwardPE) || raw(ks.trailingPE) || null,
        priceToSales: raw(ks.priceToSalesTrailing12Months) || null,
        evToEbitda: raw(ks.enterpriseToEbitda) || null,
        priceToBook: raw(ks.priceToBook) || null,
        roe: raw(fd.returnOnEquity) ? raw(fd.returnOnEquity) * 100 : null,
        roa: raw(fd.returnOnAssets) ? raw(fd.returnOnAssets) * 100 : null,
        debtToEquity: raw(fd.debtToEquity) || null,
        currentRatio: raw(fd.currentRatio) || null,
      };
    });

    return NextResponse.json({ symbol, periods: periods.reverse(), _debug: { income: _dbgInc, balance: _dbgBal, cashflow: _dbgCf } });
  } catch (err) {
    return NextResponse.json({
      error: "Failed to fetch financials",
      debug: String(err),
      periods: [],
    }, { status: 500 });
  }
}
