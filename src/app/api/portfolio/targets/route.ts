import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getDb } from "@/db/db";
import { initializeLucia } from "@/lib/auth";
import { portfolioTargets } from "@/db/schema";
import { eq } from "drizzle-orm";
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
    .from(portfolioTargets)
    .where(eq(portfolioTargets.userId, user.id));

  return NextResponse.json({
    targets: targets.map((t) => ({
      id: t.id,
      targetValue: t.targetValue / 100, // cents → dollars
      label: t.label,
      createdAt: t.createdAt,
    })),
  });
}

export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { targetValue, label } = await request.json();
  if (!targetValue || targetValue <= 0) {
    return NextResponse.json({ error: "Invalid target value" }, { status: 400 });
  }

  const db = getDb();
  const id = generateId(15);
  await db.insert(portfolioTargets).values({
    id,
    userId: user.id,
    targetValue: Math.round(targetValue * 100), // dollars → cents
    label: label || null,
    createdAt: new Date(),
  });

  return NextResponse.json({ success: true, id });
}

export async function DELETE(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await request.json();
  const db = getDb();
  await db.delete(portfolioTargets).where(eq(portfolioTargets.id, id));

  return NextResponse.json({ success: true });
}
