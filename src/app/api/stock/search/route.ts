import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q");
  if (!query || query.length < 1) {
    return NextResponse.json([]);
  }

  const apiKey = process.env.FINNHUB_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "API key not configured" }, { status: 500 });
  }

  try {
    const res = await fetch(
      `https://finnhub.io/api/v1/search?q=${encodeURIComponent(query)}&token=${apiKey}`,
      { next: { revalidate: 3600 } }
    );
    const data = await res.json();

    // Filter to only common stocks (not crypto, forex, etc.)
    const results = (data.result || [])
      .filter((item: any) => item.type === "Common Stock")
      .slice(0, 8)
      .map((item: any) => ({
        symbol: item.symbol,
        description: item.description,
      }));

    return NextResponse.json(results);
  } catch {
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
