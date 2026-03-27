import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const category = request.nextUrl.searchParams.get("category") || "general";
  const minId = request.nextUrl.searchParams.get("minId") || "";

  const apiKey = process.env.FINNHUB_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "FINNHUB_API_KEY not configured" }, { status: 503 });
  }

  try {
    const url = new URL("https://finnhub.io/api/v1/news");
    url.searchParams.set("category", category);
    url.searchParams.set("token", apiKey);
    if (minId) url.searchParams.set("minId", minId);

    const res = await fetch(url.toString(), { next: { revalidate: 300 } }); // cache 5 min
    const data = await res.json();

    if (!Array.isArray(data)) {
      return NextResponse.json({ articles: [], error: "Unexpected response" });
    }

    const articles = data.slice(0, 50).map((a: any) => ({
      id: a.id,
      headline: a.headline,
      source: a.source,
      url: a.url,
      image: a.image || null,
      summary: a.summary,
      category: a.category,
      datetime: a.datetime, // unix timestamp
      related: a.related || "",
    }));

    return NextResponse.json({ articles });
  } catch {
    return NextResponse.json({ articles: [], error: "Failed to fetch news" }, { status: 500 });
  }
}
