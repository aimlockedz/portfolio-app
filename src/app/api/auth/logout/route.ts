import { initializeLucia } from "@/lib/auth";
import { getDb } from "@/db/db";
import { cookies } from "next/headers";

export const runtime = "edge";

export async function POST() {
  const db = getDb();
  const lucia = initializeLucia(db);

  const cookieStore = await cookies();
  const sessionId = cookieStore.get(lucia.sessionCookieName)?.value;
  if (sessionId) {
    await lucia.invalidateSession(sessionId);
  }

  const sessionCookie = lucia.createBlankSessionCookie();
  cookieStore.set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);

  return new Response(null, {
    status: 302,
    headers: {
      Location: "/login",
    },
  });
}
