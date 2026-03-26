import bcrypt from "bcryptjs";
import { getDb } from "@/db/db";
import { users } from "@/db/schema";
import { initializeLucia } from "@/lib/auth";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const formData = await request.formData();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return Response.json({ error: "Please enter email and password" }, { status: 400 });
  }

  const db = getDb();
  const lucia = initializeLucia(db);

  const [existingUser] = await db.select().from(users).where(eq(users.email, email));
  if (!existingUser) {
    return Response.json({ error: "Incorrect email or password" }, { status: 400 });
  }

  const validPassword = await bcrypt.compare(password, existingUser.hashedPassword);
  if (!validPassword) {
    return Response.json({ error: "Incorrect email or password" }, { status: 400 });
  }

  const session = await lucia.createSession(existingUser.id, {});
  const sessionCookie = lucia.createSessionCookie(session.id);
  const cookieStore = await cookies();
  cookieStore.set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);

  return Response.json({ success: true });
}
