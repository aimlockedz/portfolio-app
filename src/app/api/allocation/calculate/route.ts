import { cookies } from "next/headers";
import { getDb } from "@/db/db";
import { initializeLucia } from "@/lib/auth";
import { WatchlistRepository } from "@/db/repositories/watchlist";
import { IntelligenceRepository } from "@/db/repositories/intelligence";
import { AllocationEngine, AllocationStyle } from "@/core/allocation/engine";



export async function POST(request: Request) {
  const db = getDb();
  const lucia = initializeLucia(db);

  const cookieStore = await cookies();
  const sessionId = cookieStore.get(lucia.sessionCookieName)?.value ?? null;
  if (!sessionId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { user } = await lucia.validateSession(sessionId);
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { capital, style } = await request.json() as { capital: number; style: AllocationStyle };

  const watchlistRepo = new WatchlistRepository(db);
  const intelRepo = new IntelligenceRepository(db);
  
  const watchlistItems = await watchlistRepo.getItems(user.id);
  const symbols = watchlistItems.map(i => i.symbol);
  const scores = await intelRepo.getScores(symbols);

  // Map scores back to watchlist items, defaulting to score of 5 if not set
  const stocksWithScores = watchlistItems.map(item => {
    const scoreData = scores.find(s => s.symbol === item.symbol);
    return {
      symbol: item.symbol,
      totalScore: scoreData?.totalScore ?? 5,
      convictionLevel: item.convictionLevel,
    };
  });

  const engine = new AllocationEngine();
  const recommendations = engine.calculateAllocation(
    capital * 100, // convert to cents
    style,
    stocksWithScores
  );

  return new Response(JSON.stringify({ recommendations }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
