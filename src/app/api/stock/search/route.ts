import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q");
  if (!query || query.length < 1) {
    return NextResponse.json({ results: [] });
  }

  try {
    const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=8&newsCount=0&listsCount=0`;
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      next: { revalidate: 3600 },
    });
    const data = await res.json();

    const results = (data.quotes || [])
      .filter((item: any) => item.quoteType === "EQUITY" || item.quoteType === "ETF")
      .slice(0, 8)
      .map((item: any) => ({
        symbol: item.symbol,
        description: item.shortname || item.longname || item.symbol,
        type: item.quoteType,
      }));

    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ results: [], error: "Search failed" }, { status: 500 });
  }
}
