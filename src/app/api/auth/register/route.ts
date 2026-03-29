import { generateId } from "lucia";
import bcrypt from "bcryptjs";
import { getDb } from "@/db/db";
import { users, profiles } from "@/db/schema";
import { initializeLucia } from "@/lib/auth";
import { registerSchema } from "@/lib/validations";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const formData = await request.formData();
  const parsed = registerSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    displayName: formData.get("displayName"),
  });
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0]?.message || "Invalid input" }, { status: 400 });
  }
  const { email, password, displayName } = parsed.data;

  if (!displayName) {
    return Response.json({ error: "Please fill in all fields" }, { status: 400 });
  }

  const db = getDb();
  const lucia = initializeLucia(db);

  const hashedPassword = await bcrypt.hash(password, 10);
  const userId = generateId(15);

  try {
    await db.insert(users).values({
      id: userId,
      email,
      hashedPassword,
      displayName,
      createdAt: new Date(),
    });

    await db.insert(profiles).values({
      id: generateId(15),
      userId,
      updatedAt: new Date(),
    });

    const session = await lucia.createSession(userId, {});
    const sessionCookie = lucia.createSessionCookie(session.id);
    const cookieStore = await cookies();
    cookieStore.set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);

    return Response.json({ success: true });
  } catch {
    return Response.json({ error: "Email already registered" }, { status: 400 });
  }
}
