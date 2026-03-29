import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getDb } from "@/db/db";
import { initializeLucia } from "@/lib/auth";

/**
 * Checks if the request is authenticated.
 * Returns the user object if valid, or null if not.
 */
export async function getAuthUser() {
  const db = getDb();
  const lucia = initializeLucia(db);
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(lucia.sessionCookieName)?.value ?? null;
  if (!sessionId) return null;
  const { user } = await lucia.validateSession(sessionId);
  return user;
}

/**
 * Returns a 401 JSON response for unauthorized requests.
 */
export function unauthorizedResponse() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
