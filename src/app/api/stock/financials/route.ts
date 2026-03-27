import { NextRequest, NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";

export const dynamic = "force-dynamic";

const yf = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

/* eslint-disable @typescript-eslint/no-explicit-any */
function num(v: any): number {
  if (typeof v === "number" && isFinite(v)) return v;
  return 0;
}

export async function GET(request: NextRequest) {
  const symbol = request.nextUrl.searchParams.get("symbol");
  if (!symbol) {
    return NextResponse.json({ error: "Symbol required" }, { status: 400 });
  }

  try {
    const result: any = await yf.quoteSummary(symbol, {
      modules: ["financialData", "defaultKeyStatistics", "earnings", "earningsHistory"] as any,
    });

    const fd = result.financialData || {};
    const ks = result.defaultKeyStatistics || {};
    const earningsQ: any[] = result.earnings?.financialsChart?.quarterly || [];
    const earningsY: any[] = result.earnings?.financialsChart?.yearly || [];
    const epsHistory: any[] = result.earningsHistory?.history || [];

    // Build quarterly data (revenue + earnings from earnings module, eps from earningsHistory)
    const quarterly = earningsQ.map((q: any, i: number) => {
      const epsMatch = epsHistory.find((e: any) => {
        if (!e.quarter) return false;
        const eDate = new Date(e.quarter);
        const qParts = q.date?.match(/(\d)Q(\d{4})/);
        if (!qParts) return false;
        const qNum = parseInt(qParts[1]);
        const qYear = parseInt(qParts[2]);
        const eQ = Math.floor(eDate.getMonth() / 3) + 1;
        return eQ === qNum && eDate.getFullYear() === qYear;
      });

      return {
        label: q.fiscalQuarter || q.date || `Q${i + 1}`,
        revenue: num(q.revenue),
        earnings: num(q.earnings),
        eps: epsMatch ? num(epsMatch.epsActual) : null,
        epsEstimate: epsMatch ? num(epsMatch.epsEstimate) : null,
      };
    });

    // Build annual data
    const annual = earningsY.map((y: any) => ({
      label: String(y.date),
      revenue: num(y.revenue),
      earnings: num(y.earnings),
    }));

    // TTM (trailing twelve months) summary from financialData
    const ttm = {
      revenue: num(fd.totalRevenue),
      grossProfit: num(fd.grossProfits),
      ebitda: num(fd.ebitda),
      netIncome: num(ks.netIncomeToCommon),
      operatingCashFlow: num(fd.operatingCashflow),
      freeCashFlow: num(fd.freeCashflow),
      totalCash: num(fd.totalCash),
      totalDebt: num(fd.totalDebt),
      // Margins (as percentages)
      grossMargin: num(fd.grossMargins) * 100,
      operatingMargin: num(fd.operatingMargins) * 100,
      netMargin: num(fd.profitMargins) * 100,
      ebitdaMargin: num(fd.ebitdaMargins) * 100,
      // Ratios
      peRatio: num(ks.forwardPE) || null,
      trailingPE: num(ks.trailingEps) > 0 ? num(fd.currentPrice) / num(ks.trailingEps) : null,
      priceToBook: num(ks.priceToBook) || null,
      evToEbitda: num(ks.enterpriseToEbitda) || null,
      evToRevenue: num(ks.enterpriseToRevenue) || null,
      roe: num(fd.returnOnEquity) * 100,
      roa: num(fd.returnOnAssets) * 100,
      debtToEquity: num(fd.debtToEquity),
      currentRatio: num(fd.currentRatio),
      quickRatio: num(fd.quickRatio),
      // EPS
      trailingEps: num(ks.trailingEps),
      forwardEps: num(ks.forwardEps),
      // Growth
      earningsGrowth: num(fd.earningsGrowth) * 100,
      revenueGrowth: num(fd.revenueGrowth) * 100,
      // Other
      beta: num(ks.beta),
      sharesOutstanding: num(ks.sharesOutstanding),
      enterpriseValue: num(ks.enterpriseValue),
      // Dividend
      lastDividend: num(ks.lastDividendValue),
    };

    return NextResponse.json({ symbol, quarterly, annual, ttm });
  } catch (err) {
    return NextResponse.json({
      error: "Failed to fetch financials",
      debug: String(err),
      periods: [],
    }, { status: 500 });
  }
}
