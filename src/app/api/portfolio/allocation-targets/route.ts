import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getDb } from "@/db/db";
import { initializeLucia } from "@/lib/auth";
import { allocationTargets } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { generateId } from "lucia";

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

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb();
  const targets = await db
    .select()
    .from(allocationTargets)
    .where(eq(allocationTargets.userId, user.id));

  return NextResponse.json({
    targets: targets.map((t) => ({
      id: t.id,
      sector: t.sector,
      targetPercent: t.targetPercent,
    })),
  });
}

export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { targets } = await request.json();
  // targets: { sector: string, targetPercent: number }[]
  if (!Array.isArray(targets)) {
    return NextResponse.json({ error: "Invalid targets" }, { status: 400 });
  }

  const db = getDb();

  // Delete all existing targets for this user
  await db.delete(allocationTargets).where(eq(allocationTargets.userId, user.id));

  // Insert new targets
  for (const t of targets) {
    if (t.sector && t.targetPercent > 0) {
      await db.insert(allocationTargets).values({
        id: generateId(15),
        userId: user.id,
        sector: t.sector,
        targetPercent: Math.round(t.targetPercent),
        updatedAt: new Date(),
      });
    }
  }

  return NextResponse.json({ success: true });
}
