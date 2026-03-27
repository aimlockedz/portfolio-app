"use client";

import { useEffect, useState } from "react";
import {
  TrendingUp, DollarSign, BarChart2, PieChart,
  Layers, Activity, BookOpen, Percent
} from "lucide-react";

interface QuarterlyData {
  label: string;
  revenue: number;
  earnings: number;
  eps: number | null;
  epsEstimate: number | null;
}

interface AnnualData {
  label: string;
  revenue: number;
  earnings: number;
}

interface TTMData {
  revenue: number;
  grossProfit: number;
  ebitda: number;
  netIncome: number;
  operatingCashFlow: number;
  freeCashFlow: number;
  totalCash: number;
  totalDebt: number;
  grossMargin: number;
  operatingMargin: number;
  netMargin: number;
  ebitdaMargin: number;
  peRatio: number | null;
  trailingPE: number | null;
  priceToBook: number | null;
  evToEbitda: number | null;
  evToRevenue: number | null;
  roe: number;
  roa: number;
  debtToEquity: number;
  currentRatio: number;
  quickRatio: number;
  trailingEps: number;
  forwardEps: number;
  earningsGrowth: number;
  revenueGrowth: number;
  beta: number;
  sharesOutstanding: number;
  enterpriseValue: number;
  lastDividend: number;
}

interface FinData {
  symbol: string;
  quarterly: QuarterlyData[];
  annual: AnnualData[];
  ttm: TTMData;
}

function fmtB(val: number): string {
  if (val === 0) return "$0";
  const abs = Math.abs(val);
  const sign = val < 0 ? "-" : "";
  if (abs >= 1e12) return `${sign}$${(abs / 1e12).toFixed(2)}T`;
  if (abs >= 1e9) return `${sign}$${(abs / 1e9).toFixed(1)}B`;
  if (abs >= 1e6) return `${sign}$${(abs / 1e6).toFixed(0)}M`;
  return `${sign}$${abs.toLocaleString()}`;
}

function fmtPct(val: number): string {
  return `${val.toFixed(1)}%`;
}

