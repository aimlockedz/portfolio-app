import { cookies } from "next/headers";
import { getDb } from "@/db/db";
import { initializeLucia } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ExposureClient } from "@/components/shared/exposure-client";

export const dynamic = "force-dynamic";

export default async function ExposurePage() {
  const db = getDb();
  const lucia = initializeLucia(db);
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(lucia.sessionCookieName)?.value;

  if (!sessionId) redirect("/login");

  const { session } = await lucia.validateSession(sessionId);
  if (!session) redirect("/login");

  return (
    <div className="p-6 lg:p-10 max-w-7xl space-y-6">
      <div>
        <h1 className="font-[var(--font-headline)] text-3xl font-bold">
          Ecosystem & Supply Chain Exposure
        </h1>
        <p className="text-[var(--on-surface-variant)] mt-1">
          Analyze concentration risk, supply chain dependencies, and geographic revenue exposure
        </p>
      </div>
      <ExposureClient />
    </div>
  );
}
