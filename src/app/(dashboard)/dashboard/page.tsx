import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getDb } from "@/db/db";
import { initializeLucia } from "@/lib/auth";
import { PortfolioRepository } from "@/db/repositories/portfolio";
import { DashboardClient } from "@/components/shared/dashboard-client";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const db = getDb();
  const lucia = initializeLucia(db);

  const cookieStore = await cookies();
  const sessionId = cookieStore.get(lucia.sessionCookieName)?.value ?? null;
  if (!sessionId) return redirect("/login");

  const { user } = await lucia.validateSession(sessionId);
  if (!user) return redirect("/login");

  const portfolioRepo = new PortfolioRepository(db);
  const holdings = await portfolioRepo.getHoldings(user.id);

  return (
    <div className="p-4 md:p-6 lg:p-10 space-y-4 md:space-y-6 max-w-7xl">
      <div>
        <h1 className="font-[var(--font-headline)] text-2xl md:text-3xl font-bold tracking-tight">
          Dashboard
        </h1>
        <p className="text-sm text-[var(--on-surface-variant)] mt-1">
          Your portfolio at a glance
        </p>
      </div>

      <DashboardClient holdings={holdings} />
    </div>
  );
}
