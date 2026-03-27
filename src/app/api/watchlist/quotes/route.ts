import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const symbols = request.nextUrl.searchParams.get("symbols");
  if (!symbols) {
    return NextResponse.json({ quotes: [] });
  }

  const apiKey = process.env.FINNHUB_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "API key not configured" }, { status: 503 });
  }

  const symbolList = symbols.split(",").slice(0, 30); // max 30

  try {
    // Fetch quotes in parallel
    const quotePromises = symbolList.map(async (sym) => {
      try {
        const res = await fetch(
          `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(sym)}&token=${apiKey}`,
          { next: { revalidate: 30 } }
        );
        const d = await res.json();
        return {
          symbol: sym,
          price: d.c || 0,
          change: d.d || 0,
          changePercent: d.dp || 0,
          open: d.o || 0,
          high: d.h || 0,
          low: d.l || 0,
          prevClose: d.pc || 0,
        };
      } catch {
        return { symbol: sym, price: 0, change: 0, changePercent: 0, open: 0, high: 0, low: 0, prevClose: 0 };
      }
    });

    // Fetch sparkline data from Yahoo (7 day, 1h interval)
    const sparkPromises = symbolList.map(async (sym) => {
      try {
        const res = await fetch(
          `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?range=5d&interval=30m`,
          { headers: { "User-Agent": "Mozilla/5.0" }, next: { revalidate: 300 } }
        );
        const json = await res.json();
        const closes: number[] = json.chart?.result?.[0]?.indicators?.quote?.[0]?.close || [];
        // Sample down to ~30 points
        const step = Math.max(1, Math.floor(closes.length / 30));
        const points = closes.filter((_: any, i: number) => i % step === 0).filter((v: any) => v != null);
        return { symbol: sym, sparkline: points };
      } catch {
        return { symbol: sym, sparkline: [] };
      }
    });

    const [quotes, sparks] = await Promise.all([
      Promise.all(quotePromises),
      Promise.all(sparkPromises),
    ]);

    // Merge
    const merged = quotes.map((q) => {
      const spark = sparks.find((s) => s.symbol === q.symbol);
      return { ...q, sparkline: spark?.sparkline || [] };
    });

    return NextResponse.json({ quotes: merged });
  } catch {
    return NextResponse.json({ quotes: [], error: "Failed" }, { status: 500 });
  }
}
