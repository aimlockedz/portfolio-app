import { cookies } from "next/headers";
import { getDb } from "@/db/db";
import { initializeLucia } from "@/lib/auth";
import { WatchlistRepository } from "@/db/repositories/watchlist";
export const dynamic = "force-dynamic";



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

  const formData = await request.formData();
  const symbol = formData.get("symbol") as string;
  const convictionLevel = parseInt(formData.get("convictionLevel") as string) || 3;
  const notes = formData.get("notes") as string;

  if (!symbol) {
    return new Response("Symbol is required", { status: 400 });
  }

  const watchlistRepo = new WatchlistRepository(db);

  // Check for duplicate
  const existing = await watchlistRepo.getItems(user.id);
  if (existing.some((item) => item.symbol.toUpperCase() === symbol.toUpperCase())) {
    return Response.json({ error: `${symbol.toUpperCase()} is already in your watchlist` }, { status: 409 });
  }

  await watchlistRepo.addItem(user.id, { symbol, convictionLevel, notes });

  return new Response(null, { status: 200 });
}
