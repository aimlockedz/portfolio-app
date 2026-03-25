import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getDb } from "@/db/db";
import { initializeLucia } from "@/lib/auth";
import { WatchlistRepository } from "@/db/repositories/watchlist";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AddWatchlistDialog } from "@/components/shared/add-watchlist-dialog";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { DeleteWatchlistItemButton } from "@/components/shared/delete-watchlist-item-button";

export const runtime = "edge";

export default async function WatchlistPage() {
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

  const watchlistRepo = new WatchlistRepository(db);
  const items = await watchlistRepo.getItems(user.id);

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Watchlist</h1>
        <AddWatchlistDialog />
      </div>

      <div className="border rounded-lg bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Symbol</TableHead>
              <TableHead>Conviction</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead>Added Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Your watchlist is empty. Add symbols you want to monitor.
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-bold">{item.symbol}</TableCell>
                  <TableCell>
                    <Badge variant={item.convictionLevel >= 4 ? "default" : "secondary"}>
                      Level {item.convictionLevel}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">{item.notes || "-"}</TableCell>
                  <TableCell>{item.addedAt.toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <DeleteWatchlistItemButton itemId={item.id} />
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
