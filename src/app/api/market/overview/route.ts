import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const FINNHUB_KEY = process.env.FINNHUB_API_KEY || "";

// Use Finnhub for indices/futures that it supports, Yahoo for the rest
const SYMBOLS = [
  { symbol: "ES=F", finnhub: "^GSPC", name: "S&P 500 Futures", short: "S&P 500" },
  { symbol: "YM=F", finnhub: "^DJI", name: "Dow Futures", short: "Dow" },
  { symbol: "NQ=F", finnhub: "^IXIC", name: "Nasdaq Futures", short: "Nasdaq" },
  { symbol: "GC=F", finnhub: "", name: "Gold", short: "Gold" },
  { symbol: "SI=F", finnhub: "", name: "Silver", short: "Silver" },
  { symbol: "CL=F", finnhub: "", name: "Crude Oil", short: "Crude Oil" },
];

async function fetchFromFinnhub(symbol: string): Promise<{ price: number; change: number; changePercent: number } | null> {
  if (!FINNHUB_KEY || !symbol) return null;
  try {
    const res = await fetch(`https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${FINNHUB_KEY}`, {
      cache: "no-store",
    });
    const data = await res.json();
    if (data.c && data.c > 0) {
      return {
        price: data.c,          // current price
        change: data.d ?? 0,    // change
        changePercent: data.dp ?? 0, // change percent
      };
    }
  } catch { /* fall through */ }
  return null;
}

async function fetchFromYahoo(symbol: string): Promise<{ price: number; change: number; changePercent: number }> {
  try {
    // Use 2m interval for more current data, grab last close from candles
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=1d&interval=2m`;
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      cache: "no-store",
    });
    const json = await res.json();
    const result = json.chart?.result?.[0];
    if (!result) return { price: 0, change: 0, changePercent: 0 };

    const meta = result.meta;
    // Get the most recent actual price from the last candle close
    const closes = result.indicators?.quote?.[0]?.close;
    let price = meta.regularMarketPrice ?? 0;

    // Use the very last non-null close from candle data if available (more current)
    if (closes && closes.length > 0) {
      for (let i = closes.length - 1; i >= 0; i--) {
        if (closes[i] !== null && closes[i] > 0) {
          price = closes[i];
          break;
        }
      }
    }

    const prevClose = meta.chartPreviousClose ?? meta.previousClose ?? price;
    const change = price - prevClose;
    const changePercent = prevClose > 0 ? (change / prevClose) * 100 : 0;

    return { price, change, changePercent };
  } catch {
    return { price: 0, change: 0, changePercent: 0 };
  }
}

export async function GET() {
  try {
    const results = await Promise.all(
      SYMBOLS.map(async (item) => {
        // Try Finnhub first for supported symbols
        const finnhubResult = await fetchFromFinnhub(item.finnhub);
        if (finnhubResult && finnhubResult.price > 0) {
          return { ...item, ...finnhubResult };
        }

        // Fallback to Yahoo Finance
        const yahooResult = await fetchFromYahoo(item.symbol);
        return { ...item, ...yahooResult };
      })
    );

    return NextResponse.json({ markets: results }, {
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch {
    return NextResponse.json({ markets: [] }, { status: 500 });
  }
}
