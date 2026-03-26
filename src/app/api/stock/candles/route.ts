import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const symbol = request.nextUrl.searchParams.get("symbol");
  const resolution = request.nextUrl.searchParams.get("resolution") || "D"; // D=daily, W=weekly
  const range = request.nextUrl.searchParams.get("range") || "1Y"; // 1M, 3M, 6M, 1Y, 5Y

  if (!symbol) {
    return NextResponse.json({ error: "Symbol required" }, { status: 400 });
  }

  const apiKey = process.env.FINNHUB_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "API key not configured" }, { status: 500 });
  }

  // Calculate from/to timestamps
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
    const res = await fetch(
      `https://finnhub.io/api/v1/stock/candle?symbol=${encodeURIComponent(symbol)}&resolution=${resolution}&from=${from}&to=${now}&token=${apiKey}`,
      { next: { revalidate: 300 } } // cache 5 min
    );
    const data = await res.json();

    if (data.s === "no_data" || !data.c) {
      return NextResponse.json({ candles: [] });
    }

    // Format: array of { time, open, high, low, close, volume }
    const candles = data.t.map((timestamp: number, i: number) => ({
      time: timestamp,
      open: data.o[i],
      high: data.h[i],
      low: data.l[i],
      close: data.c[i],
      volume: data.v[i],
    }));

    return NextResponse.json({ candles });
  } catch {
    return NextResponse.json({ error: "Failed to fetch candles" }, { status: 500 });
  }
}
