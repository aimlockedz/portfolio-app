import { cookies } from "next/headers";
import { getDb } from "@/db/db";
import { initializeLucia } from "@/lib/auth";
import { ProfileRepository } from "@/db/repositories/profile";
export const dynamic = "force-dynamic";



export async function POST(request: Request) {
  const db = getDb();
  const lucia = initializeLucia(db);

  const cookieStore = await cookies();
  const sessionId = cookieStore.get(lucia.sessionCookieName)?.value ?? null;
  if (!sessionId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { user } = await lucia.validateSession(sessionId);
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const formData = await request.formData();
  const displayName = formData.get("displayName") as string;
  const bio = formData.get("bio") as string;

  const profileRepo = new ProfileRepository(db);
  
  if (displayName) {
    await profileRepo.updateDisplayName(user.id, displayName);
  }
  
  await profileRepo.updateProfile(user.id, { bio });

  return new Response(null, { status: 200 });
}
