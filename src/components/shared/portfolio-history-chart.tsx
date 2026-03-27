"use client";

import { useEffect, useState, useRef } from "react";
import { LineChart, TrendingUp, TrendingDown } from "lucide-react";

interface DataPoint {
  date: string;
  value: number;
  cost: number;
}

const PERIODS = [
  { label: "1M", value: "1m" },
  { label: "3M", value: "3m" },
  { label: "6M", value: "6m" },
  { label: "1Y", value: "1y" },
  { label: "All", value: "all" },
];

export function PortfolioHistoryChart() {
  const [data, setData] = useState<DataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("3m");
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/portfolio/history?period=${period}`)
      .then((r) => r.json())
      .then((d) => setData(d.dataPoints || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [period]);

  if (loading) {
    return (
      <div className="rounded-xl bg-[var(--card)] border border-[var(--border)] p-5">
        <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
          <LineChart className="h-4 w-4 text-[var(--primary)]" />
          Portfolio History
        </h3>
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-[var(--primary)] border-t-transparent" />
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="rounded-xl bg-[var(--card)] border border-[var(--border)] p-5">
        <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
          <LineChart className="h-4 w-4 text-[var(--primary)]" />
          Portfolio History
        </h3>
        <p className="text-sm text-[var(--on-surface-variant)] text-center py-8">
          No portfolio data to display yet.
        </p>
      </div>
    );
  }

  // Chart dimensions
  const W = 700;
  const H = 250;
  const PAD_L = 60;
  const PAD_R = 20;
  const PAD_T = 20;
  const PAD_B = 30;
  const chartW = W - PAD_L - PAD_R;
  const chartH = H - PAD_T - PAD_B;

  const values = data.map((d) => d.value);
  const costs = data.map((d) => d.cost);
  const allVals = [...values, ...costs];
  const minVal = Math.min(...allVals) * 0.98;
  const maxVal = Math.max(...allVals) * 1.02;
  const range = maxVal - minVal || 1;

  const toX = (i: number) => PAD_L + (i / (data.length - 1)) * chartW;
  const toY = (v: number) => PAD_T + chartH - ((v - minVal) / range) * chartH;

  // Value line path
  const valuePath = data.map((d, i) => `${i === 0 ? "M" : "L"}${toX(i).toFixed(1)},${toY(d.value).toFixed(1)}`).join(" ");
  // Cost line path (horizontal since it's constant)
  const costPath = data.map((d, i) => `${i === 0 ? "M" : "L"}${toX(i).toFixed(1)},${toY(d.cost).toFixed(1)}`).join(" ");
  // Gradient area
  const areaPath = `${valuePath} L${toX(data.length - 1).toFixed(1)},${(PAD_T + chartH).toFixed(1)} L${PAD_L},${(PAD_T + chartH).toFixed(1)} Z`;

  const first = data[0];
  const last = data[data.length - 1];
  const totalChange = last.value - first.value;
  const totalChangePercent = first.value > 0 ? (totalChange / first.value) * 100 : 0;
  const isPositive = totalChange >= 0;

  const hoverData = hoverIdx !== null ? data[hoverIdx] : last;

  // Y-axis labels
  const yLabels = [minVal, minVal + range * 0.25, minVal + range * 0.5, minVal + range * 0.75, maxVal];

  function handleMouseMove(e: React.MouseEvent<SVGSVGElement>) {
    if (!svgRef.current || data.length === 0) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * W;
    const idx = Math.round(((x - PAD_L) / chartW) * (data.length - 1));
    setHoverIdx(Math.max(0, Math.min(data.length - 1, idx)));
  }

  return (
    <div className="rounded-xl bg-[var(--card)] border border-[var(--border)] p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-sm flex items-center gap-2">
          <LineChart className="h-4 w-4 text-[var(--primary)]" />
          Portfolio History
        </h3>
        <div className="flex gap-1">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all ${
                period === p.value
                  ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                  : "bg-[var(--surface-container-high)] text-[var(--on-surface-variant)] hover:bg-[var(--surface-container)]"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-6 mb-4">
        <div>
          <p className="text-[10px] text-[var(--on-surface-variant)]">{hoverData.date}</p>
          <p className="font-[var(--font-headline)] text-xl font-bold">
            ${hoverData.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
        <div className={`flex items-center gap-1 ${isPositive ? "text-emerald-400" : "text-red-400"}`}>
          {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
          <span className="font-bold text-sm">
            {isPositive ? "+" : ""}${totalChange.toFixed(2)} ({isPositive ? "+" : ""}{totalChangePercent.toFixed(2)}%)
          </span>
        </div>
      </div>

      {/* SVG Chart */}
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-auto"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoverIdx(null)}
      >
        <defs>
          <linearGradient id="valueGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={isPositive ? "#34d399" : "#f87171"} stopOpacity="0.3" />
            <stop offset="100%" stopColor={isPositive ? "#34d399" : "#f87171"} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {yLabels.map((v, i) => (
          <g key={i}>
            <line x1={PAD_L} y1={toY(v)} x2={W - PAD_R} y2={toY(v)} stroke="var(--border)" strokeWidth="0.5" />
            <text x={PAD_L - 8} y={toY(v) + 3} textAnchor="end" fontSize="9" fill="var(--on-surface-variant)">
              ${(v / 1000 >= 1 ? `${(v / 1000).toFixed(1)}k` : v.toFixed(0))}
            </text>
          </g>
        ))}

        {/* Area fill */}
        <path d={areaPath} fill="url(#valueGrad)" />

        {/* Cost line (dashed) */}
        <path d={costPath} fill="none" stroke="var(--on-surface-variant)" strokeWidth="1" strokeDasharray="4 3" opacity="0.4" />

        {/* Value line */}
        <path d={valuePath} fill="none" stroke={isPositive ? "#34d399" : "#f87171"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

        {/* Hover crosshair */}
        {hoverIdx !== null && (
          <>
            <line
              x1={toX(hoverIdx)} y1={PAD_T}
              x2={toX(hoverIdx)} y2={PAD_T + chartH}
              stroke="var(--on-surface-variant)" strokeWidth="0.5" strokeDasharray="3 3"
            />
            <circle cx={toX(hoverIdx)} cy={toY(data[hoverIdx].value)} r="4" fill={isPositive ? "#34d399" : "#f87171"} stroke="var(--card)" strokeWidth="2" />
          </>
        )}

        {/* X-axis labels */}
        {data.filter((_, i) => i % Math.max(1, Math.floor(data.length / 5)) === 0 || i === data.length - 1).map((d, i) => {
          const idx = data.indexOf(d);
          return (
            <text key={i} x={toX(idx)} y={H - 5} textAnchor="middle" fontSize="9" fill="var(--on-surface-variant)">
              {new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </text>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-3 text-[10px] text-[var(--on-surface-variant)]">
        <div className="flex items-center gap-1.5">
          <div className={`w-3 h-0.5 rounded-full ${isPositive ? "bg-emerald-400" : "bg-red-400"}`} />
          <span>Portfolio Value</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-0.5 rounded-full bg-[var(--on-surface-variant)] opacity-40" style={{ borderBottom: "1px dashed" }} />
          <span>Total Cost</span>
        </div>
      </div>
    </div>
  );
}
