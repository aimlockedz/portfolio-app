import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const symbol = request.nextUrl.searchParams.get("symbol");
  if (!symbol) {
    return NextResponse.json({ error: "Symbol required" }, { status: 400 });
  }

  const apiKey = process.env.FINNHUB_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "API key not configured" }, { status: 500 });
  }

  try {
    const res = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${apiKey}`,
      { next: { revalidate: 60 } }
    );
    const data = await res.json();

    return NextResponse.json({
      symbol,
      currentPrice: data.c,     // Current price
      change: data.d,            // Change
      changePercent: data.dp,    // Change percent
      high: data.h,              // High of the day
      low: data.l,               // Low of the day
      open: data.o,              // Open price
      previousClose: data.pc,    // Previous close
    });
  } catch {
    return NextResponse.json({ error: "Quote failed" }, { status: 500 });
  }
}
