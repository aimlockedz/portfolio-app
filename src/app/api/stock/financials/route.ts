import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const FMP_BASE = "https://financialmodelingprep.com/api/v3";

function fmt(period: string) {
  // "2024-09-30" -> "Q3 2024" or "2024" for annual
  if (!period) return period;
  if (period.length === 4) return period; // annual "2024"
  const d = new Date(period);
  const q = Math.floor(d.getMonth() / 3) + 1;
  return `Q${q} ${d.getFullYear()}`;
}

function safeNum(v: unknown): number {
  return typeof v === "number" && isFinite(v) ? v : 0;
}

export async function GET(request: NextRequest) {
  const symbol = request.nextUrl.searchParams.get("symbol");
  const period = request.nextUrl.searchParams.get("period") || "quarterly"; // quarterly | annual

  if (!symbol) {
    return NextResponse.json({ error: "Symbol required" }, { status: 400 });
  }

  const apiKey = process.env.FMP_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "FMP_API_KEY not configured" }, { status: 503 });
  }

  const fmpPeriod = period === "annual" ? "annual" : "quarter";
  const limit = period === "annual" ? 8 : 12;
  const cache = period === "annual" ? 86400 : 21600;

  try {
    const [incomeRes, balanceRes, cashRes, ratiosRes] = await Promise.all([
      fetch(`${FMP_BASE}/income-statement/${encodeURIComponent(symbol)}?period=${fmpPeriod}&limit=${limit}&apikey=${apiKey}`, { next: { revalidate: cache } }),
      fetch(`${FMP_BASE}/balance-sheet-statement/${encodeURIComponent(symbol)}?period=${fmpPeriod}&limit=${limit}&apikey=${apiKey}`, { next: { revalidate: cache } }),
      fetch(`${FMP_BASE}/cash-flow-statement/${encodeURIComponent(symbol)}?period=${fmpPeriod}&limit=${limit}&apikey=${apiKey}`, { next: { revalidate: cache } }),
      fetch(`${FMP_BASE}/ratios/${encodeURIComponent(symbol)}?period=${fmpPeriod}&limit=${limit}&apikey=${apiKey}`, { next: { revalidate: cache } }),
    ]);

    const [income, balance, cashflow, ratios] = await Promise.all([
      incomeRes.json(),
      balanceRes.json(),
      cashRes.json(),
      ratiosRes.json(),
    ]);

    if (!Array.isArray(income) || income.length === 0) {
      return NextResponse.json({ error: "No financial data available", periods: [] });
    }

    const periods = income.map((inc: Record<string, unknown>, i: number) => {
      const bal = Array.isArray(balance) ? balance[i] || {} : {};
      const cf = Array.isArray(cashflow) ? cashflow[i] || {} : {};
      const rat = Array.isArray(ratios) ? ratios[i] || {} : {};

      const revenue = safeNum(inc.revenue);
      const grossProfit = safeNum(inc.grossProfit);
      const netIncome = safeNum(inc.netIncome);
      const operatingIncome = safeNum(inc.operatingIncome);
      const ebitda = safeNum(inc.ebitda);
      const rnd = safeNum(inc.researchAndDevelopmentExpenses);
      const sga = safeNum(inc.sellingGeneralAndAdministrativeExpenses);

      return {
        label: fmt(inc.date as string),
        date: inc.date,
        // Income statement
        revenue,
        grossProfit,
        netIncome,
        operatingIncome,
        ebitda,
        eps: safeNum(inc.eps),
        rnd,
        sga,
        operatingExpenses: safeNum(inc.operatingExpenses),
        // Cash flow
        operatingCashFlow: safeNum(cf.operatingCashFlow),
        freeCashFlow: safeNum(cf.freeCashFlow),
        capitalExpenditure: safeNum(cf.capitalExpenditure),
        dividendsPaid: Math.abs(safeNum(cf.dividendsPaid)),
        // Balance sheet
        cash: safeNum(bal.cashAndCashEquivalents),
        shortTermDebt: safeNum(bal.shortTermDebt),
        longTermDebt: safeNum(bal.longTermDebt),
        totalDebt: safeNum(bal.totalDebt),
        netDebt: safeNum(bal.netDebt),
        // Margins (calculated)
        grossMargin: revenue > 0 ? (grossProfit / revenue) * 100 : null,
        netMargin: revenue > 0 ? (netIncome / revenue) * 100 : null,
        operatingMargin: revenue > 0 ? (operatingIncome / revenue) * 100 : null,
        // Ratios
        peRatio: safeNum(rat.priceEarningsRatio) || null,
        priceToSales: safeNum(rat.priceToSalesRatio) || null,
        evToEbitda: safeNum(rat.enterpriseValueMultiple) || null,
        priceToBook: safeNum(rat.priceToBookRatio) || null,
        roe: safeNum(rat.returnOnEquity) ? safeNum(rat.returnOnEquity) * 100 : null,
        roa: safeNum(rat.returnOnAssets) ? safeNum(rat.returnOnAssets) * 100 : null,
        debtToEquity: safeNum(rat.debtEquityRatio) || null,
        currentRatio: safeNum(rat.currentRatio) || null,
      };
    });

    // Reverse so oldest is first (chart order)
    return NextResponse.json({ symbol, periods: periods.reverse() });
  } catch {
    return NextResponse.json({ error: "Failed to fetch financials" }, { status: 500 });
  }
}
