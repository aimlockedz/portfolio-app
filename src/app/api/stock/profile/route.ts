import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const symbol = request.nextUrl.searchParams.get("symbol");
  if (!symbol) {
    return NextResponse.json({ error: "Symbol required" }, { status: 400 });
  }

  const apiKey = process.env.FINNHUB_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ symbol, industry: null, country: null, peers: [] });
  }

  try {
    const [profileRes, peersRes] = await Promise.all([
      fetch(`https://finnhub.io/api/v1/stock/profile2?symbol=${encodeURIComponent(symbol)}&token=${apiKey}`, { next: { revalidate: 86400 } }),
      fetch(`https://finnhub.io/api/v1/stock/peers?symbol=${encodeURIComponent(symbol)}&token=${apiKey}`, { next: { revalidate: 86400 } }),
    ]);

    const profile = await profileRes.json();
    const peers = await peersRes.json();

    return NextResponse.json({
      symbol,
      industry: profile.finnhubIndustry || null,
      country: profile.country || null,
      name: profile.name || null,
      logo: profile.logo || null,
      marketCap: profile.marketCapitalization || null,
      peers: Array.isArray(peers) ? peers.slice(0, 10) : [],
    });
  } catch {
    return NextResponse.json({ symbol, industry: null, country: null, peers: [] });
  }
}
