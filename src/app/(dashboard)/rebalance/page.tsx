import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getDb } from "@/db/db";
import { initializeLucia } from "@/lib/auth";
import { PortfolioRepository } from "@/db/repositories/portfolio";
import { RebalanceLogic } from "@/core/rebalancing/logic";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, ArrowRightLeft } from "lucide-react";



export default async function RebalancePage() {
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

  // For MVP, we use equal weight targets if no custom targets are set
  // In a real app, these would come from the database/user profile
  const targets: { [key: string]: number } = {};
  if (holdings.length > 0) {
    const equalWeight = 1 / holdings.length;
    holdings.forEach(h => targets[h.symbol] = equalWeight);
  }

  const holdingsForLogic = holdings.map(h => ({
    symbol: h.symbol,
    value: h.totalQuantity * h.averageCost
  }));

  const suggestions = RebalanceLogic.calculateSuggestions(holdingsForLogic, targets);

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <ArrowRightLeft className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Portfolio Rebalancing</h1>
          <p className="text-muted-foreground mt-1">Compare your current allocation vs targets.</p>
        </div>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Rebalancing Suggestions</CardTitle>
            <CardDescription>
              Suggestions based on 5% deviation threshold from target allocation.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Symbol</TableHead>
                  <TableHead className="text-right">Current %</TableHead>
                  <TableHead className="text-right">Target %</TableHead>
                  <TableHead className="text-right">Difference</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {suggestions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No holdings found to rebalance.
                    </TableCell>
                  </TableRow>
                ) : (
                  suggestions.map((s) => (
                    <TableRow key={s.symbol}>
                      <TableCell className="font-bold">{s.symbol}</TableCell>
                      <TableCell className="text-right">{(s.currentWeight * 100).toFixed(1)}%</TableCell>
                      <TableCell className="text-right">{(s.targetWeight * 100).toFixed(1)}%</TableCell>
                      <TableCell className={`text-right font-medium ${s.diffPercent > 0 ? 'text-destructive' : 'text-primary'}`}>
                        {(s.diffPercent * 100).toFixed(1)}%
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={s.action === 'Trim' ? 'destructive' : s.action === 'Add' ? 'default' : 'secondary'}
                        >
                          {s.action}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 flex gap-3">
          <AlertCircle className="h-5 w-5 text-blue-500 shrink-0" />
          <p className="text-sm text-blue-500">
            <strong>Note:</strong> Currently using equal-weight targets for all holdings. You can customize targets in the Settings page (upcoming).
          </p>
        </div>
      </div>
    </div>
  );
}
