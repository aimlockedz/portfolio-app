import { cookies } from "next/headers";
import { getDb } from "@/db/db";
import { initializeLucia } from "@/lib/auth";
import { journalSchema } from "@/lib/validations";
import { JournalRepository } from "@/db/repositories/journal";
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
  const parsed = journalSchema.safeParse({
    symbol: formData.get("symbol"),
    thesis: formData.get("thesis"),
    risks: formData.get("risks"),
    expectedUpside: formData.get("expectedUpside"),
    reviewDate: formData.get("reviewDate"),
  });
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0]?.message || "Invalid input" }, { status: 400 });
  }
  const { symbol, thesis, risks, expectedUpside, reviewDate: reviewDateStr } = parsed.data;

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
