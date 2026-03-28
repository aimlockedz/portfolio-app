import { cookies } from "next/headers";
import { getDb } from "@/db/db";
import { initializeLucia } from "@/lib/auth";
import { WatchlistRepository } from "@/db/repositories/watchlist";
export const dynamic = "force-dynamic";



export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const db = getDb();
  const lucia = initializeLucia(db);
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(lucia.sessionCookieName)?.value ?? null;
  if (!sessionId) return new Response("Unauthorized", { status: 401 });
  const { user } = await lucia.validateSession(sessionId);
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const watchlistRepo = new WatchlistRepository(db);
  await watchlistRepo.updateItem(user.id, id, body);
  return Response.json({ success: true });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

  const { id } = await params;
  const watchlistRepo = new WatchlistRepository(db);
  await watchlistRepo.removeItem(user.id, id);

  return new Response(null, { status: 200 });
}
