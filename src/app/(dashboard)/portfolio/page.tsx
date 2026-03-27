import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getDb } from "@/db/db";
import { initializeLucia } from "@/lib/auth";
import { PortfolioRepository } from "@/db/repositories/portfolio";
import { AddTransactionDialog } from "@/components/shared/add-transaction-dialog";
import { PortfolioTable } from "@/components/shared/portfolio-table";

export const dynamic = "force-dynamic";

export default async function PortfolioPage() {
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
    <div className="p-6 lg:p-10 max-w-7xl space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-[var(--font-headline)] text-2xl font-bold tracking-tight">
            My Portfolio
          </h1>
          <p className="text-sm text-[var(--on-surface-variant)] mt-0.5">
            {holdings.length} holdings
          </p>
        </div>
        <AddTransactionDialog />
      </div>

      <PortfolioTable holdings={holdings} />
    </div>
  );
}
