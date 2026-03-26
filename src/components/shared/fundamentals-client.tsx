"use client";

import { useEffect, useState } from "react";
import {
  TrendingUp, DollarSign, BarChart2, PieChart,
  Globe, Layers, Activity, BookOpen
} from "lucide-react";

interface PeriodData {
  label: string;
  date: string;
  revenue: number;
  grossProfit: number;
  netIncome: number;
  operatingIncome: number;
  ebitda: number;
  eps: number;
  rnd: number;
  sga: number;
  operatingExpenses: number;
  operatingCashFlow: number;
  freeCashFlow: number;
  capitalExpenditure: number;
  dividendsPaid: number;
  cash: number;
  shortTermDebt: number;
  longTermDebt: number;
  totalDebt: number;
  netDebt: number;
  grossMargin: number | null;
  netMargin: number | null;
  operatingMargin: number | null;
  peRatio: number | null;
  priceToSales: number | null;
  evToEbitda: number | null;
  priceToBook: number | null;
  roe: number | null;
  roa: number | null;
  debtToEquity: number | null;
  currentRatio: number | null;
}

function fmtM(val: number): string {
  if (val === 0) return "$0";
  const abs = Math.abs(val);
  const sign = val < 0 ? "-" : "";
  if (abs >= 1e12) return `${sign}$${(abs / 1e12).toFixed(2)}T`;
  if (abs >= 1e9) return `${sign}$${(abs / 1e9).toFixed(1)}B`;
  if (abs >= 1e6) return `${sign}$${(abs / 1e6).toFixed(0)}M`;
  return `${sign}$${abs.toFixed(0)}`;
}

function fmtPct(val: number | null): string {
  if (val === null || val === undefined) return "—";
  return `${val.toFixed(1)}%`;
}

function fmtNum(val: number | null, decimals = 2): string {
  if (val === null || val === undefined || val === 0) return "—";
  return val.toFixed(decimals);
}

// Simple bar chart — renders a set of bars with labels
interface BarChartProps {
  data: { label: string; value: number; value2?: number }[];
  color?: string;
  color2?: string;
  label2?: string;
  formatVal?: (v: number) => string;
  allowNegative?: boolean;
}

