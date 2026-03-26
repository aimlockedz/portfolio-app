import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getDb } from "@/db/db";
import { initializeLucia } from "@/lib/auth";
import { PortfolioRepository } from "@/db/repositories/portfolio";
import { analyzeExposure, type HoldingInput } from "@/core/exposure/analysis";

export const dynamic = "force-dynamic";

export async function GET() {
  const db = getDb();
  const lucia = initializeLucia(db);
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(lucia.sessionCookieName)?.value;

  if (!sessionId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { session, user } = await lucia.validateSession(sessionId);
  if (!session || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const repo = new PortfolioRepository(db);
  const holdings = await repo.getHoldings(user.id);

  if (holdings.length === 0) {
    return NextResponse.json(analyzeExposure([]));
  }

  // Fetch quotes and profiles for each holding
  const apiKey = process.env.FINNHUB_API_KEY;
  const holdingInputs: HoldingInput[] = [];

  for (const h of holdings) {
    let currentPrice = h.averageCost / 100; // fallback to avg cost
    let industry: string | undefined;
    let country: string | undefined;

    try {
      // Fetch quote
      if (apiKey) {
        const quoteRes = await fetch(
          `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(h.symbol)}&token=${apiKey}`,
          { next: { revalidate: 60 } }
        );
        const quote = await quoteRes.json();
        if (quote.c && quote.c > 0) currentPrice = quote.c;

        // Fetch profile
        const profileRes = await fetch(
          `https://finnhub.io/api/v1/stock/profile2?symbol=${encodeURIComponent(h.symbol)}&token=${apiKey}`,
          { next: { revalidate: 86400 } }
        );
        const profile = await profileRes.json();
        industry = profile.finnhubIndustry || undefined;
        country = profile.country || undefined;
      }
    } catch {
      // Continue with fallback values
    }

    holdingInputs.push({
      symbol: h.symbol,
      marketValue: currentPrice * h.totalQuantity,
      industry,
      country,
    });
  }

  const result = analyzeExposure(holdingInputs);
  return NextResponse.json(result);
}
