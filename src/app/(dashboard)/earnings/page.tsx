import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getDb } from "@/db/db";
import { initializeLucia } from "@/lib/auth";
import { EarningsCalendar } from "@/components/shared/earnings-calendar";

export const dynamic = "force-dynamic";

export default async function EarningsPage() {
  const db = getDb();
  const lucia = initializeLucia(db);

  const cookieStore = await cookies();
  const sessionId = cookieStore.get(lucia.sessionCookieName)?.value ?? null;
  if (!sessionId) return redirect("/login");

  const { user } = await lucia.validateSession(sessionId);
  if (!user) return redirect("/login");

  return (
    <div className="p-6 lg:p-10 max-w-5xl space-y-6">
      <div>
        <h1 className="font-[var(--font-headline)] text-2xl font-bold tracking-tight">
          Earnings Calendar
        </h1>
        <p className="text-sm text-[var(--on-surface-variant)] mt-0.5">
          US earnings announcements schedule
        </p>
      </div>
      <EarningsCalendar />
    </div>
  );
}
