import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getDb } from "@/db/db";
import { initializeLucia } from "@/lib/auth";
import { priceAlerts } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { randomUUID } from "crypto";

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

// GET — list all alerts
export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb();

  // Ensure table exists
  try {
    await (db as any).run(`CREATE TABLE IF NOT EXISTS price_alerts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      symbol TEXT NOT NULL,
      target_price INTEGER NOT NULL,
      direction TEXT NOT NULL,
      active INTEGER NOT NULL DEFAULT 1,
      triggered INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL
    )`);
  } catch { /* table may already exist */ }

  const alerts = await db.select().from(priceAlerts).where(eq(priceAlerts.userId, user.id));
  return NextResponse.json({ alerts });
}

// POST — create a new alert
export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { symbol, targetPrice, direction } = body;

  if (!symbol || !targetPrice || !direction) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (!["above", "below"].includes(direction)) {
    return NextResponse.json({ error: "Direction must be 'above' or 'below'" }, { status: 400 });
  }

  const db = getDb();

  // Ensure table exists
  try {
    await (db as any).run(`CREATE TABLE IF NOT EXISTS price_alerts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      symbol TEXT NOT NULL,
      target_price INTEGER NOT NULL,
      direction TEXT NOT NULL,
      active INTEGER NOT NULL DEFAULT 1,
      triggered INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL
    )`);
  } catch { /* table may already exist */ }

  const id = randomUUID();
  await db.insert(priceAlerts).values({
    id,
    userId: user.id,
    symbol: symbol.toUpperCase(),
    targetPrice: Math.round(targetPrice * 100), // convert to cents
    direction,
    active: 1,
    triggered: 0,
    createdAt: new Date(),
  });

  return NextResponse.json({ success: true, id });
}

// DELETE — remove an alert
export async function DELETE(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: "Missing alert id" }, { status: 400 });

  const db = getDb();
  await db.delete(priceAlerts).where(and(eq(priceAlerts.id, id), eq(priceAlerts.userId, user.id)));

  return NextResponse.json({ success: true });
}
