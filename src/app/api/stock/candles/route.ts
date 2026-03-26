import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const symbol = request.nextUrl.searchParams.get("symbol");
  const resolution = request.nextUrl.searchParams.get("resolution") || "D";
  const range = request.nextUrl.searchParams.get("range") || "1Y";

  if (!symbol) {
    return NextResponse.json({ error: "Symbol required", candles: [] }, { status: 400 });
  }

  const apiKey = process.env.FINNHUB_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "FINNHUB_API_KEY not configured", candles: [] }, { status: 500 });
  }

  const now = Math.floor(Date.now() / 1000);
  const ranges: Record<string, number> = {
    "1M": 30 * 86400,
    "3M": 90 * 86400,
    "6M": 180 * 86400,
    "1Y": 365 * 86400,
    "5Y": 5 * 365 * 86400,
  };
  const from = now - (ranges[range] || ranges["1Y"]);

  try {
    const url = `https://finnhub.io/api/v1/stock/candle?symbol=${encodeURIComponent(symbol)}&resolution=${resolution}&from=${from}&to=${now}&token=${apiKey}`;
    const res = await fetch(url, { next: { revalidate: 300 } });
    const data = await res.json();

    if (data.error) {
      return NextResponse.json({ error: data.error, candles: [] });
    }

    if (data.s === "no_data" || !data.c || !Array.isArray(data.c)) {
      return NextResponse.json({ error: "No data available for this symbol", candles: [] });
    }

    const candles = data.t.map((timestamp: number, i: number) => ({
      time: timestamp,
      open: data.o[i],
      high: data.h[i],
      low: data.l[i],
      close: data.c[i],
      volume: data.v[i],
    }));

    return NextResponse.json({ candles });
  } catch (err) {
    return NextResponse.json({ error: `Failed to fetch: ${err}`, candles: [] }, { status: 500 });
  }
}
