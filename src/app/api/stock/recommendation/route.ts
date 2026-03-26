import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const symbol = request.nextUrl.searchParams.get("symbol");
  if (!symbol) {
    return NextResponse.json({ error: "Symbol required" }, { status: 400 });
  }

  const apiKey = process.env.FINNHUB_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ recommendation: null });
  }

  try {
    const res = await fetch(
      `https://finnhub.io/api/v1/stock/recommendation?symbol=${encodeURIComponent(symbol)}&token=${apiKey}`,
      { next: { revalidate: 3600 } }
    );
    const data = await res.json();

    if (!Array.isArray(data) || data.length === 0) {
      return NextResponse.json({ recommendation: null });
    }

    // Get latest recommendation
    const latest = data[0];
    return NextResponse.json({
      recommendation: {
        buy: latest.buy || 0,
        hold: latest.hold || 0,
        sell: latest.sell || 0,
        strongBuy: latest.strongBuy || 0,
        strongSell: latest.strongSell || 0,
        period: latest.period || "",
      },
    });
  } catch {
    return NextResponse.json({ recommendation: null });
  }
}
