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
  if (!sessionId) {
    return redirect("/login");
  }

  const { user } = await lucia.validateSession(sessionId);
  if (!user) {
    return redirect("/login");
  }

  const portfolioRepo = new PortfolioRepository(db);
  const holdings = await portfolioRepo.getHoldings(user.id);

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">My Portfolio</h1>
        <AddTransactionDialog />
      </div>

      <div className="border rounded-lg bg-card">
        <PortfolioTable holdings={holdings} />
      </div>
    </div>
  );
}
