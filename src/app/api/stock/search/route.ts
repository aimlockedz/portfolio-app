import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/* eslint-disable @typescript-eslint/no-explicit-any */

const FINNHUB_KEY = process.env.FINNHUB_API_KEY || "";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q");
  if (!query || query.length < 1) {
    return NextResponse.json({ results: [] });
  }

  try {
    // Search Yahoo and Finnhub in parallel for best coverage
    const [yahooResults, finnhubResults] = await Promise.all([
      searchYahoo(query),
      searchFinnhub(query),
    ]);

    // Merge: Yahoo first, then Finnhub for any symbols not already present
    const seen = new Set(yahooResults.map((r) => r.symbol));
    const merged = [...yahooResults];
    for (const r of finnhubResults) {
      if (!seen.has(r.symbol)) {
        merged.push(r);
        seen.add(r.symbol);
      }
    }

    return NextResponse.json({ results: merged.slice(0, 10) });
  } catch {
    return NextResponse.json({ results: [], error: "Search failed" }, { status: 500 });
  }
}

async function searchYahoo(query: string): Promise<{ symbol: string; description: string; type: string }[]> {
  try {
    const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=8&newsCount=0&listsCount=0`;
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      next: { revalidate: 3600 },
    });
    const data = await res.json();

    return (data.quotes || [])
      .filter((item: any) => item.quoteType === "EQUITY" || item.quoteType === "ETF")
      .slice(0, 8)
      .map((item: any) => ({
        symbol: item.symbol,
        description: item.shortname || item.longname || item.symbol,
        type: item.quoteType,
      }));
  } catch {
    return [];
  }
}

async function searchFinnhub(query: string): Promise<{ symbol: string; description: string; type: string }[]> {
  if (!FINNHUB_KEY) return [];
  try {
    const url = `https://finnhub.io/api/v1/search?q=${encodeURIComponent(query)}&token=${FINNHUB_KEY}`;
    const res = await fetch(url, { next: { revalidate: 3600 } });
    const data = await res.json();

    return (data.result || [])
      .filter((item: any) => item.type === "Common Stock" || item.type === "ETP")
      .filter((item: any) => !item.symbol.includes(".")) // US stocks only
      .slice(0, 6)
      .map((item: any) => ({
        symbol: item.symbol,
        description: item.description || item.symbol,
        type: item.type === "Common Stock" ? "EQUITY" : "ETF",
      }));
  } catch {
    return [];
  }
}
