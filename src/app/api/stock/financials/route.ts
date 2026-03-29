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
      modules: ["financialData", "defaultKeyStatistics", "summaryDetail", "earnings", "earningsHistory"] as any,
    });

    const fd = result.financialData || {};
    const ks = result.defaultKeyStatistics || {};
    const sd = result.summaryDetail || {};
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

    // Use Yahoo's pre-calculated values from summaryDetail for accurate ratios
    // summaryDetail provides trailingPE, forwardPE, priceToBook etc. that are
    // properly aligned with market timing
    const trailingPE = num(sd.trailingPE) || num(ks.trailingEps) > 0 ? num(sd.trailingPE) || null : null;
    const forwardPE = num(sd.forwardPE) || num(ks.forwardPE) || null;

    // Validate margins — Yahoo returns as decimals (0.25 = 25%), multiply by 100
    // But sometimes returns 0 or undefined, so guard against that
    function pct(v: any): number {
      const n = num(v);
      // If the value is > 1, it's likely already a percentage
      if (Math.abs(n) > 5) return n;
      return n * 100;
    }

    // TTM (trailing twelve months) summary
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
      grossMargin: pct(fd.grossMargins),
      operatingMargin: pct(fd.operatingMargins),
      netMargin: pct(fd.profitMargins),
      ebitdaMargin: pct(fd.ebitdaMargins),
      // Ratios — use Yahoo's pre-calculated values from summaryDetail
      peRatio: forwardPE,
      trailingPE: trailingPE,
      forwardPE: forwardPE,
      priceToBook: num(sd.priceToBook) || num(ks.priceToBook) || null,
      evToEbitda: num(ks.enterpriseToEbitda) || null,
      evToRevenue: num(ks.enterpriseToRevenue) || null,
      roe: pct(fd.returnOnEquity),
      roa: pct(fd.returnOnAssets),
      debtToEquity: num(fd.debtToEquity),
      currentRatio: num(fd.currentRatio),
      quickRatio: num(fd.quickRatio),
      // EPS
      trailingEps: num(ks.trailingEps),
      forwardEps: num(ks.forwardEps),
      // Growth
      earningsGrowth: pct(fd.earningsGrowth),
      revenueGrowth: pct(fd.revenueGrowth),
      // Other
      beta: num(sd.beta) || num(ks.beta),
      sharesOutstanding: num(ks.sharesOutstanding),
      enterpriseValue: num(ks.enterpriseValue),
      // Dividend
      lastDividend: num(ks.lastDividendValue),
      dividendYield: num(sd.dividendYield) > 0 ? pct(sd.dividendYield) : null,
      // Price ratios from summaryDetail (most accurate)
      fiftyTwoWeekHigh: num(sd.fiftyTwoWeekHigh),
      fiftyTwoWeekLow: num(sd.fiftyTwoWeekLow),
      marketCap: num(sd.marketCap),
    };

    return NextResponse.json({ symbol, quarterly, annual, ttm });
  } catch (err) {
    console.error("Financials error:", err);
    return NextResponse.json({
      error: "Failed to fetch financials",
      periods: [],
    }, { status: 500 });
  }
}
