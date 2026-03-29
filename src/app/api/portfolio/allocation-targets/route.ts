import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getDb } from "@/db/db";
import { initializeLucia } from "@/lib/auth";
import { allocationTargetSchema } from "@/lib/validations";
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

  const body = await request.json();
  const parsed = allocationTargetSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid input" }, { status: 400 });
  }
  const { targets } = parsed.data;

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
