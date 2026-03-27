import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getDb } from "@/db/db";
import { initializeLucia } from "@/lib/auth";
import { portfolioHoldings, transactions } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export const dynamic = "force-dynamic";

async function getUser() {
  const db = getDb();
  const lucia = initializeLucia(db);
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(lucia.sessionCookieName)?.value ?? null;
  if (!sessionId) return null;
  const { user } = await lucia.validateSession(sessionId);
  return user;
}

// DELETE — remove a holding from portfolio
export async function DELETE(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { holdingId } = await request.json();
  if (!holdingId) return NextResponse.json({ error: "Missing holdingId" }, { status: 400 });

  const db = getDb();

  // Verify ownership
  const [holding] = await db
    .select()
    .from(portfolioHoldings)
    .where(and(eq(portfolioHoldings.id, holdingId), eq(portfolioHoldings.userId, user.id)));

  if (!holding) {
    return NextResponse.json({ error: "Holding not found" }, { status: 404 });
  }

  // Delete associated transactions
  await db
    .delete(transactions)
    .where(and(eq(transactions.userId, user.id), eq(transactions.symbol, holding.symbol)));

  // Delete the holding
  await db.delete(portfolioHoldings).where(eq(portfolioHoldings.id, holdingId));

  return NextResponse.json({ success: true });
}
