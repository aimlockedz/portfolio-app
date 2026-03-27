"use client";

import { useEffect, useState } from "react";
import { Bell, BellRing, Plus, Trash2, TrendingUp, TrendingDown, X } from "lucide-react";

interface Alert {
  id: string;
  symbol: string;
  targetPrice: number; // cents
  direction: string;
  active: number;
  triggered: number;
  createdAt: string;
}

interface QuoteCheck {
  symbol: string;
  currentPrice: number;
  hit: boolean;
}

export function AlertsClient() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [symbol, setSymbol] = useState("");
  const [targetPrice, setTargetPrice] = useState("");
  const [direction, setDirection] = useState<"above" | "below">("above");
  const [creating, setCreating] = useState(false);
  const [quoteChecks, setQuoteChecks] = useState<Record<string, QuoteCheck>>({});

  async function loadAlerts() {
    try {
      const res = await fetch("/api/portfolio/alerts");
      const data = await res.json();
      setAlerts(data.alerts || []);
    } catch { /* ignore */ }
    setLoading(false);
  }

  async function checkPrices(alertList: Alert[]) {
    const symbols = [...new Set(alertList.map((a) => a.symbol))];
    const checks: Record<string, QuoteCheck> = {};

    await Promise.all(
      symbols.map(async (sym) => {
        try {
          const res = await fetch(`/api/stock/quote?symbol=${sym}`);
          const data = await res.json();
          if (data.currentPrice) {
            const relatedAlerts = alertList.filter((a) => a.symbol === sym);
            relatedAlerts.forEach((a) => {
              const target = a.targetPrice / 100;
              const hit =
                a.direction === "above"
                  ? data.currentPrice >= target
                  : data.currentPrice <= target;
              checks[a.id] = { symbol: sym, currentPrice: data.currentPrice, hit };
            });
          }
        } catch { /* ignore */ }
      })
    );

    setQuoteChecks(checks);
  }

  useEffect(() => {
    loadAlerts().then(() => {});
  }, []);

  useEffect(() => {
    if (alerts.length > 0) {
      checkPrices(alerts);
    }
  }, [alerts]);

  async function createAlert() {
    if (!symbol || !targetPrice) return;
    setCreating(true);
    try {
      await fetch("/api/portfolio/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol: symbol.toUpperCase(),
          targetPrice: parseFloat(targetPrice),
          direction,
        }),
      });
      setSymbol("");
      setTargetPrice("");
      setShowForm(false);
      await loadAlerts();
    } catch { /* ignore */ }
    setCreating(false);
  }

  async function deleteAlert(id: string) {
    await fetch("/api/portfolio/alerts", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl bg-[var(--card)] border border-[var(--border)] p-4 animate-pulse">
            <div className="h-5 w-24 bg-[var(--surface-container-high)] rounded mb-2" />
            <div className="h-4 w-40 bg-[var(--surface-container-high)] rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Add Alert Button */}
      <button
        onClick={() => setShowForm(!showForm)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] font-semibold text-sm hover:opacity-90 transition-all"
      >
        {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
        {showForm ? "Cancel" : "New Alert"}
      </button>

      {/* Create Form */}
      {showForm && (
        <div className="rounded-xl bg-[var(--card)] border border-[var(--border)] p-5 space-y-4">
          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] uppercase tracking-wider text-[var(--on-surface-variant)] font-medium mb-1 block">Symbol</label>
              <input
                type="text"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                placeholder="AAPL"
                className="w-full px-3 py-2 rounded-lg bg-[var(--surface-container)] border border-[var(--border)] text-sm font-semibold outline-none focus:border-[var(--primary)]"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-[var(--on-surface-variant)] font-medium mb-1 block">Target Price ($)</label>
              <input
                type="number"
                step="0.01"
                value={targetPrice}
                onChange={(e) => setTargetPrice(e.target.value)}
                placeholder="150.00"
                className="w-full px-3 py-2 rounded-lg bg-[var(--surface-container)] border border-[var(--border)] text-sm font-semibold outline-none focus:border-[var(--primary)]"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-[var(--on-surface-variant)] font-medium mb-1 block">Direction</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setDirection("above")}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold transition-all ${
                    direction === "above"
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : "bg-[var(--surface-container)] text-[var(--on-surface-variant)] border border-[var(--border)]"
                  }`}
                >
                  <TrendingUp className="h-3.5 w-3.5" /> Above
                </button>
                <button
                  onClick={() => setDirection("below")}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold transition-all ${
                    direction === "below"
                      ? "bg-red-500/10 text-red-400 border border-red-500/20"
                      : "bg-[var(--surface-container)] text-[var(--on-surface-variant)] border border-[var(--border)]"
                  }`}
                >
                  <TrendingDown className="h-3.5 w-3.5" /> Below
                </button>
              </div>
            </div>
          </div>
          <button
            onClick={createAlert}
            disabled={creating || !symbol || !targetPrice}
            className="px-5 py-2.5 rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] font-semibold text-sm hover:opacity-90 transition-all disabled:opacity-50"
          >
            {creating ? "Creating..." : "Create Alert"}
          </button>
        </div>
      )}

      {/* Alerts List */}
      {alerts.length === 0 ? (
        <div className="text-center py-16 text-[var(--on-surface-variant)]">
          <Bell className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium">No alerts set</p>
          <p className="text-sm mt-1">Create an alert to monitor stock prices.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {alerts.map((alert) => {
            const check = quoteChecks[alert.id];
            const target = alert.targetPrice / 100;
            const isTriggered = check?.hit;

            return (
              <div
                key={alert.id}
                className={`rounded-xl bg-[var(--card)] border p-4 flex items-center justify-between transition-all ${
                  isTriggered
                    ? "border-emerald-500/30 bg-emerald-500/5"
                    : "border-[var(--border)]"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      isTriggered
                        ? "bg-emerald-500/10"
                        : "bg-[var(--surface-container-high)]"
                    }`}
                  >
                    {isTriggered ? (
                      <BellRing className="h-5 w-5 text-emerald-400" />
                    ) : (
                      <Bell className="h-5 w-5 text-[var(--on-surface-variant)]" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm">{alert.symbol}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          alert.direction === "above"
                            ? "bg-emerald-500/10 text-emerald-400"
                            : "bg-red-500/10 text-red-400"
                        }`}
                      >
                        {alert.direction === "above" ? "↑ Above" : "↓ Below"} ${target.toFixed(2)}
                      </span>
                      {isTriggered && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 animate-pulse">
                          TRIGGERED!
                        </span>
                      )}
                    </div>
                    {check && (
                      <p className="text-[11px] text-[var(--on-surface-variant)] mt-0.5">
                        Current: ${check.currentPrice.toFixed(2)}
                        {!isTriggered && (
                          <span>
                            {" "}
                            ({alert.direction === "above" ? "needs +" : "needs -"}$
                            {Math.abs(target - check.currentPrice).toFixed(2)})
                          </span>
                        )}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => deleteAlert(alert.id)}
                  className="p-2 rounded-full hover:bg-red-500/10 text-[var(--on-surface-variant)] hover:text-red-400 transition-all"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
