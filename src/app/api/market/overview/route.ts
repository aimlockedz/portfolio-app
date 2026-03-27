import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const SYMBOLS = [
  { symbol: "ES=F", name: "S&P 500 Futures", short: "S&P 500" },
  { symbol: "YM=F", name: "Dow Futures", short: "Dow" },
  { symbol: "NQ=F", name: "Nasdaq Futures", short: "Nasdaq" },
  { symbol: "GC=F", name: "Gold", short: "Gold" },
  { symbol: "SI=F", name: "Silver", short: "Silver" },
  { symbol: "CL=F", name: "Crude Oil", short: "Crude Oil" },
];

export async function GET() {
  try {
    const results = await Promise.all(
      SYMBOLS.map(async (item) => {
        try {
          const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(item.symbol)}?range=1d&interval=1m`;
          const res = await fetch(url, {
            headers: { "User-Agent": "Mozilla/5.0" },
            cache: "no-store", // Always fresh data
          });
          const json = await res.json();
          const meta = json.chart?.result?.[0]?.meta;
          if (!meta) return { ...item, price: 0, change: 0, changePercent: 0 };

          const price = meta.regularMarketPrice ?? 0;
          const prevClose = meta.chartPreviousClose ?? meta.previousClose ?? price;
          const change = price - prevClose;
          const changePercent = prevClose > 0 ? (change / prevClose) * 100 : 0;

          return { ...item, price, change, changePercent };
        } catch {
          return { ...item, price: 0, change: 0, changePercent: 0 };
        }
      })
    );

    return NextResponse.json({ markets: results }, {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch {
    return NextResponse.json({ markets: [] }, { status: 500 });
  }
}
