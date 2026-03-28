import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getDb } from "@/db/db";
import { initializeLucia } from "@/lib/auth";
import { WatchlistRepository } from "@/db/repositories/watchlist";
import { AddWatchlistDialog } from "@/components/shared/add-watchlist-dialog";
import { WatchlistClient } from "@/components/shared/watchlist-client";

export const dynamic = "force-dynamic";

export default async function WatchlistPage() {
  const db = getDb();
  const lucia = initializeLucia(db);

  const cookieStore = await cookies();
  const sessionId = cookieStore.get(lucia.sessionCookieName)?.value ?? null;
  if (!sessionId) return redirect("/login");

  const { user } = await lucia.validateSession(sessionId);
  if (!user) return redirect("/login");

  const watchlistRepo = new WatchlistRepository(db);
  const items = await watchlistRepo.getItems(user.id);

  const watchlistData = items.map((item) => ({
    id: item.id,
    symbol: item.symbol,
    convictionLevel: item.convictionLevel,
    notes: item.notes || "",
    addedAt: item.addedAt.toISOString(),
  }));

  return (
    <div className="p-4 md:p-6 lg:p-10 max-w-7xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Watchlist</h1>
          <p className="text-sm text-[var(--on-surface-variant)]">{items.length} symbols</p>
        </div>
        <AddWatchlistDialog />
      </div>
      <WatchlistClient items={watchlistData} />
    </div>
  );
}
