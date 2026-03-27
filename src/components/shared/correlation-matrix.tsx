"use client";

import { useEffect, useState } from "react";
import { Grid3X3 } from "lucide-react";

interface Props {
  symbols: string[];
}

interface MatrixCell {
  row: string;
  col: string;
  value: number;
}

function getColor(val: number): string {
  // -1 = red, 0 = neutral, 1 = green
  if (val >= 0.7) return "bg-emerald-500/60";
  if (val >= 0.4) return "bg-emerald-500/30";
  if (val >= 0.1) return "bg-emerald-500/10";
  if (val > -0.1) return "bg-[var(--surface-container-high)]";
  if (val > -0.4) return "bg-red-500/10";
  if (val > -0.7) return "bg-red-500/30";
  return "bg-red-500/60";
}

function getTextColor(val: number): string {
  if (Math.abs(val) >= 0.7) return "text-white";
  if (val >= 0.4) return "text-emerald-400";
  if (val <= -0.4) return "text-red-400";
  return "text-[var(--foreground)]";
}

export function CorrelationMatrix({ symbols }: Props) {
  const [matrix, setMatrix] = useState<MatrixCell[]>([]);
  const [syms, setSyms] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (symbols.length < 2) { setLoading(false); return; }

    fetch(`/api/portfolio/correlation?symbols=${symbols.join(",")}`)
      .then((r) => r.json())
      .then((d) => {
        setMatrix(d.matrix || []);
        setSyms(d.symbols || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [symbols]);

  if (symbols.length < 2) {
    return (
      <div className="text-center py-8 text-[var(--on-surface-variant)]">
        <p className="text-sm">Need at least 2 holdings to show correlation.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-[var(--primary)] border-t-transparent" />
      </div>
    );
  }

  const getVal = (row: string, col: string) => {
    const cell = matrix.find((c) => c.row === row && c.col === col);
    return cell?.value ?? 0;
  };

  return (
    <div className="rounded-xl bg-[var(--card)] border border-[var(--border)] p-5">
      <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
        <Grid3X3 className="h-4 w-4 text-[var(--primary)]" />
        Correlation Matrix (3M)
      </h3>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              <th className="text-[10px] font-semibold text-[var(--on-surface-variant)] px-2 py-1.5"></th>
              {syms.map((s) => (
                <th key={s} className="text-[10px] font-bold text-center px-2 py-1.5 min-w-[52px]">{s}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {syms.map((row) => (
              <tr key={row}>
                <td className="text-[10px] font-bold px-2 py-1">{row}</td>
                {syms.map((col) => {
                  const val = getVal(row, col);
                  const isDiag = row === col;
                  return (
                    <td key={col} className="px-1 py-1">
                      <div
                        className={`rounded-lg text-center py-1.5 text-[11px] font-bold ${
                          isDiag ? "bg-[var(--primary-container)] text-[var(--primary)]" : `${getColor(val)} ${getTextColor(val)}`
                        }`}
                      >
                        {isDiag ? "1.00" : val.toFixed(2)}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-2 mt-4 text-[10px] text-[var(--on-surface-variant)]">
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-red-500/60" /> -1.0</div>
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-red-500/10" /> -0.3</div>
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-[var(--surface-container-high)]" /> 0</div>
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-emerald-500/10" /> 0.3</div>
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-emerald-500/60" /> 1.0</div>
      </div>
    </div>
  );
}
