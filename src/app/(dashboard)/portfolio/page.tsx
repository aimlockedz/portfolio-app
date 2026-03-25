import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getDb } from "@/db/db";
import { initializeLucia } from "@/lib/auth";
import { PortfolioRepository } from "@/db/repositories/portfolio";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AddTransactionDialog } from "@/components/shared/add-transaction-dialog";

export const runtime = "edge";

export default async function PortfolioPage() {
  const db = getDb((globalThis as any).process.env as any);
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
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Symbol</TableHead>
              <TableHead className="text-right">Quantity</TableHead>
              <TableHead className="text-right">Avg Cost</TableHead>
              <TableHead className="text-right">Total Cost</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {holdings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  No holdings yet. Add a transaction to get started.
                </TableCell>
              </TableRow>
            ) : (
              holdings.map((holding) => (
                <TableRow key={holding.id}>
                  <TableCell className="font-bold">{holding.symbol}</TableCell>
                  <TableCell className="text-right">{holding.totalQuantity}</TableCell>
                  <TableCell className="text-right">${(holding.averageCost / 100).toFixed(2)}</TableCell>
                  <TableCell className="text-right">
                    ${((holding.totalQuantity * holding.averageCost) / 100).toFixed(2)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
