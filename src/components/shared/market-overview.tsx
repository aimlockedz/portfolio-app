"use client";

import { useEffect, useState, useCallback } from "react";
import { TrendingUp, TrendingDown, Minus, RefreshCw } from "lucide-react";

interface MarketItem {
  symbol: string;
  name: string;
  short: string;
  price: number;
  change: number;
  changePercent: number;
}

const ICONS: Record<string, string> = {
  "S&P 500": "📊",
  "Dow": "🏛️",
  "Nasdaq": "💻",
  "Gold": "🥇",
  "Silver": "🥈",
  "Crude Oil": "🛢️",
};

const REFRESH_INTERVAL = 30_000; // 30 seconds

export function MarketOverview() {
  const [markets, setMarkets] = useState<MarketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const res = await fetch("/api/market/overview", { cache: "no-store" });
      const d = await res.json();
      setMarkets(d.markets || []);
      setLastUpdate(new Date());
    } catch { /* skip */ }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    fetchData();
    // Auto-refresh every 30 seconds
    const timer = window.setInterval(() => fetchData(true), REFRESH_INTERVAL);
    return () => clearInterval(timer);
  }, [fetchData]);

  if (loading && markets.length === 0) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="rounded-xl bg-[var(--card)] border border-[var(--border)] p-3 animate-pulse">
            <div className="h-3 w-12 bg-[var(--surface-container-high)] rounded mb-2" />
            <div className="h-5 w-16 bg-[var(--surface-container-high)] rounded mb-1" />
            <div className="h-3 w-14 bg-[var(--surface-container-high)] rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (markets.length === 0) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-[var(--on-surface-variant)] font-medium">Market Overview</span>
          {refreshing && <RefreshCw className="h-2.5 w-2.5 text-[var(--primary)] animate-spin" />}
        </div>
        <div className="flex items-center gap-2">
          {lastUpdate && (
            <span className="text-[9px] text-[var(--on-surface-variant)]">
              Updated {lastUpdate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </span>
          )}
          <button
            onClick={() => fetchData(true)}
            className="p-1 rounded hover:bg-[var(--surface-container-high)] transition-colors"
            title="Refresh now"
          >
            <RefreshCw className={`h-3 w-3 text-[var(--on-surface-variant)] ${refreshing ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {markets.map((m) => {
          const positive = m.change > 0;
          const neutral = m.change === 0;
          return (
            <div
              key={m.symbol}
              className="rounded-xl bg-[var(--card)] border border-[var(--border)] p-3 hover:border-[var(--primary)]/30 transition-all"
            >
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="text-sm">{ICONS[m.short] || "📈"}</span>
                <span className="text-[10px] font-medium text-[var(--on-surface-variant)] truncate">{m.short}</span>
              </div>
              <p className="font-[var(--font-headline)] font-bold text-sm">
                {m.price >= 1000 ? m.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : m.price.toFixed(2)}
              </p>
              <div className="flex items-center gap-1 mt-1">
                {neutral ? (
                  <Minus className="h-3 w-3 text-[var(--on-surface-variant)]" />
                ) : positive ? (
                  <TrendingUp className="h-3 w-3 text-emerald-400" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-400" />
                )}
                <span className={`text-[11px] font-semibold ${positive ? "text-emerald-400" : neutral ? "text-[var(--on-surface-variant)]" : "text-red-400"}`}>
                  {positive ? "+" : ""}{m.changePercent.toFixed(2)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
