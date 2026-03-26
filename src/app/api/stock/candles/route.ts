import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const symbol = request.nextUrl.searchParams.get("symbol");
  const range = request.nextUrl.searchParams.get("range") || "1Y";
  const tf = request.nextUrl.searchParams.get("interval") || "D";

  if (!symbol) {
    return NextResponse.json({ error: "Symbol required", candles: [] }, { status: 400 });
  }

  // Map timeframe: D=daily, W=weekly, M=monthly
  const intervalMap: Record<string, string> = { D: "1d", W: "1wk", M: "1mo" };
  const yahooInterval = intervalMap[tf] || "1d";

  // Map range to Yahoo Finance params
  const rangeMap: Record<string, string> = {
    "1M": "1mo",
    "3M": "3mo",
    "6M": "6mo",
    "1Y": "1y",
    "5Y": "5y",
  };
  const yahooRange = rangeMap[range] || "1y";

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=${yahooRange}&interval=${yahooInterval}`;
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      next: { revalidate: 300 },
    });
    const data = await res.json();

    const result = data?.chart?.result?.[0];
    if (!result) {
      return NextResponse.json({ error: "No data for this symbol", candles: [] });
    }

    const timestamps = result.timestamp;
    const quote = result.indicators?.quote?.[0];
    if (!timestamps || !quote) {
      return NextResponse.json({ error: "Invalid data format", candles: [] });
    }

    const candles = timestamps
      .map((t: number, i: number) => ({
        time: t,
        open: quote.open?.[i],
        high: quote.high?.[i],
        low: quote.low?.[i],
        close: quote.close?.[i],
        volume: quote.volume?.[i],
      }))
      .filter((c: { close: number | null }) => c.close !== null && c.close !== undefined);

    return NextResponse.json({ candles });
  } catch (err) {
    return NextResponse.json({ error: `Failed to fetch: ${err}`, candles: [] }, { status: 500 });
  }
}
