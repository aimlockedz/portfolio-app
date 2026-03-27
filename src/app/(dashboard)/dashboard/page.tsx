import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getDb } from "@/db/db";
import { initializeLucia } from "@/lib/auth";
import { PortfolioRepository } from "@/db/repositories/portfolio";
import { WatchlistRepository } from "@/db/repositories/watchlist";
import { Briefcase, TrendingUp, History, Wallet } from "lucide-react";
import { MarketOverview } from "@/components/shared/market-overview";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const db = getDb();
  const lucia = initializeLucia(db);

  const cookieStore = await cookies();
  const sessionId = cookieStore.get(lucia.sessionCookieName)?.value ?? null;
  if (!sessionId) return redirect("/login");

  const sessionData = await lucia.validateSession(sessionId);
  const user = sessionData.user;
  if (!user) return redirect("/login");

  const portfolioRepo = new PortfolioRepository(db);
  const watchlistRepo = new WatchlistRepository(db);

  const [holdings, transactions, watchlist] = await Promise.all([
    portfolioRepo.getHoldings(user.id),
    portfolioRepo.getTransactions(user.id),
    watchlistRepo.getItems(user.id),
  ]);

  const totalValue = (holdings || []).reduce(
    (sum, h) => sum + h.totalQuantity * h.averageCost,
    0
  );
  const recentTransactions = (transactions || []).slice(-5).reverse();
  const topWatchlist = (watchlist || []).slice(0, 5);

  return (
    <div className="p-6 lg:p-10 space-y-6 max-w-7xl">
      {/* Header */}
      <div>
        <h1 className="font-[var(--font-headline)] text-3xl font-bold tracking-tight">
          Dashboard
        </h1>
        <p className="text-sm text-[var(--on-surface-variant)] mt-1">
          Welcome back! Here&apos;s your portfolio overview.
        </p>
      </div>

      {/* Market Overview */}
      <MarketOverview />

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Portfolio Value */}
        <div className="rounded-2xl bg-gradient-to-br from-[var(--primary)] to-[var(--primary-container)] p-5 text-[var(--primary-foreground)]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium opacity-80">Portfolio Value</span>
            <Briefcase className="h-4 w-4 opacity-60" />
          </div>
          <p className="font-[var(--font-headline)] text-2xl font-extrabold">
            ${(totalValue / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[10px] mt-1.5 opacity-70">{holdings.length} symbols held</p>
        </div>

        {/* Watchlist */}
        <div className="rounded-2xl bg-[var(--card)] p-5 border border-[var(--border)]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-[var(--on-surface-variant)]">Watchlist</span>
            <div className="w-7 h-7 rounded-full bg-[var(--primary-container)] flex items-center justify-center">
              <TrendingUp className="h-3.5 w-3.5 text-[var(--primary)]" />
            </div>
          </div>
          <p className="font-[var(--font-headline)] text-2xl font-bold">{watchlist.length}</p>
          <p className="text-[10px] mt-1.5 text-[var(--on-surface-variant)]">Monitoring</p>
        </div>

        {/* Transactions */}
        <div className="rounded-2xl bg-[var(--card)] p-5 border border-[var(--border)]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-[var(--on-surface-variant)]">Transactions</span>
            <div className="w-7 h-7 rounded-full bg-[var(--surface-container-high)] flex items-center justify-center">
              <History className="h-3.5 w-3.5 text-[var(--on-surface-variant)]" />
            </div>
          </div>
          <p className="font-[var(--font-headline)] text-2xl font-bold">{transactions.length}</p>
          <p className="text-[10px] mt-1.5 text-[var(--on-surface-variant)]">Total trades</p>
        </div>

        {/* Cash */}
        <div className="rounded-2xl bg-[var(--card)] p-5 border border-[var(--border)]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-[var(--on-surface-variant)]">Cash Position</span>
            <div className="w-7 h-7 rounded-full bg-[var(--surface-container-high)] flex items-center justify-center">
              <Wallet className="h-3.5 w-3.5 text-[var(--on-surface-variant)]" />
            </div>
          </div>
          <p className="font-[var(--font-headline)] text-2xl font-bold">$0.00</p>
          <p className="text-[10px] mt-1.5 text-[var(--on-surface-variant)]">Available</p>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid gap-4 lg:grid-cols-5">
        {/* Recent Transactions */}
        <div className="lg:col-span-3 rounded-2xl bg-[var(--card)] p-5 border border-[var(--border)]">
          <h2 className="font-[var(--font-headline)] font-bold text-base mb-4">
            Recent Transactions
          </h2>
          <div className="space-y-2">
            {recentTransactions.length === 0 ? (
              <p className="text-sm text-[var(--on-surface-variant)] text-center py-6">
                No recent activity.
              </p>
            ) : (
              recentTransactions.map((tx: any) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between rounded-xl bg-[var(--surface-container-low)] px-4 py-2.5"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        tx.type === "BUY"
                          ? "bg-[var(--primary-container)] text-[var(--primary)]"
                          : "bg-red-500/10 text-red-400"
                      }`}
                    >
                      {tx.type === "BUY" ? "B" : "S"}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{tx.symbol}</p>
                      <p className="text-[10px] text-[var(--on-surface-variant)]">
                        {tx.date.toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm">
                      ${((tx.quantity * tx.price) / 100).toFixed(2)}
                    </p>
                    <p className="text-[10px] text-[var(--on-surface-variant)]">
                      {tx.quantity} shares
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Watchlist Priority */}
        <div className="lg:col-span-2 rounded-2xl bg-[var(--card)] p-5 border border-[var(--border)]">
          <h2 className="font-[var(--font-headline)] font-bold text-base mb-4">
            Watchlist Priority
          </h2>
          <div className="space-y-2">
            {topWatchlist.length === 0 ? (
              <p className="text-sm text-[var(--on-surface-variant)] text-center py-6">
                Watchlist is empty.
              </p>
            ) : (
              topWatchlist.map((item: any) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-xl bg-[var(--surface-container-low)] px-4 py-2.5"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-[var(--primary-container)] flex items-center justify-center text-[10px] font-bold text-[var(--primary)]">
                      {item.symbol.slice(0, 2)}
                    </div>
                    <span className="font-semibold text-sm">{item.symbol}</span>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                      item.convictionLevel >= 4
                        ? "bg-[var(--primary-container)] text-[var(--primary)]"
                        : "bg-[var(--surface-container-high)] text-[var(--on-surface-variant)]"
                    }`}
                  >
                    Lv.{item.convictionLevel}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