// Bar chart component
function BarChart({ data, color = "var(--primary)", color2, legend, legend2, formatVal = fmtB, allowNeg = false }: {
  data: { label: string; v1: number; v2?: number }[];
  color?: string;
  color2?: string;
  legend?: string;
  legend2?: string;
  formatVal?: (v: number) => string;
  allowNeg?: boolean;
}) {
  const allVals = data.flatMap((d) => [Math.abs(d.v1), Math.abs(d.v2 ?? 0)]);
  const maxVal = Math.max(...allVals, 1);
  const H = 100;

  return (
    <div>
      {(legend || legend2) && (
        <div className="flex gap-4 mb-3">
          {legend && <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm" style={{ backgroundColor: color }} /><span className="text-xs text-[var(--on-surface-variant)]">{legend}</span></div>}
          {legend2 && color2 && <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm" style={{ backgroundColor: color2 }} /><span className="text-xs text-[var(--on-surface-variant)]">{legend2}</span></div>}
        </div>
      )}
      <div className="flex items-end gap-2" style={{ height: `${H + 32}px` }}>
        {data.map((d, i) => {
          const h1 = (Math.abs(d.v1) / maxVal) * H;
          const h2 = color2 ? (Math.abs(d.v2 ?? 0) / maxVal) * H : 0;
          const neg1 = d.v1 < 0;
          const neg2 = (d.v2 ?? 0) < 0;
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1 group min-w-0">
              <div className="flex items-end gap-0.5 justify-center w-full" style={{ height: `${H}px` }}>
                <div
                  className="rounded-t transition-all hover:opacity-80 cursor-default relative"
                  style={{
                    width: color2 ? "40%" : "60%",
                    height: `${Math.max(h1, 2)}px`,
                    backgroundColor: neg1 && allowNeg ? "#dc2626" : color,
                  }}
                  title={`${d.label}: ${formatVal(d.v1)}`}
                />
                {color2 && (
                  <div
                    className="rounded-t transition-all hover:opacity-80 cursor-default"
                    style={{
                      width: "40%",
                      height: `${Math.max(h2, 2)}px`,
                      backgroundColor: neg2 && allowNeg ? "#ef4444" : color2,
                    }}
                    title={`${d.label}: ${formatVal(d.v2 ?? 0)}`}
                  />
                )}
              </div>
              <span className="text-[9px] text-[var(--on-surface-variant)] truncate w-full text-center">{d.label}</span>
              <span className="text-[9px] font-bold opacity-0 group-hover:opacity-100 transition-opacity truncate w-full text-center">{formatVal(d.v1)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Stat card
function Stat({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="p-3 rounded-xl bg-[var(--surface-container-low)]">
      <p className="text-[10px] text-[var(--on-surface-variant)] uppercase tracking-wider mb-1">{label}</p>
      <p className="font-bold text-lg" style={color ? { color } : undefined}>{value}</p>
      {sub && <p className="text-[10px] text-[var(--on-surface-variant)] mt-0.5">{sub}</p>}
    </div>
  );
}

// Margin gauge bar
function MarginBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-[var(--on-surface-variant)] w-24 shrink-0">{label}</span>
      <div className="flex-1 relative h-5 rounded-full bg-[var(--surface-container-high)] overflow-hidden">
        <div
          className="absolute h-full rounded-full transition-all"
          style={{ width: `${Math.min(Math.max(value, 0), 100)}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-xs font-bold w-14 text-right">{fmtPct(value)}</span>
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-[var(--card)] shadow-[0_2px_32px_rgba(0,0,0,0.04)] p-5">
      <h3 className="font-bold text-sm mb-4 flex items-center gap-2">{icon}{title}</h3>
      {children}
    </div>
  );
}

export function FundamentalsClient({ symbol }: { symbol: string }) {
  const [data, setData] = useState<FinData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    fetch(`/api/stock/financials?symbol=${symbol}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.error) { setError(json.error); }
        else setData(json);
      })
      .catch(() => setError("Failed to load"))
      .finally(() => setLoading(false));
  }, [symbol]);

  if (loading) return (
    <div className="flex items-center justify-center h-48">
      <div className="h-8 w-8 animate-spin rounded-full border-3 border-[var(--primary)] border-t-transparent" />
    </div>
  );

  if (error || !data) return (
    <div className="rounded-2xl bg-[var(--card)] p-8 text-center">
      <p className="text-sm text-[var(--on-surface-variant)]">{error || "No data available"}</p>
    </div>
  );

  const { quarterly, annual, ttm } = data;

  const qRevData = quarterly.map((q) => ({ label: q.label, v1: q.revenue, v2: q.earnings }));
  const aRevData = annual.map((a) => ({ label: a.label, v1: a.revenue, v2: a.earnings }));
  const epsData = quarterly.filter((q) => q.eps !== null).map((q) => ({
    label: q.label,
    v1: q.eps!,
    v2: q.epsEstimate ?? 0,
  }));

  return (
    <div className="space-y-4">
      {/* Quarterly Revenue & Earnings */}
      {quarterly.length > 0 && (
        <Section title="Quarterly Revenue & Earnings" icon={<TrendingUp className="h-4 w-4 text-[var(--primary)]" />}>
          <BarChart
            data={qRevData}
            color="var(--primary)"
            color2="#3b82f6"
            legend="Revenue"
            legend2="Net Income"
            allowNeg
          />
          <div className="flex justify-between mt-4 pt-3 border-t border-[var(--border)]">
            <div>
              <p className="text-[10px] text-[var(--on-surface-variant)]">Latest Revenue</p>
              <p className="font-bold">{fmtB(quarterly[quarterly.length - 1]?.revenue)}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-[var(--on-surface-variant)]">Latest Earnings</p>
              <p className="font-bold text-[#3b82f6]">{fmtB(quarterly[quarterly.length - 1]?.earnings)}</p>
            </div>
          </div>
        </Section>
      )}

      {/* Annual Revenue & Earnings */}
      {annual.length > 0 && (
        <Section title="Annual Revenue & Earnings" icon={<BarChart2 className="h-4 w-4 text-[#8b5cf6]" />}>
          <BarChart
            data={aRevData}
            color="#8b5cf6"
            color2="#a78bfa"
            legend="Revenue"
            legend2="Net Income"
            allowNeg
          />
        </Section>
      )}

      {/* EPS (Actual vs Estimate) */}
      {epsData.length > 0 && (
        <Section title="EPS: Actual vs Estimate" icon={<DollarSign className="h-4 w-4 text-[#f59e0b]" />}>
          <BarChart
            data={epsData}
            color="#1a6b50"
            color2="#94a3b8"
            legend="Actual"
            legend2="Estimate"
            formatVal={(v) => `$${v.toFixed(2)}`}
          />
          <div className="flex justify-between mt-4 pt-3 border-t border-[var(--border)]">
            <div>
              <p className="text-[10px] text-[var(--on-surface-variant)]">Trailing EPS (TTM)</p>
              <p className="font-bold">${ttm.trailingEps.toFixed(2)}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-[var(--on-surface-variant)]">Forward EPS</p>
              <p className="font-bold text-[var(--primary)]">${ttm.forwardEps.toFixed(2)}</p>
            </div>
          </div>
        </Section>
      )}

      {/* TTM Key Financials */}
      <Section title="Key Financials (TTM)" icon={<Activity className="h-4 w-4 text-[#1a6b50]" />}>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Stat label="Revenue" value={fmtB(ttm.revenue)} sub={`Growth: ${fmtPct(ttm.revenueGrowth)}`} />
          <Stat label="Gross Profit" value={fmtB(ttm.grossProfit)} sub={`Margin: ${fmtPct(ttm.grossMargin)}`} />
          <Stat label="EBITDA" value={fmtB(ttm.ebitda)} sub={`Margin: ${fmtPct(ttm.ebitdaMargin)}`} />
          <Stat label="Net Income" value={fmtB(ttm.netIncome)} sub={`Growth: ${fmtPct(ttm.earningsGrowth)}`} />
          <Stat label="Operating CF" value={fmtB(ttm.operatingCashFlow)} />
          <Stat label="Free Cash Flow" value={fmtB(ttm.freeCashFlow)} color={ttm.freeCashFlow >= 0 ? "#1a6b50" : "#dc2626"} />
        </div>
      </Section>

      {/* Cash & Debt */}
      <Section title="Cash & Debt" icon={<Layers className="h-4 w-4 text-[#f59e0b]" />}>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <Stat label="Total Cash" value={fmtB(ttm.totalCash)} color="#1a6b50" />
          <Stat label="Total Debt" value={fmtB(ttm.totalDebt)} color="#dc2626" />
        </div>
        <div className="relative h-6 rounded-full overflow-hidden bg-[var(--surface-container-high)]">
          {(() => {
            const total = ttm.totalCash + ttm.totalDebt;
            const cashPct = total > 0 ? (ttm.totalCash / total) * 100 : 50;
            return (
              <>
                <div className="absolute h-full rounded-l-full bg-[#1a6b50]" style={{ width: `${cashPct}%` }} />
                <div className="absolute h-full rounded-r-full bg-[#dc2626] right-0" style={{ width: `${100 - cashPct}%` }} />
                <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white">
                  Cash {cashPct.toFixed(0)}% / Debt {(100 - cashPct).toFixed(0)}%
                </div>
              </>
            );
          })()}
        </div>
        <div className="grid grid-cols-3 gap-3 mt-3">
          <Stat label="Debt/Equity" value={ttm.debtToEquity.toFixed(1)} />
          <Stat label="Current Ratio" value={ttm.currentRatio.toFixed(2)} />
          <Stat label="Quick Ratio" value={ttm.quickRatio.toFixed(2)} />
        </div>
      </Section>

      {/* Profit Margins */}
      <Section title="Profit Margins" icon={<Percent className="h-4 w-4 text-[#8b5cf6]" />}>
        <div className="space-y-3">
          <MarginBar label="Gross" value={ttm.grossMargin} color="#1a6b50" />
          <MarginBar label="EBITDA" value={ttm.ebitdaMargin} color="#3b82f6" />
          <MarginBar label="Operating" value={ttm.operatingMargin} color="#f59e0b" />
          <MarginBar label="Net" value={ttm.netMargin} color="#8b5cf6" />
        </div>
      </Section>

      {/* Valuation & Ratios */}
      <Section title="Valuation & Ratios" icon={<BookOpen className="h-4 w-4 text-[var(--primary)]" />}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat label="Forward P/E" value={ttm.peRatio ? ttm.peRatio.toFixed(1) : "—"} />
          <Stat label="Trailing P/E" value={ttm.trailingPE ? ttm.trailingPE.toFixed(1) : "—"} />
          <Stat label="P/B Ratio" value={ttm.priceToBook ? ttm.priceToBook.toFixed(2) : "—"} />
          <Stat label="EV/EBITDA" value={ttm.evToEbitda ? ttm.evToEbitda.toFixed(1) : "—"} />
          <Stat label="EV/Revenue" value={ttm.evToRevenue ? ttm.evToRevenue.toFixed(2) : "—"} />
          <Stat label="ROE" value={fmtPct(ttm.roe)} color={ttm.roe > 15 ? "#1a6b50" : undefined} />
          <Stat label="ROA" value={fmtPct(ttm.roa)} />
          <Stat label="Beta" value={ttm.beta.toFixed(2)} />
        </div>
      </Section>

      {/* Enterprise Value */}
      <Section title="Company Overview" icon={<PieChart className="h-4 w-4 text-[#06b6d4]" />}>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Stat label="Enterprise Value" value={fmtB(ttm.enterpriseValue)} />
          <Stat label="Shares Outstanding" value={ttm.sharesOutstanding > 1e9 ? `${(ttm.sharesOutstanding / 1e9).toFixed(2)}B` : `${(ttm.sharesOutstanding / 1e6).toFixed(0)}M`} />
          {ttm.lastDividend > 0 && <Stat label="Last Dividend" value={`$${ttm.lastDividend.toFixed(3)}`} />}
        </div>
      </Section>
    </div>
  );
}
