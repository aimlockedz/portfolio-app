import { NextRequest, NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";

export const dynamic = "force-dynamic";

const yf = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

/* eslint-disable @typescript-eslint/no-explicit-any */

export async function GET(request: NextRequest) {
  const symbolsParam = request.nextUrl.searchParams.get("symbols");
  if (!symbolsParam) {
    return NextResponse.json({ error: "symbols required" }, { status: 400 });
  }

  const symbols = symbolsParam.split(",").map((s) => s.trim().toUpperCase()).filter(Boolean);

  try {
    const dividends: any[] = [];

    await Promise.all(
      symbols.map(async (symbol) => {
        try {
          const result: any = await yf.quoteSummary(symbol, {
            modules: ["calendarEvents", "summaryDetail", "price"] as any,
          });

          const cal = result.calendarEvents || {};
          const detail = result.summaryDetail || {};
          const price = result.price || {};

          const exDate = cal.exDividendDate ? new Date(cal.exDividendDate).toISOString().split("T")[0] : null;
          const divDate = cal.dividendDate ? new Date(cal.dividendDate).toISOString().split("T")[0] : null;

          const divRate = detail.dividendRate || 0;
          const divYield = detail.dividendYield ? (detail.dividendYield * 100) : 0;
          const payoutRatio = detail.payoutRatio ? (detail.payoutRatio * 100) : 0;

          if (divRate > 0 || exDate) {
            dividends.push({
              symbol,
              name: price.shortName || price.longName || symbol,
              exDividendDate: exDate,
              dividendDate: divDate,
              dividendRate: divRate,
              dividendYield: parseFloat(divYield.toFixed(2)),
              payoutRatio: parseFloat(payoutRatio.toFixed(1)),
              frequency: cal.frequency || null,
            });
          }
        } catch { /* skip symbols that fail */ }
      })
    );

    // Sort by ex-dividend date
    dividends.sort((a, b) => {
      if (!a.exDividendDate) return 1;
      if (!b.exDividendDate) return -1;
      return a.exDividendDate.localeCompare(b.exDividendDate);
    });

    return NextResponse.json({ dividends });
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch dividends", debug: String(err) }, { status: 500 });
  }
}