function BarChart({ data, color = "var(--primary)", color2, label2, formatVal = fmtM, allowNegative = false }: BarChartProps) {
  const values = data.map((d) => d.value);
  const values2 = color2 ? data.map((d) => d.value2 ?? 0) : [];
  const allVals = [...values, ...values2];
  const maxAbs = Math.max(...allVals.map(Math.abs), 1);
  const hasNeg = allowNegative && allVals.some((v) => v < 0);
  const MAX_H = 96; // px, max bar height

  return (
    <div className="w-full overflow-x-auto">
      <div className="flex items-end gap-1.5 min-w-0" style={{ minHeight: hasNeg ? `${MAX_H * 2 + 24}px` : `${MAX_H + 24}px` }}>
        {data.map((d, i) => {
          const h1 = Math.round((Math.abs(d.value) / maxAbs) * MAX_H);
          const h2 = color2 ? Math.round((Math.abs(d.value2 ?? 0) / maxAbs) * MAX_H) : 0;
          const isNeg1 = d.value < 0;
          const isNeg2 = (d.value2 ?? 0) < 0;

          return (
            <div key={i} className="flex flex-col items-center gap-0.5 flex-1 min-w-[28px] group">
              {/* Positive area */}
              <div className="flex items-end gap-0.5 justify-center" style={{ height: `${MAX_H}px` }}>
                <div
                  className="rounded-t-sm transition-all group-hover:opacity-80 cursor-default"
                  style={{
                    width: color2 ? "45%" : "70%",
                    height: `${isNeg1 ? 0 : h1}px`,
                    backgroundColor: color,
                    minWidth: "4px",
                  }}
                  title={`${d.label}: ${formatVal(d.value)}`}
                />
                {color2 && (
                  <div
                    className="rounded-t-sm transition-all group-hover:opacity-80 cursor-default"
                    style={{
                      width: "45%",
                      height: `${isNeg2 ? 0 : h2}px`,
                      backgroundColor: color2,
                      minWidth: "4px",
                    }}
                    title={`${d.label} (${label2}): ${formatVal(d.value2 ?? 0)}`}
                  />
                )}
              </div>

              {/* Zero line */}
              {hasNeg && <div className="w-full h-px bg-[var(--border)]" />}

              {/* Negative area */}
              {hasNeg && (
                <div className="flex items-start gap-0.5 justify-center" style={{ height: `${MAX_H}px` }}>
                  <div
                    className="rounded-b-sm transition-all"
                    style={{
                      width: color2 ? "45%" : "70%",
                      height: `${isNeg1 ? h1 : 0}px`,
                      backgroundColor: "#dc2626",
                      minWidth: "4px",
                    }}
                    title={`${d.label}: ${formatVal(d.value)}`}
                  />
                  {color2 && (
                    <div
                      className="rounded-b-sm transition-all"
                      style={{
                        width: "45%",
                        height: `${isNeg2 ? h2 : 0}px`,
                        backgroundColor: "#ef4444",
                        minWidth: "4px",
                      }}
                    />
                  )}
                </div>
              )}

              {/* Label */}
              <span className="text-[9px] text-[var(--on-surface-variant)] mt-1 truncate w-full text-center">
                {d.label}
              </span>
              {/* Value tooltip on hover */}
              <span className="text-[9px] font-bold text-[var(--foreground)] truncate w-full text-center opacity-0 group-hover:opacity-100 transition-opacity">
                {formatVal(d.value)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MarginLine({ data }: { data: { label: string; gross: number | null; net: number | null; operating: number | null }[] }) {
  const MAX_H = 80;
  const allVals = data.flatMap((d) => [d.gross, d.net, d.operating]).filter((v): v is number => v !== null);
  const maxVal = Math.max(...allVals, 1);
  const minVal = Math.min(...allVals, 0);
  const range = maxVal - minVal || 1;

  function pct(v: number | null) {
    if (v === null) return null;
    return ((v - minVal) / range) * MAX_H;
  }

  const WIDTH = 100 / data.length;

  return (
    <div className="w-full overflow-x-auto">
      <div className="relative" style={{ height: `${MAX_H + 40}px`, minWidth: `${data.length * 40}px` }}>
        <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox={`0 0 ${data.length * 40} ${MAX_H + 40}`}>
          {["gross", "net", "operating"].map((key, ki) => {
            const colors = ["#1a6b50", "#3b82f6", "#f59e0b"];
            const points = data
              .map((d, i) => {
                const v = pct(d[key as "gross" | "net" | "operating"]);
                if (v === null) return null;
                return `${i * 40 + 20},${MAX_H - v}`;
              })
              .filter(Boolean);
            if (points.length < 2) return null;
            return (
              <polyline
                key={key}
                points={points.join(" ")}
                fill="none"
                stroke={colors[ki]}
                strokeWidth="2"
                strokeLinejoin="round"
              />
            );
          })}
          {data.map((d, i) => (
            <text key={i} x={i * 40 + 20} y={MAX_H + 30} textAnchor="middle" fontSize="8" fill="var(--on-surface-variant)">
              {d.label}
            </text>
          ))}
        </svg>
      </div>
      <div className="flex gap-4 mt-1">
        {[["#1a6b50", "Gross Margin"], ["#3b82f6", "Net Margin"], ["#f59e0b", "Op. Margin"]].map(([c, l]) => (
          <div key={l} className="flex items-center gap-1">
            <div className="w-3 h-0.5 rounded" style={{ backgroundColor: c }} />
            <span className="text-[10px] text-[var(--on-surface-variant)]">{l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function RatioTable({ data, periods }: { data: PeriodData[]; periods: string[] }) {
  const recent = data.slice(-4);
  const rows: { label: string; key: keyof PeriodData; fmt: (v: unknown) => string }[] = [
    { label: "P/E Ratio", key: "peRatio", fmt: (v) => fmtNum(v as number | null) },
    { label: "P/S Ratio", key: "priceToSales", fmt: (v) => fmtNum(v as number | null) },
    { label: "EV/EBITDA", key: "evToEbitda", fmt: (v) => fmtNum(v as number | null) },
    { label: "P/B Ratio", key: "priceToBook", fmt: (v) => fmtNum(v as number | null) },
    { label: "ROE", key: "roe", fmt: (v) => fmtPct(v as number | null) },
    { label: "ROA", key: "roa", fmt: (v) => fmtPct(v as number | null) },
    { label: "Debt/Equity", key: "debtToEquity", fmt: (v) => fmtNum(v as number | null) },
    { label: "Current Ratio", key: "currentRatio", fmt: (v) => fmtNum(v as number | null) },
  ];

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--border)]">
            <th className="text-left py-2 pr-4 font-medium text-[var(--on-surface-variant)] text-xs">Metric</th>
            {recent.map((d) => (
              <th key={d.label} className="text-right py-2 px-2 font-medium text-[var(--on-surface-variant)] text-xs">{d.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className="border-b border-[var(--border)]/50 hover:bg-[var(--surface-container-low)] transition-colors">
              <td className="py-2 pr-4 text-xs font-medium">{row.label}</td>
              {recent.map((d) => (
                <td key={d.label} className="text-right py-2 px-2 text-xs font-mono">
                  {row.fmt(d[row.key])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface SectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

function Section({ title, icon, children }: SectionProps) {
  return (
    <div className="rounded-2xl bg-[var(--card)] shadow-[0_2px_32px_rgba(0,0,0,0.04)] p-5">
      <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
        {icon}
        {title}
      </h3>
      {children}
    </div>
  );
}

export function FundamentalsClient({ symbol }: { symbol: string }) {
  const [data, setData] = useState<PeriodData[]>([]);
  const [period, setPeriod] = useState<"quarterly" | "annual">("quarterly");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    fetch(`/api/stock/financials?symbol=${symbol}&period=${period}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.error) { setError(json.error); setData([]); }
        else setData(json.periods || []);
      })
      .catch(() => setError("Failed to load"))
      .finally(() => setLoading(false));
  }, [symbol, period]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-[var(--primary)] border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl bg-[var(--card)] p-8 text-center">
        <p className="text-sm text-[var(--on-surface-variant)]">{error}</p>
        {error.includes("FMP_API_KEY") && (
          <p className="text-xs text-[var(--on-surface-variant)] mt-2">
            Add <code className="bg-[var(--surface-container-high)] px-1 rounded">FMP_API_KEY</code> to Vercel Environment Variables
          </p>
        )}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="rounded-2xl bg-[var(--card)] p-8 text-center">
        <p className="text-sm text-[var(--on-surface-variant)]">No financial data available for {symbol}</p>
      </div>
    );
  }

  const periods = data.map((d) => d.label);
  const barRevenue = data.map((d) => ({ label: d.label, value: d.revenue, value2: d.grossProfit }));
  const barIncome = data.map((d) => ({ label: d.label, value: d.netIncome, value2: d.operatingIncome }));
  const barFCF = data.map((d) => ({ label: d.label, value: d.freeCashFlow, value2: d.operatingCashFlow }));
  const barEPS = data.map((d) => ({ label: d.label, value: d.eps }));
  const barCashDebt = data.map((d) => ({ label: d.label, value: d.cash, value2: d.totalDebt }));
  const barDiv = data.map((d) => ({ label: d.label, value: d.dividendsPaid }));
  const barExpenses = data.map((d) => ({ label: d.label, value: d.rnd, value2: d.sga }));
  const marginData = data.map((d) => ({ label: d.label, gross: d.grossMargin, net: d.netMargin, operating: d.operatingMargin }));

  return (
    <div className="space-y-4">
      {/* Period toggle */}
      <div className="flex gap-2">
        {(["quarterly", "annual"] as const).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all capitalize ${
              period === p
                ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                : "bg-[var(--surface-container-high)] text-[var(--on-surface-variant)] hover:bg-[var(--card)]"
            }`}
          >
            {p === "quarterly" ? "Quarterly" : "Annual"}
          </button>
        ))}
      </div>

      {/* Revenue & Gross Profit */}
      <Section title="Revenue & Gross Profit" icon={<TrendingUp className="h-4 w-4 text-[var(--primary)]" />}>
        <div className="flex gap-3 mb-3">
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm" style={{ backgroundColor: "var(--primary)" }} /><span className="text-xs text-[var(--on-surface-variant)]">Revenue</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-[#3b82f6]" /><span className="text-xs text-[var(--on-surface-variant)]">Gross Profit</span></div>
        </div>
        <BarChart data={barRevenue} color="var(--primary)" color2="#3b82f6" label2="Gross Profit" />
        <div className="flex justify-between mt-3 pt-3 border-t border-[var(--border)]">
          <div><p className="text-[10px] text-[var(--on-surface-variant)]">Latest Revenue</p><p className="font-bold text-sm">{fmtM(data[data.length - 1]?.revenue)}</p></div>
          <div className="text-right"><p className="text-[10px] text-[var(--on-surface-variant)]">Gross Margin</p><p className="font-bold text-sm">{fmtPct(data[data.length - 1]?.grossMargin)}</p></div>
        </div>
      </Section>

      {/* Net Income & Operating Income */}
      <Section title="Net Income & Operating Income" icon={<DollarSign className="h-4 w-4 text-[#3b82f6]" />}>
        <div className="flex gap-3 mb-3">
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-[#3b82f6]" /><span className="text-xs text-[var(--on-surface-variant)]">Net Income</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-[#f59e0b]" /><span className="text-xs text-[var(--on-surface-variant)]">Op. Income</span></div>
        </div>
        <BarChart data={barIncome} color="#3b82f6" color2="#f59e0b" label2="Op. Income" allowNegative />
        <div className="flex justify-between mt-3 pt-3 border-t border-[var(--border)]">
          <div><p className="text-[10px] text-[var(--on-surface-variant)]">Latest Net Income</p><p className="font-bold text-sm">{fmtM(data[data.length - 1]?.netIncome)}</p></div>
          <div className="text-right"><p className="text-[10px] text-[var(--on-surface-variant)]">Net Margin</p><p className="font-bold text-sm">{fmtPct(data[data.length - 1]?.netMargin)}</p></div>
        </div>
      </Section>

      {/* FCF & Operating Cash Flow */}
      <Section title="Free Cash Flow & Operating Cash Flow" icon={<Activity className="h-4 w-4 text-[#1a6b50]" />}>
        <div className="flex gap-3 mb-3">
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm" style={{ backgroundColor: "#1a6b50" }} /><span className="text-xs text-[var(--on-surface-variant)]">FCF</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-[#10b981]" /><span className="text-xs text-[var(--on-surface-variant)]">Op. Cash Flow</span></div>
        </div>
        <BarChart data={barFCF} color="#1a6b50" color2="#10b981" label2="Op. CF" allowNegative />
        <div className="flex justify-between mt-3 pt-3 border-t border-[var(--border)]">
          <div><p className="text-[10px] text-[var(--on-surface-variant)]">Latest FCF</p><p className="font-bold text-sm">{fmtM(data[data.length - 1]?.freeCashFlow)}</p></div>
          <div className="text-right"><p className="text-[10px] text-[var(--on-surface-variant)]">Capex</p><p className="font-bold text-sm">{fmtM(data[data.length - 1]?.capitalExpenditure)}</p></div>
        </div>
      </Section>

      {/* EPS */}
      <Section title="Earnings Per Share (EPS)" icon={<BarChart2 className="h-4 w-4 text-[#8b5cf6]" />}>
        <BarChart data={barEPS} color="#8b5cf6" formatVal={(v) => `$${v.toFixed(2)}`} allowNegative />
        <div className="mt-3 pt-3 border-t border-[var(--border)]">
          <p className="text-[10px] text-[var(--on-surface-variant)]">Latest EPS</p>
          <p className="font-bold text-sm">${data[data.length - 1]?.eps.toFixed(2)}</p>
        </div>
      </Section>

      {/* Cash & Debt */}
      <Section title="Cash & Debt" icon={<Layers className="h-4 w-4 text-[#f59e0b]" />}>
        <div className="flex gap-3 mb-3">
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-[#1a6b50]" /><span className="text-xs text-[var(--on-surface-variant)]">Cash</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-[#dc2626]" /><span className="text-xs text-[var(--on-surface-variant)]">Total Debt</span></div>
        </div>
        <BarChart data={barCashDebt} color="#1a6b50" color2="#dc2626" label2="Debt" />
        <div className="flex justify-between mt-3 pt-3 border-t border-[var(--border)]">
          <div><p className="text-[10px] text-[var(--on-surface-variant)]">Cash</p><p className="font-bold text-sm text-[#1a6b50]">{fmtM(data[data.length - 1]?.cash)}</p></div>
          <div className="text-right"><p className="text-[10px] text-[var(--on-surface-variant)]">Net Debt</p>
            <p className={`font-bold text-sm ${(data[data.length - 1]?.netDebt ?? 0) > 0 ? "text-[#dc2626]" : "text-[#1a6b50]"}`}>
              {fmtM(data[data.length - 1]?.netDebt)}
            </p>
          </div>
        </div>
      </Section>

      {/* Dividends */}
      {data.some((d) => d.dividendsPaid > 0) && (
        <Section title="Dividends Paid" icon={<DollarSign className="h-4 w-4 text-[#10b981]" />}>
          <BarChart data={barDiv} color="#10b981" />
        </Section>
      )}

      {/* Margins */}
      <Section title="Profit Margins" icon={<PieChart className="h-4 w-4 text-[#f59e0b]" />}>
        <MarginLine data={marginData} />
      </Section>

      {/* Expenses: R&D & SG&A */}
      <Section title="Expenses: R&D & SG&A" icon={<Globe className="h-4 w-4 text-[#8b5cf6]" />}>
        <div className="flex gap-3 mb-3">
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-[#8b5cf6]" /><span className="text-xs text-[var(--on-surface-variant)]">R&D</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-[#06b6d4]" /><span className="text-xs text-[var(--on-surface-variant)]">SG&A</span></div>
        </div>
        <BarChart data={barExpenses} color="#8b5cf6" color2="#06b6d4" label2="SG&A" />
      </Section>

      {/* Valuation & Ratios */}
      <Section title="Valuation & Ratios" icon={<BookOpen className="h-4 w-4 text-[var(--primary)]" />}>
        <RatioTable data={data} periods={periods} />
      </Section>
    </div>
  );
}
