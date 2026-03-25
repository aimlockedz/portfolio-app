import { cookies } from "next/headers";
import { getDb } from "@/db/db";
import { initializeLucia } from "@/lib/auth";
import { JournalRepository } from "@/db/repositories/journal";

export const runtime = "edge";

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
  const thesis = formData.get("thesis") as string;
  const risks = formData.get("risks") as string;
  const expectedUpside = formData.get("expectedUpside") as string;
  const reviewDateStr = formData.get("reviewDate") as string;

  if (!symbol) {
    return new Response("Symbol is required", { status: 400 });
  }

  const journalRepo = new JournalRepository(db);
  await journalRepo.addEntry(user.id, {
    symbol,
    thesis,
    risks,
    expectedUpside,
    reviewDate: reviewDateStr ? new Date(reviewDateStr) : undefined,
  });

  return new Response(null, { status: 200 });
}
