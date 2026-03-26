"use client";

import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

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

export function PortfolioTable({ holdings }: { holdings: Holding[] }) {
  const [quotes, setQuotes] = useState<Record<string, QuoteData>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchQuotes() {
      if (holdings.length === 0) { setLoading(false); return; }
      const quoteMap: Record<string, QuoteData> = {};
      await Promise.all(
        holdings.map(async (h) => {
          try {
            const res = await fetch(`/api/stock/quote?symbol=${h.symbol}`);
            const data = await res.json();
            if (data.currentPrice) {
              quoteMap[h.symbol] = {
                currentPrice: data.currentPrice,
                change: data.change,
                changePercent: data.changePercent,
              };
            }
          } catch { /* skip */ }
        })
      );
      setQuotes(quoteMap);
      setLoading(false);
    }
    fetchQuotes();
  }, [holdings]);

  if (holdings.length === 0) {
    return (
      <div className="text-center py-16 text-[var(--on-surface-variant)]">
        <p className="text-lg font-medium">No holdings yet</p>
        <p className="text-sm mt-1">Add a transaction to get started.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="text-xs font-semibold text-[var(--on-surface-variant)] uppercase tracking-wider">
            <th className="text-left px-6 py-4">Symbol</th>
            <th className="text-right px-4 py-4">Qty</th>
            <th className="text-right px-4 py-4">Avg Cost</th>
            <th className="text-right px-4 py-4">Market Price</th>
            <th className="text-right px-4 py-4">Total Cost</th>
            <th className="text-right px-4 py-4">Market Value</th>
            <th className="text-right px-6 py-4">P&L</th>
          </tr>
        </thead>
        <tbody>
          {holdings.map((holding) => {
            const quote = quotes[holding.symbol];
            const avgCost = holding.averageCost / 100;
            const totalCost = (holding.totalQuantity * holding.averageCost) / 100;
            const marketPrice = quote?.currentPrice ?? null;
            const marketValue = marketPrice ? holding.totalQuantity * marketPrice : null;
            const pnl = marketValue !== null ? marketValue - totalCost : null;
            const pnlPercent = totalCost > 0 && pnl !== null ? (pnl / totalCost) * 100 : null;

            return (
              <tr
                key={holding.id}
                className="border-t border-[var(--border)] hover:bg-[var(--surface-container-low)] transition-colors"
              >
                {/* Symbol */}
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[var(--primary-container)] flex items-center justify-center text-xs font-bold text-[var(--primary)]">
                      {holding.symbol.slice(0, 2)}
                    </div>
                    <div>
                      <span className="font-bold text-sm">{holding.symbol}</span>
                      {quote && (
                        <div className="flex items-center gap-1 mt-0.5">
                          {quote.change > 0 ? (
                            <TrendingUp className="h-3 w-3 text-[var(--primary)]" />
                          ) : quote.change < 0 ? (
                            <TrendingDown className="h-3 w-3 text-[#a83836]" />
                          ) : (
                            <Minus className="h-3 w-3 text-[var(--on-surface-variant)]" />
                          )}
                          <span className={`text-[11px] font-medium ${
                            quote.change > 0 ? "text-[var(--primary)]" : quote.change < 0 ? "text-[#a83836]" : "text-[var(--on-surface-variant)]"
                          }`}>
                            {quote.change > 0 ? "+" : ""}{quote.changePercent?.toFixed(2)}%
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </td>

                {/* Qty */}
                <td className="text-right px-4 py-4 text-sm font-medium">
                  {holding.totalQuantity}
                </td>

                {/* Avg Cost */}
                <td className="text-right px-4 py-4 text-sm text-[var(--on-surface-variant)]">
                  ${avgCost.toFixed(2)}
                </td>

                {/* Market Price */}
                <td className="text-right px-4 py-4 text-sm">
                  {loading ? (
                    <div className="h-4 w-16 animate-pulse bg-[var(--surface-container-high)] rounded-full ml-auto" />
                  ) : marketPrice ? (
                    <span className="font-semibold">${marketPrice.toFixed(2)}</span>
                  ) : (
                    <span className="text-[var(--on-surface-variant)]">--</span>
                  )}
                </td>

                {/* Total Cost */}
                <td className="text-right px-4 py-4 text-sm text-[var(--on-surface-variant)]">
                  ${totalCost.toFixed(2)}
                </td>

                {/* Market Value */}
                <td className="text-right px-4 py-4 text-sm">
                  {loading ? (
                    <div className="h-4 w-16 animate-pulse bg-[var(--surface-container-high)] rounded-full ml-auto" />
                  ) : marketValue ? (
                    <span className="font-semibold">${marketValue.toFixed(2)}</span>
                  ) : (
                    <span className="text-[var(--on-surface-variant)]">--</span>
                  )}
                </td>

                {/* P&L */}
                <td className="text-right px-6 py-4">
                  {loading ? (
                    <div className="h-6 w-24 animate-pulse bg-[var(--surface-container-high)] rounded-full ml-auto" />
                  ) : pnl !== null ? (
                    <span
                      className={`inline-flex items-center text-xs font-bold px-3 py-1.5 rounded-full ${
                        pnl >= 0
                          ? "bg-[var(--primary-container)] text-[var(--primary)]"
                          : "bg-[#fa746f]/15 text-[#a83836]"
                      }`}
                    >
                      {pnl >= 0 ? "+" : ""}${pnl.toFixed(2)} ({pnlPercent?.toFixed(1)}%)
                    </span>
                  ) : (
                    <span className="text-[var(--on-surface-variant)]">--</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
