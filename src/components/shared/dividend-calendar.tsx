"use client";

import { useEffect, useState } from "react";
import { Calendar, DollarSign, Percent } from "lucide-react";

interface Dividend {
  symbol: string;
  name: string;
  exDividendDate: string | null;
  dividendDate: string | null;
  dividendRate: number;
  dividendYield: number;
  payoutRatio: number;
  frequency: string | null;
}

interface Props {
  symbols: string[];
}

export function DividendCalendar({ symbols }: Props) {
  const [dividends, setDividends] = useState<Dividend[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (symbols.length === 0) { setLoading(false); return; }

    fetch(`/api/portfolio/dividends?symbols=${symbols.join(",")}`)
      .then((r) => r.json())
      .then((d) => setDividends(d.dividends || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [symbols]);

  if (loading) {
    return (
      <div className="rounded-xl bg-[var(--card)] border border-[var(--border)] p-5">
        <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
          <Calendar className="h-4 w-4 text-[var(--primary)]" />
          Dividend Calendar
        </h3>
        <div className="flex justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-[var(--primary)] border-t-transparent" />
        </div>
      </div>
    );
  }

  const upcoming = dividends.filter((d) => {
    if (!d.exDividendDate) return false;
    return new Date(d.exDividendDate) >= new Date(new Date().toISOString().split("T")[0]);
  });

  const past = dividends.filter((d) => {
    if (!d.exDividendDate) return true;
    return new Date(d.exDividendDate) < new Date(new Date().toISOString().split("T")[0]);
  });

  const totalYield = dividends.length > 0
    ? dividends.reduce((sum, d) => sum + d.dividendYield, 0) / dividends.length
    : 0;

  return (
    <div className="rounded-xl bg-[var(--card)] border border-[var(--border)] p-5">
      <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
        <Calendar className="h-4 w-4 text-[var(--primary)]" />
        Dividend Calendar
      </h3>

      {dividends.length === 0 ? (
        <p className="text-sm text-[var(--on-surface-variant)] text-center py-6">
          No dividend data for your holdings.
        </p>
      ) : (
        <div className="space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg bg-[var(--surface-container-low)] p-3 text-center">
              <DollarSign className="h-4 w-4 mx-auto mb-1 text-[var(--primary)]" />
              <p className="text-lg font-bold">{dividends.length}</p>
              <p className="text-[10px] text-[var(--on-surface-variant)]">Dividend Payers</p>
            </div>
            <div className="rounded-lg bg-[var(--surface-container-low)] p-3 text-center">
              <Calendar className="h-4 w-4 mx-auto mb-1 text-[var(--primary)]" />
              <p className="text-lg font-bold">{upcoming.length}</p>
              <p className="text-[10px] text-[var(--on-surface-variant)]">Upcoming</p>
            </div>
            <div className="rounded-lg bg-[var(--surface-container-low)] p-3 text-center">
              <Percent className="h-4 w-4 mx-auto mb-1 text-[var(--primary)]" />
              <p className="text-lg font-bold">{totalYield.toFixed(1)}%</p>
              <p className="text-[10px] text-[var(--on-surface-variant)]">Avg Yield</p>
            </div>
          </div>

          {/* Upcoming */}
          {upcoming.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-[var(--on-surface-variant)] font-medium mb-2">Upcoming Ex-Dividend</p>
              <div className="space-y-1.5">
                {upcoming.map((d) => (
                  <div key={d.symbol} className="flex items-center justify-between rounded-lg bg-emerald-500/5 border border-emerald-500/10 px-4 py-2.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[var(--primary-container)] flex items-center justify-center text-[10px] font-bold text-[var(--primary)]">
                        {d.symbol.slice(0, 2)}
                      </div>
                      <div>
                        <p className="font-bold text-sm">{d.symbol}</p>
                        <p className="text-[10px] text-[var(--on-surface-variant)]">{d.name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-emerald-400">${d.dividendRate.toFixed(2)}/yr</p>
                      <p className="text-[10px] text-[var(--on-surface-variant)]">
                        Ex: {d.exDividendDate} · {d.dividendYield}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* All dividend payers */}
          <div>
            <p className="text-[10px] uppercase tracking-wider text-[var(--on-surface-variant)] font-medium mb-2">All Dividend Holdings</p>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-[10px] font-semibold text-[var(--on-surface-variant)] uppercase tracking-wider">
                    <th className="text-left px-3 py-2">Symbol</th>
                    <th className="text-right px-3 py-2">Rate</th>
                    <th className="text-right px-3 py-2">Yield</th>
                    <th className="text-right px-3 py-2">Payout</th>
                    <th className="text-right px-3 py-2">Ex-Date</th>
                  </tr>
                </thead>
                <tbody>
                  {dividends.map((d) => (
                    <tr key={d.symbol} className="border-t border-[var(--border)]">
                      <td className="px-3 py-2 font-bold text-sm">{d.symbol}</td>
                      <td className="px-3 py-2 text-right text-sm">${d.dividendRate.toFixed(2)}</td>
                      <td className="px-3 py-2 text-right text-sm text-emerald-400 font-semibold">{d.dividendYield}%</td>
                      <td className="px-3 py-2 text-right text-sm text-[var(--on-surface-variant)]">{d.payoutRatio > 0 ? `${d.payoutRatio}%` : "—"}</td>
                      <td className="px-3 py-2 text-right text-sm text-[var(--on-surface-variant)]">{d.exDividendDate || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
