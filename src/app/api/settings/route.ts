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
  if (!sessionId) return new Response("Unauthorized", { status: 401 });

  const { user } = await lucia.validateSession(sessionId);
  if (!user) return new Response("Unauthorized", { status: 401 });

  const formData = await request.formData();
  const preferredCurrency = formData.get("preferredCurrency") as string;
  const riskProfile = formData.get("riskProfile") as string;
  const investmentStyle = formData.get("investmentStyle") as string;

  const profileRepo = new ProfileRepository(db);
  await profileRepo.updateProfile(user.id, { 
    preferredCurrency, 
    riskProfile, 
    investmentStyle 
  });

  return new Response(null, { status: 200 });
}
