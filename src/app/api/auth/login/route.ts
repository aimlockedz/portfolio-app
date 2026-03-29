import bcrypt from "bcryptjs";
import { getDb } from "@/db/db";
import { users } from "@/db/schema";
import { initializeLucia } from "@/lib/auth";
import { loginSchema } from "@/lib/validations";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const formData = await request.formData();
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0]?.message || "Invalid input" }, { status: 400 });
  }
  const { email, password } = parsed.data;

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
