"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DollarSign, BarChart3, Activity, TrendingUp, TrendingDown,
  Bell, BellRing, CalendarDays, Clock, ArrowRight,
} from "lucide-react";
import { MarketOverview } from "./market-overview";
import { PortfolioHistoryChart } from "./portfolio-history-chart";
import { CorrelationMatrix } from "./correlation-matrix";
import { DividendCalendar } from "./dividend-calendar";
import { AllocationTarget } from "./allocation-target";

interface Holding {
  id: string;
  symbol: string;
  totalQuantity: number;
  averageCost: number;
}

interface QuoteData {
  currentPrice: number;
  change: number;
  changePercent: number;
}

interface ProfileData {
  industry: string;
  name: string;
}

interface Alert {
  id: string;
  symbol: string;
  targetPrice: number;
  direction: string;
}

interface EarningsEvent {
  symbol: string;
  date: string;
  hour: string;
  epsEstimate: number | null;
  epsActual: number | null;
}

const HOUR_ICONS: Record<string, string> = { bmo: "🌅", amc: "🌙", dmh: "☀️" };
const HOUR_LABELS: Record<string, string> = { bmo: "Before Open", amc: "After Close", dmh: "During Market" };

export function DashboardClient({ holdings }: { holdings: Holding[] }) {
  const router = useRouter();
  const [quotes, setQuotes] = useState<Record<string, QuoteData>>({});
  const [profiles, setProfiles] = useState<Record<string, ProfileData>>({});
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [alertChecks, setAlertChecks] = useState<Record<string, { currentPrice: number; hit: boolean }>>({});
  const [earnings, setEarnings] = useState<EarningsEvent[]>([]);
  const [earningsLoading, setEarningsLoading] = useState(true);

  // Fetch quotes + profiles for holdings
  useEffect(() => {
    async function fetchData() {
      if (holdings.length === 0) { setLoading(false); return; }

      const quoteMap: Record<string, QuoteData> = {};
      const profileMap: Record<string, ProfileData> = {};

      await Promise.all(
        holdings.map(async (h) => {
          try {
            const [qRes, pRes] = await Promise.all([
              fetch(`/api/stock/quote?symbol=${h.symbol}`),
              fetch(`/api/stock/profile?symbol=${h.symbol}`),
            ]);
            const qData = await qRes.json();
            const pData = await pRes.json();
            if (qData.currentPrice) {
              quoteMap[h.symbol] = { currentPrice: qData.currentPrice, change: qData.change, changePercent: qData.changePercent };
            }
            if (pData.industry) {
              profileMap[h.symbol] = { industry: pData.industry, name: pData.name || h.symbol };
            }
          } catch { /* skip */ }
        })
      );
      setQuotes(quoteMap);
      setProfiles(profileMap);
      setLoading(false);
    }
    fetchData();
  }, [holdings]);

  // Fetch alerts
  useEffect(() => {
    fetch("/api/portfolio/alerts")
      .then((r) => r.json())
      .then(async (data) => {
        const alertList: Alert[] = data.alerts || [];
        setAlerts(alertList);
        // Check prices
        const symbols = [...new Set(alertList.map((a) => a.symbol))];
        const checks: Record<string, { currentPrice: number; hit: boolean }> = {};
        await Promise.all(
          symbols.map(async (sym) => {
            try {
              const res = await fetch(`/api/stock/quote?symbol=${sym}`);
              const d = await res.json();
              if (d.currentPrice) {
                alertList.filter((a) => a.symbol === sym).forEach((a) => {
                  const target = a.targetPrice / 100;
                  checks[a.id] = {
                    currentPrice: d.currentPrice,
                    hit: a.direction === "above" ? d.currentPrice >= target : d.currentPrice <= target,
                  };
                });
              }
            } catch { /* skip */ }
          })
        );
        setAlertChecks(checks);
      })
      .catch(() => {});
  }, []);

  // Fetch this week's earnings
  useEffect(() => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    const friday = new Date(monday);
    friday.setDate(monday.getDate() + 4);

    const from = monday.toISOString().split("T")[0];
    const to = friday.toISOString().split("T")[0];

    fetch(`/api/market/earnings?from=${from}&to=${to}`)
      .then((r) => r.json())
      .then((d) => setEarnings((d.earnings || []).slice(0, 8)))
      .catch(() => {})
      .finally(() => setEarningsLoading(false));
  }, []);

  // Calculate P&L
  const rows = holdings.map((h) => {
    const quote = quotes[h.symbol];
    const totalCost = (h.totalQuantity * h.averageCost) / 100;
    const marketPrice = quote?.currentPrice ?? 0;
    const marketValue = marketPrice ? h.totalQuantity * marketPrice : 0;
    const pnl = marketValue - totalCost;
    const pnlPercent = totalCost > 0 ? (pnl / totalCost) * 100 : 0;
    const dayChange = quote ? quote.change * h.totalQuantity : 0;
    return { ...h, totalCost, marketPrice, marketValue, pnl, pnlPercent, dayChange, quote };
  });

  const totalCost = rows.reduce((s, r) => s + r.totalCost, 0);
  const totalValue = rows.reduce((s, r) => s + r.marketValue, 0);
  const totalPnL = totalValue - totalCost;
  const totalPnLPct = totalCost > 0 ? (totalPnL / totalCost) * 100 : 0;
  const totalDayChange = rows.reduce((s, r) => s + r.dayChange, 0);

  // Best / Worst
  const sorted = [...rows].filter((r) => r.marketPrice > 0).sort((a, b) => b.pnlPercent - a.pnlPercent);
  const topPerformer = sorted[0];
  const bottomPerformer = sorted.length > 1 ? sorted[sorted.length - 1] : null;

  // Triggered alerts
  const triggeredAlerts = alerts.filter((a) => alertChecks[a.id]?.hit);

  return (
    <div className="space-y-6">
      {/* Market Overview */}
      <MarketOverview />

      {/* P&L Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-xl bg-gradient-to-br from-[var(--primary)] to-[var(--primary-container)] p-4 text-[var(--primary-foreground)]">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-3.5 w-3.5 opacity-70" />
            <span className="text-[10px] uppercase tracking-wider font-medium opacity-80">Portfolio Value</span>
          </div>
          <p className="font-[var(--font-headline)] text-xl font-bold">
            {loading ? "..." : `$${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          </p>
          <p className="text-[10px] mt-0.5 opacity-60">{holdings.length} symbols held</p>
        </div>

        <div className="rounded-xl bg-[var(--card)] border border-[var(--border)] p-4">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="h-3.5 w-3.5 text-[var(--on-surface-variant)]" />
            <span className="text-[10px] uppercase tracking-wider text-[var(--on-surface-variant)] font-medium">Total Cost</span>
          </div>
          <p className="font-[var(--font-headline)] text-xl font-bold">
            ${totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>

        <div className="rounded-xl bg-[var(--card)] border border-[var(--border)] p-4">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="h-3.5 w-3.5 text-[var(--on-surface-variant)]" />
            <span className="text-[10px] uppercase tracking-wider text-[var(--on-surface-variant)] font-medium">Total P&L</span>
          </div>
          <p className={`font-[var(--font-headline)] text-xl font-bold ${loading ? "" : totalPnL >= 0 ? "text-emerald-400" : "text-red-400"}`}>
            {loading ? "..." : `${totalPnL >= 0 ? "+" : ""}$${totalPnL.toFixed(2)}`}
          </p>
          {!loading && (
            <p className={`text-[10px] mt-0.5 ${totalPnL >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {totalPnL >= 0 ? "+" : ""}{totalPnLPct.toFixed(2)}%
            </p>
          )}
        </div>

        <div className="rounded-xl bg-[var(--card)] border border-[var(--border)] p-4">
          <div className="flex items-center gap-2 mb-2">
            {totalDayChange >= 0 ? <TrendingUp className="h-3.5 w-3.5 text-emerald-400" /> : <TrendingDown className="h-3.5 w-3.5 text-red-400" />}
            <span className="text-[10px] uppercase tracking-wider text-[var(--on-surface-variant)] font-medium">Today&apos;s Change</span>
          </div>
          <p className={`font-[var(--font-headline)] text-xl font-bold ${loading ? "" : totalDayChange >= 0 ? "text-emerald-400" : "text-red-400"}`}>
            {loading ? "..." : `${totalDayChange >= 0 ? "+" : ""}$${totalDayChange.toFixed(2)}`}
          </p>
        </div>
      </div>

      {/* Portfolio History Chart */}
      {holdings.length > 0 && <PortfolioHistoryChart />}

      {/* Best/Worst + Alerts + Earnings */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Best/Worst Performers */}
        <div className="rounded-xl bg-[var(--card)] border border-[var(--border)] p-5">
          <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
            <Activity className="h-4 w-4 text-[var(--primary)]" />
            Top Performers
          </h3>
          {loading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-16 rounded-xl bg-[var(--surface-container-high)] animate-pulse" />
              ))}
            </div>
          ) : !topPerformer ? (
            <p className="text-sm text-[var(--on-surface-variant)] text-center py-4">No data yet</p>
          ) : (
            <div className="space-y-3">
              <div
                className="rounded-xl bg-emerald-500/5 border border-emerald-500/10 p-3.5 cursor-pointer hover:border-emerald-500/20 transition-all"
                onClick={() => router.push(`/stock/${topPerformer.symbol}`)}
              >
                <p className="text-[10px] uppercase tracking-wider text-emerald-400 font-medium mb-1.5">Best</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-sm">{topPerformer.symbol}</p>
                    <p className="text-[10px] text-[var(--on-surface-variant)]">{profiles[topPerformer.symbol]?.name || ""}</p>
                  </div>
                  <span className="text-lg font-bold text-emerald-400">
                    {topPerformer.pnlPercent >= 0 ? "+" : ""}{topPerformer.pnlPercent.toFixed(1)}%
                  </span>
                </div>
              </div>
              {bottomPerformer && (
                <div
                  className="rounded-xl bg-red-500/5 border border-red-500/10 p-3.5 cursor-pointer hover:border-red-500/20 transition-all"
                  onClick={() => router.push(`/stock/${bottomPerformer.symbol}`)}
                >
                  <p className="text-[10px] uppercase tracking-wider text-red-400 font-medium mb-1.5">Worst</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-sm">{bottomPerformer.symbol}</p>
                      <p className="text-[10px] text-[var(--on-surface-variant)]">{profiles[bottomPerformer.symbol]?.name || ""}</p>
                    </div>
                    <span className="text-lg font-bold text-red-400">
                      {bottomPerformer.pnlPercent >= 0 ? "+" : ""}{bottomPerformer.pnlPercent.toFixed(1)}%
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Triggered Alerts */}
        <div className="rounded-xl bg-[var(--card)] border border-[var(--border)] p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm flex items-center gap-2">
              <Bell className="h-4 w-4 text-[var(--primary)]" />
              Price Alerts
            </h3>
            <button
              onClick={() => router.push("/alerts")}
              className="text-[10px] font-semibold text-[var(--primary)] flex items-center gap-0.5 hover:opacity-80"
            >
              View All <ArrowRight className="h-3 w-3" />
            </button>
          </div>
          {triggeredAlerts.length > 0 ? (
            <div className="space-y-2">
              {triggeredAlerts.slice(0, 4).map((a) => {
                const check = alertChecks[a.id];
                return (
                  <div key={a.id} className="flex items-center gap-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10 px-3 py-2.5">
                    <BellRing className="h-4 w-4 text-emerald-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="font-bold text-sm">{a.symbol}</p>
                      <p className="text-[10px] text-[var(--on-surface-variant)]">
                        {a.direction === "above" ? "↑" : "↓"} ${(a.targetPrice / 100).toFixed(2)} · Now ${check?.currentPrice.toFixed(2)}
                      </p>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-400 shrink-0 animate-pulse">HIT!</span>
                  </div>
                );
              })}
            </div>
          ) : alerts.length > 0 ? (
            <div className="space-y-2">
              {alerts.slice(0, 4).map((a) => {
                const check = alertChecks[a.id];
                return (
                  <div key={a.id} className="flex items-center gap-3 rounded-lg bg-[var(--surface-container-low)] px-3 py-2.5">
                    <Bell className="h-4 w-4 text-[var(--on-surface-variant)] shrink-0" />
                    <div className="min-w-0">
                      <p className="font-bold text-sm">{a.symbol}</p>
                      <p className="text-[10px] text-[var(--on-surface-variant)]">
                        {a.direction === "above" ? "↑ Above" : "↓ Below"} ${(a.targetPrice / 100).toFixed(2)}
                        {check && ` · Now $${check.currentPrice.toFixed(2)}`}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-[var(--on-surface-variant)] text-center py-6">
              No alerts set yet
            </p>
          )}
        </div>

        {/* Earnings This Week */}
        <div className="rounded-xl bg-[var(--card)] border border-[var(--border)] p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-[var(--primary)]" />
              Earnings This Week
            </h3>
            <button
              onClick={() => router.push("/earnings")}
              className="text-[10px] font-semibold text-[var(--primary)] flex items-center gap-0.5 hover:opacity-80"
            >
              View All <ArrowRight className="h-3 w-3" />
            </button>
          </div>
          {earningsLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-10 rounded-lg bg-[var(--surface-container-high)] animate-pulse" />
              ))}
            </div>
          ) : earnings.length === 0 ? (
            <p className="text-sm text-[var(--on-surface-variant)] text-center py-6">
              No earnings this week
            </p>
          ) : (
            <div className="space-y-1.5">
              {earnings.map((e, i) => (
                <div
                  key={`${e.symbol}-${i}`}
                  className="flex items-center justify-between rounded-lg bg-[var(--surface-container-low)] px-3 py-2 cursor-pointer hover:bg-[var(--surface-container)] transition-all"
                  onClick={() => router.push(`/stock/${e.symbol}`)}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-[var(--primary-container)] flex items-center justify-center text-[9px] font-bold text-[var(--primary)]">
                      {e.symbol.slice(0, 2)}
                    </div>
                    <div>
                      <p className="font-bold text-xs">{e.symbol}</p>
                      <p className="text-[9px] text-[var(--on-surface-variant)]">
                        {HOUR_ICONS[e.hour] || "📅"} {HOUR_LABELS[e.hour] || e.hour}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-[var(--on-surface-variant)]">{e.date}</p>
                    {e.epsActual !== null ? (
                      <p className={`text-[10px] font-bold ${e.epsEstimate !== null && e.epsActual > e.epsEstimate ? "text-emerald-400" : "text-red-400"}`}>
                        ${e.epsActual.toFixed(2)}
                      </p>
                    ) : e.epsEstimate !== null ? (
                      <p className="text-[10px] text-[var(--on-surface-variant)] flex items-center gap-0.5">
                        <Clock className="h-2.5 w-2.5" /> Est. ${e.epsEstimate.toFixed(2)}
                      </p>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Allocation Target */}
      {holdings.length > 0 && (
        <AllocationTarget holdings={holdings} quotes={quotes} profiles={profiles} />
      )}

      {/* Correlation Matrix + Dividend Calendar */}
      {holdings.length >= 2 && (
        <div className="grid lg:grid-cols-2 gap-4">
          <CorrelationMatrix symbols={holdings.map((h) => h.symbol)} />
          <DividendCalendar symbols={holdings.map((h) => h.symbol)} />
        </div>
      )}
      {holdings.length === 1 && (
        <DividendCalendar symbols={holdings.map((h) => h.symbol)} />
      )}
    </div>
  );
}
