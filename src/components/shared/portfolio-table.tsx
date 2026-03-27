"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { TrendingUp, TrendingDown, Minus, PieChart, Trash2, Bell, BellRing } from "lucide-react";
import { useToast } from "@/components/ui/toast-provider";

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

const SECTOR_COLORS = [
  "#7dd4ac", "#3b82f6", "#f59e0b", "#8b5cf6", "#ef4444",
  "#06b6d4", "#ec4899", "#14b8a6", "#f97316", "#6366f1",
  "#84cc16", "#a855f7",
];

const PIE_COLORS = [
  "#7dd4ac", "#3b82f6", "#f59e0b", "#8b5cf6", "#ef4444",
  "#06b6d4", "#ec4899", "#14b8a6", "#f97316", "#6366f1",
  "#84cc16", "#a855f7", "#10b981", "#f43f5e", "#0ea5e9",
];

// SVG Donut Chart for Sectors
function DonutChart({ data }: { data: { label: string; value: number; color: string }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return null;

  const R = 80;
  const STROKE = 28;
  const C = 2 * Math.PI * R;
  let offset = 0;

  return (
    <div className="flex flex-col items-center gap-4">
      <svg width="200" height="200" viewBox="0 0 200 200">
        {data.map((d, i) => {
          const pct = d.value / total;
          const dashLen = pct * C;
          const dashOffset = -offset;
          offset += dashLen;
          return (
            <circle
              key={i}
              cx="100" cy="100" r={R}
              fill="none"
              stroke={d.color}
              strokeWidth={STROKE}
              strokeDasharray={`${dashLen} ${C - dashLen}`}
              strokeDashoffset={dashOffset}
              transform="rotate(-90 100 100)"
              className="transition-all duration-500"
            />
          );
        })}
        <text x="100" y="94" textAnchor="middle" className="fill-[var(--foreground)]" fontSize="22" fontWeight="800">
          {data.length}
        </text>
        <text x="100" y="114" textAnchor="middle" className="fill-[var(--on-surface-variant)]" fontSize="11">
          Sectors
        </text>
      </svg>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 w-full">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-2 min-w-0">
            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
            <span className="text-[11px] text-[var(--on-surface-variant)] truncate">{d.label}</span>
            <span className="text-[11px] font-bold ml-auto shrink-0">{((d.value / total) * 100).toFixed(0)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// SVG Pie Chart for Holdings Allocation
function HoldingsPieChart({ data }: { data: { symbol: string; value: number; pct: number; color: string }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return null;

  const R = 85;
  let cumulativeAngle = -90; // start from top

  const slices = data.map((d) => {
    const angle = (d.pct / 100) * 360;
    const startAngle = cumulativeAngle;
    const endAngle = cumulativeAngle + angle;
    cumulativeAngle = endAngle;

    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;
    const x1 = 100 + R * Math.cos(startRad);
    const y1 = 100 + R * Math.sin(startRad);
    const x2 = 100 + R * Math.cos(endRad);
    const y2 = 100 + R * Math.sin(endRad);
    const largeArc = angle > 180 ? 1 : 0;

    const midAngle = ((startAngle + endAngle) / 2) * Math.PI / 180;
    const labelR = R * 0.6;
    const labelX = 100 + labelR * Math.cos(midAngle);
    const labelY = 100 + labelR * Math.sin(midAngle);

    return {
      ...d,
      path: `M100,100 L${x1},${y1} A${R},${R} 0 ${largeArc},1 ${x2},${y2} Z`,
      labelX,
      labelY,
      angle,
    };
  });

  return (
    <div className="flex flex-col items-center gap-4">
      <svg width="220" height="220" viewBox="0 0 200 200">
        {slices.map((s, i) => (
          <g key={i}>
            <path
              d={s.path}
              fill={s.color}
              stroke="var(--card)"
              strokeWidth="2"
              className="transition-all duration-500 hover:opacity-80"
            />
            {s.angle > 20 && (
              <text
                x={s.labelX}
                y={s.labelY}
                textAnchor="middle"
                dominantBaseline="central"
                className="fill-white font-bold"
                fontSize="9"
                style={{ textShadow: "0 1px 3px rgba(0,0,0,0.5)" }}
              >
                {s.symbol}
              </text>
            )}
          </g>
        ))}
      </svg>

      {/* Legend with % */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 w-full">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-2 min-w-0">
            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
            <span className="text-[11px] font-bold">{d.symbol}</span>
            <span className="text-[11px] text-[var(--on-surface-variant)] ml-auto">{d.pct.toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function PortfolioTable({ holdings }: { holdings: Holding[] }) {
  const router = useRouter();
  const { confirm, success: toastSuccess, error: toastError } = useToast();
  const [quotes, setQuotes] = useState<Record<string, QuoteData>>({});
  const [profiles, setProfiles] = useState<Record<string, ProfileData>>({});
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [localHoldings, setLocalHoldings] = useState(holdings);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [alertChecks, setAlertChecks] = useState<Record<string, { hit: boolean; currentPrice: number }>>({});

  useEffect(() => {
    async function fetchData() {
      if (localHoldings.length === 0) { setLoading(false); return; }

      const quoteMap: Record<string, QuoteData> = {};
      const profileMap: Record<string, ProfileData> = {};

      await Promise.all(
        localHoldings.map(async (h) => {
          try {
            const [qRes, pRes] = await Promise.all([
              fetch(`/api/stock/quote?symbol=${h.symbol}`),
              fetch(`/api/stock/profile?symbol=${h.symbol}`),
            ]);
            const qData = await qRes.json();
            const pData = await pRes.json();

            if (qData.currentPrice) {
              quoteMap[h.symbol] = {
                currentPrice: qData.currentPrice,
                change: qData.change,
                changePercent: qData.changePercent,
              };
            }
            if (pData.industry) {
              profileMap[h.symbol] = {
                industry: pData.industry,
                name: pData.name || h.symbol,
              };
            }
          } catch { /* skip */ }
        })
      );
      setQuotes(quoteMap);
      setProfiles(profileMap);
      setLoading(false);
    }
    fetchData();
  }, [localHoldings]);

  // Fetch alerts for portfolio symbols
  useEffect(() => {
    fetch("/api/portfolio/alerts")
      .then((r) => r.json())
      .then(async (data) => {
        const alertList: Alert[] = data.alerts || [];
        const portfolioSymbols = new Set(localHoldings.map((h) => h.symbol));
        const relevant = alertList.filter((a) => portfolioSymbols.has(a.symbol));
        setAlerts(relevant);

        // Check if alerts are triggered
        const symbols = [...new Set(relevant.map((a) => a.symbol))];
        const checks: Record<string, { hit: boolean; currentPrice: number }> = {};
        await Promise.all(
          symbols.map(async (sym) => {
            try {
              const res = await fetch(`/api/stock/quote?symbol=${sym}`);
              const d = await res.json();
              if (d.currentPrice) {
                relevant.filter((a) => a.symbol === sym).forEach((a) => {
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
  }, [localHoldings]);

  async function deleteHolding(holdingId: string, symbol: string, e: React.MouseEvent) {
    e.stopPropagation();
    const ok = await confirm({
      title: "Remove Stock",
      message: `Remove ${symbol} and all its transactions from your portfolio? This action cannot be undone.`,
      confirmText: "Remove",
      cancelText: "Keep",
      variant: "danger",
      icon: "trash",
    });
    if (!ok) return;
    setDeleting(holdingId);
    try {
      const res = await fetch("/api/portfolio/holdings", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ holdingId }),
      });
      if (res.ok) {
        setLocalHoldings((prev) => prev.filter((h) => h.id !== holdingId));
        toastSuccess("Stock Removed", `${symbol} has been removed from your portfolio.`);
      } else {
        toastError("Failed", "Could not remove the stock. Please try again.");
      }
    } catch {
      toastError("Error", "Something went wrong.");
    }
    setDeleting(null);
  }

  if (localHoldings.length === 0) {
    return (
      <div className="text-center py-16 text-[var(--on-surface-variant)]">
        <p className="text-lg font-medium">No holdings yet</p>
        <p className="text-sm mt-1">Add a transaction to get started.</p>
      </div>
    );
  }

  // Calculate totals
  const rows = localHoldings.map((h) => {
    const quote = quotes[h.symbol];
    const avgCost = h.averageCost / 100;
    const totalCost = (h.totalQuantity * h.averageCost) / 100;
    const marketPrice = quote?.currentPrice ?? 0;
    const marketValue = marketPrice ? h.totalQuantity * marketPrice : 0;
    const pnl = marketValue - totalCost;
    const pnlPercent = totalCost > 0 ? (pnl / totalCost) * 100 : 0;
    const industry = profiles[h.symbol]?.industry || "Other";

    return { ...h, avgCost, totalCost, marketPrice, marketValue, pnl, pnlPercent, industry, quote };
  });

  const totalValue = rows.reduce((s, r) => s + r.marketValue, 0);

  // Sector allocation
  const sectorMap: Record<string, number> = {};
  rows.forEach((r) => {
    const sector = r.industry || "Other";
    sectorMap[sector] = (sectorMap[sector] || 0) + r.marketValue;
  });
  const sectorData = Object.entries(sectorMap)
    .sort((a, b) => b[1] - a[1])
    .map(([label, value], i) => ({ label, value, color: SECTOR_COLORS[i % SECTOR_COLORS.length] }));

  // Holdings allocation pie data
  const holdingsPieData = rows
    .filter((r) => r.marketValue > 0)
    .sort((a, b) => b.marketValue - a.marketValue)
    .map((r, i) => ({
      symbol: r.symbol,
      value: r.marketValue,
      pct: totalValue > 0 ? (r.marketValue / totalValue) * 100 : 0,
      color: PIE_COLORS[i % PIE_COLORS.length],
    }));

  // Get triggered alerts by symbol
  const triggeredBySymbol: Record<string, Alert[]> = {};
  alerts.forEach((a) => {
    if (alertChecks[a.id]?.hit) {
      if (!triggeredBySymbol[a.symbol]) triggeredBySymbol[a.symbol] = [];
      triggeredBySymbol[a.symbol].push(a);
    }
  });

  return (
    <div className="space-y-6">
      {/* Triggered Alerts Banner */}
      {Object.keys(triggeredBySymbol).length > 0 && (
        <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/20 p-4">
          <div className="flex items-center gap-2 mb-2">
            <BellRing className="h-4 w-4 text-emerald-400" />
            <span className="font-bold text-sm text-emerald-400">Price Alerts Triggered!</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(triggeredBySymbol).map(([sym, symAlerts]) =>
              symAlerts.map((a) => (
                <span
                  key={a.id}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400"
                >
                  <BellRing className="h-3 w-3" />
                  {sym} {a.direction === "above" ? "↑" : "↓"} ${(a.targetPrice / 100).toFixed(2)} · Now ${alertChecks[a.id]?.currentPrice.toFixed(2)}
                </span>
              ))
            )}
          </div>
        </div>
      )}

      {/* Sector Allocation + Holdings Pie Chart */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Sector Donut */}
        <div className="rounded-xl bg-[var(--card)] border border-[var(--border)] p-5">
          <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
            <PieChart className="h-4 w-4 text-[var(--primary)]" />
            Sector Allocation
          </h3>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-3 border-[var(--primary)] border-t-transparent" />
            </div>
          ) : (
            <DonutChart data={sectorData} />
          )}
        </div>

        {/* Holdings Pie Chart */}
        <div className="rounded-xl bg-[var(--card)] border border-[var(--border)] p-5">
          <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
            <PieChart className="h-4 w-4 text-[var(--primary)]" />
            Holdings Allocation
          </h3>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-3 border-[var(--primary)] border-t-transparent" />
            </div>
          ) : (
            <HoldingsPieChart data={holdingsPieData} />
          )}
        </div>
      </div>

      {/* Holdings Table */}
      <div className="rounded-xl bg-[var(--card)] border border-[var(--border)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-[10px] font-semibold text-[var(--on-surface-variant)] uppercase tracking-wider">
                <th className="text-left px-5 py-3">Symbol</th>
                <th className="text-right px-3 py-3">Qty</th>
                <th className="text-right px-3 py-3">Avg Cost</th>
                <th className="text-right px-3 py-3">Price</th>
                <th className="text-right px-3 py-3">Value</th>
                <th className="text-right px-3 py-3">P&L</th>
                <th className="text-center px-3 py-3 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const hasTriggered = triggeredBySymbol[r.symbol]?.length > 0;
                return (
                  <tr
                    key={r.id}
                    onClick={() => router.push(`/stock/${r.symbol}`)}
                    className={`group border-t border-[var(--border)] hover:bg-[var(--surface-container-low)] transition-colors cursor-pointer ${
                      hasTriggered ? "bg-emerald-500/[0.03]" : ""
                    }`}
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-[var(--primary-container)] flex items-center justify-center text-[10px] font-bold text-[var(--primary)]">
                          {r.symbol.slice(0, 2)}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-sm">{r.symbol}</span>
                            {hasTriggered && (
                              <BellRing className="h-3 w-3 text-emerald-400 animate-pulse" />
                            )}
                          </div>
                          <p className="text-[10px] text-[var(--on-surface-variant)] truncate max-w-[120px]">
                            {profiles[r.symbol]?.name || ""}
                          </p>
                          {r.quote && (
                            <div className="flex items-center gap-1 mt-0.5">
                              {r.quote.change > 0 ? <TrendingUp className="h-2.5 w-2.5 text-emerald-400" /> : r.quote.change < 0 ? <TrendingDown className="h-2.5 w-2.5 text-red-400" /> : <Minus className="h-2.5 w-2.5 text-[var(--on-surface-variant)]" />}
                              <span className={`text-[10px] font-medium ${r.quote.change > 0 ? "text-emerald-400" : r.quote.change < 0 ? "text-red-400" : "text-[var(--on-surface-variant)]"}`}>
                                {r.quote.change > 0 ? "+" : ""}{r.quote.changePercent?.toFixed(2)}%
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="text-right px-3 py-3 text-sm">{r.totalQuantity}</td>
                    <td className="text-right px-3 py-3 text-sm text-[var(--on-surface-variant)]">${r.avgCost.toFixed(2)}</td>
                    <td className="text-right px-3 py-3 text-sm font-semibold">
                      {loading ? <div className="h-4 w-14 animate-pulse bg-[var(--surface-container-high)] rounded ml-auto" /> : r.marketPrice ? `$${r.marketPrice.toFixed(2)}` : "—"}
                    </td>
                    <td className="text-right px-3 py-3 text-sm font-semibold">
                      {loading ? <div className="h-4 w-14 animate-pulse bg-[var(--surface-container-high)] rounded ml-auto" /> : r.marketValue ? `$${r.marketValue.toFixed(2)}` : "—"}
                    </td>
                    <td className="text-right px-3 py-3">
                      {loading ? (
                        <div className="h-5 w-20 animate-pulse bg-[var(--surface-container-high)] rounded-full ml-auto" />
                      ) : r.marketPrice ? (
                        <span className={`inline-flex text-[11px] font-bold px-2.5 py-1 rounded-full ${r.pnl >= 0 ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
                          {r.pnl >= 0 ? "+" : ""}${r.pnl.toFixed(2)} ({r.pnlPercent.toFixed(1)}%)
                        </span>
                      ) : "—"}
                    </td>
                    <td className="text-center px-2 py-3">
                      <button
                        onClick={(e) => deleteHolding(r.id, r.symbol, e)}
                        disabled={deleting === r.id}
                        className="p-1.5 rounded-full hover:bg-red-500/10 text-[var(--on-surface-variant)] hover:text-red-400 transition-all opacity-0 group-hover:opacity-100"
                        style={{ opacity: deleting === r.id ? 0.5 : undefined }}
                        title="Remove from portfolio"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
