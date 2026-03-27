"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { TrendingUp, TrendingDown, Minus, PieChart } from "lucide-react";

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

const SECTOR_COLORS = [
  "#7dd4ac", "#3b82f6", "#f59e0b", "#8b5cf6", "#ef4444",
  "#06b6d4", "#ec4899", "#14b8a6", "#f97316", "#6366f1",
  "#84cc16", "#a855f7",
];

// SVG Donut Chart
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

export function PortfolioTable({ holdings }: { holdings: Holding[] }) {
  const router = useRouter();
  const [quotes, setQuotes] = useState<Record<string, QuoteData>>({});
  const [profiles, setProfiles] = useState<Record<string, ProfileData>>({});
  const [loading, setLoading] = useState(true);

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
  }, [holdings]);

  if (holdings.length === 0) {
    return (
      <div className="text-center py-16 text-[var(--on-surface-variant)]">
        <p className="text-lg font-medium">No holdings yet</p>
        <p className="text-sm mt-1">Add a transaction to get started.</p>
      </div>
    );
  }

  // Calculate totals
  const rows = holdings.map((h) => {
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

  return (
    <div className="space-y-6">
      {/* Sector Allocation + Holdings Allocation */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Sector Donut */}
        <div className="lg:col-span-1 rounded-xl bg-[var(--card)] border border-[var(--border)] p-5">
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

        {/* Holdings Allocation Bars */}
        <div className="lg:col-span-2 rounded-xl bg-[var(--card)] border border-[var(--border)] p-5">
          <h3 className="font-bold text-sm mb-4">Holdings Allocation</h3>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-5 bg-[var(--surface-container-high)] rounded-full animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {rows.filter((r) => r.marketValue > 0).sort((a, b) => b.marketValue - a.marketValue).map((r, i) => {
                const pct = totalValue > 0 ? (r.marketValue / totalValue) * 100 : 0;
                return (
                  <div key={r.id} className="flex items-center gap-3">
                    <span className="text-xs font-bold w-12">{r.symbol}</span>
                    <div className="flex-1 h-4 rounded-full bg-[var(--surface-container-high)] overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, backgroundColor: SECTOR_COLORS[i % SECTOR_COLORS.length] }}
                      />
                    </div>
                    <span className="text-[11px] font-semibold w-10 text-right">{pct.toFixed(1)}%</span>
                  </div>
                );
              })}
            </div>
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
                <th className="text-right px-5 py-3">P&L</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.id}
                  onClick={() => router.push(`/stock/${r.symbol}`)}
                  className="border-t border-[var(--border)] hover:bg-[var(--surface-container-low)] transition-colors cursor-pointer"
                >
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-[var(--primary-container)] flex items-center justify-center text-[10px] font-bold text-[var(--primary)]">
                        {r.symbol.slice(0, 2)}
                      </div>
                      <div>
                        <span className="font-bold text-sm">{r.symbol}</span>
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
                  <td className="text-right px-5 py-3">
                    {loading ? (
                      <div className="h-5 w-20 animate-pulse bg-[var(--surface-container-high)] rounded-full ml-auto" />
                    ) : r.marketPrice ? (
                      <span className={`inline-flex text-[11px] font-bold px-2.5 py-1 rounded-full ${r.pnl >= 0 ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
                        {r.pnl >= 0 ? "+" : ""}${r.pnl.toFixed(2)} ({r.pnlPercent.toFixed(1)}%)
                      </span>
                    ) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
