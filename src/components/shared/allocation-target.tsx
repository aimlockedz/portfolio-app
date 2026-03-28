"use client";

import { useEffect, useState } from "react";
import { PieChart, Plus, X, Check, Edit3, ChevronDown } from "lucide-react";

interface AllocTarget {
  id: string;
  sector: string;
  targetPercent: number;
}

interface ActualAllocation {
  sector: string;
  percent: number;
  value: number;
}

interface Props {
  holdings: { symbol: string; totalQuantity: number; averageCost: number }[];
  quotes: Record<string, { currentPrice: number }>;
  profiles: Record<string, { industry: string; name: string }>;
}

// GICS (Global Industry Classification Standard) sectors — real market segments
const GICS_SECTORS = [
  { value: "Information Technology", label: "Information Technology", emoji: "💻" },
  { value: "Health Care", label: "Health Care", emoji: "🏥" },
  { value: "Financials", label: "Financials", emoji: "🏦" },
  { value: "Consumer Discretionary", label: "Consumer Discretionary", emoji: "🛍️" },
  { value: "Communication Services", label: "Communication Services", emoji: "📡" },
  { value: "Industrials", label: "Industrials", emoji: "🏗️" },
  { value: "Consumer Staples", label: "Consumer Staples", emoji: "🛒" },
  { value: "Energy", label: "Energy", emoji: "⛽" },
  { value: "Utilities", label: "Utilities", emoji: "💡" },
  { value: "Real Estate", label: "Real Estate", emoji: "🏠" },
  { value: "Materials", label: "Materials", emoji: "⚒️" },
] as const;

const SECTOR_COLORS: Record<string, string> = {
  "Information Technology": "#3b82f6",
  "Health Care": "#ec4899",
  Financials: "#06b6d4",
  "Consumer Discretionary": "#f59e0b",
  "Communication Services": "#8b5cf6",
  Industrials: "#6366f1",
  "Consumer Staples": "#10b981",
  Energy: "#ef4444",
  Utilities: "#84cc16",
  "Real Estate": "#14b8a6",
  Materials: "#f97316",
  // Legacy mappings
  Technology: "#3b82f6",
  "Consumer Cyclical": "#f59e0b",
  "Consumer Defensive": "#10b981",
  Healthcare: "#ec4899",
  Financial: "#06b6d4",
  "Basic Materials": "#f97316",
  Other: "#6b7280",
};

function getSectorColor(sector: string): string {
  // Try partial match
  for (const [key, color] of Object.entries(SECTOR_COLORS)) {
    if (sector.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(sector.toLowerCase())) {
      return color;
    }
  }
  return SECTOR_COLORS.Other;
}

export function AllocationTarget({ holdings, quotes, profiles }: Props) {
  const [targets, setTargets] = useState<AllocTarget[]>([]);
  const [editing, setEditing] = useState(false);
  const [editTargets, setEditTargets] = useState<{ sector: string; targetPercent: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/portfolio/allocation-targets")
      .then((r) => r.json())
      .then((d) => setTargets(d.targets || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Calculate actual allocation by sector
  const actual: ActualAllocation[] = [];
  const sectorMap: Record<string, number> = {};

  for (const h of holdings) {
    const price = quotes[h.symbol]?.currentPrice ?? 0;
    const value = price > 0 ? h.totalQuantity * price : (h.totalQuantity * h.averageCost) / 100;
    const sector = profiles[h.symbol]?.industry || "Other";
    // Group by broad sector
    const broadSector = getBroadSector(sector);
    sectorMap[broadSector] = (sectorMap[broadSector] || 0) + value;
  }

  const totalValue = Object.values(sectorMap).reduce((s, v) => s + v, 0);

  for (const [sector, value] of Object.entries(sectorMap)) {
    actual.push({
      sector,
      percent: totalValue > 0 ? (value / totalValue) * 100 : 0,
      value,
    });
  }
  actual.sort((a, b) => b.percent - a.percent);

  function getBroadSector(industry: string): string {
    const i = industry.toLowerCase();
    if (i.includes("tech") || i.includes("software") || i.includes("semiconductor") || i.includes("internet")) return "Information Technology";
    if (i.includes("communication") || i.includes("media") || i.includes("entertainment")) return "Communication Services";
    if (i.includes("consumer") && (i.includes("cyclical") || i.includes("discretionary") || i.includes("retail"))) return "Consumer Discretionary";
    if (i.includes("consumer") && (i.includes("defensive") || i.includes("staple"))) return "Consumer Staples";
    if (i.includes("health") || i.includes("pharma") || i.includes("biotech")) return "Health Care";
    if (i.includes("financ") || i.includes("bank") || i.includes("insurance")) return "Financials";
    if (i.includes("industr") || i.includes("aerospace") || i.includes("defense")) return "Industrials";
    if (i.includes("energy") || i.includes("oil") || i.includes("gas")) return "Energy";
    if (i.includes("real estate") || i.includes("reit")) return "Real Estate";
    if (i.includes("utilit")) return "Utilities";
    if (i.includes("material") || i.includes("mining") || i.includes("chemical")) return "Materials";
    // Check if it already matches a GICS sector
    const match = GICS_SECTORS.find((s) => s.value.toLowerCase() === i);
    if (match) return match.value;
    return industry || "Other";
  }

  function startEditing() {
    // Pre-fill with existing targets or actual allocation
    if (targets.length > 0) {
      setEditTargets(targets.map((t) => ({ sector: t.sector, targetPercent: t.targetPercent })));
    } else {
      setEditTargets(actual.map((a) => ({ sector: mapToGicsSector(a.sector), targetPercent: Math.round(a.percent) })));
    }
    setEditing(true);
  }

  // Map current portfolio sectors to GICS
  function mapToGicsSector(sector: string): string {
    const s = sector.toLowerCase();
    if (s.includes("tech") || s.includes("software") || s.includes("semiconductor") || s.includes("internet")) return "Information Technology";
    if (s.includes("health") || s.includes("pharma") || s.includes("biotech")) return "Health Care";
    if (s.includes("financ") || s.includes("bank") || s.includes("insurance")) return "Financials";
    if (s.includes("consumer") && (s.includes("cyclical") || s.includes("discretionary") || s.includes("retail"))) return "Consumer Discretionary";
    if (s.includes("communication") || s.includes("media") || s.includes("entertainment")) return "Communication Services";
    if (s.includes("industr") || s.includes("aerospace") || s.includes("defense")) return "Industrials";
    if (s.includes("consumer") && (s.includes("defensive") || s.includes("staple"))) return "Consumer Staples";
    if (s.includes("energy") || s.includes("oil") || s.includes("gas")) return "Energy";
    if (s.includes("utilit")) return "Utilities";
    if (s.includes("real estate") || s.includes("reit")) return "Real Estate";
    if (s.includes("material") || s.includes("mining") || s.includes("chemical")) return "Materials";
    // Try exact match from GICS list
    const exact = GICS_SECTORS.find((g) => g.value === sector);
    return exact ? exact.value : sector;
  }

  // Get available sectors (not yet added)
  function getAvailableSectors() {
    const used = new Set(editTargets.map((t) => t.sector));
    return GICS_SECTORS.filter((s) => !used.has(s.value));
  }

  function addEditRow() {
    const available = getAvailableSectors();
    if (available.length === 0) return;
    setEditTargets((prev) => [...prev, { sector: available[0].value, targetPercent: 0 }]);
  }

  function removeEditRow(idx: number) {
    setEditTargets((prev) => prev.filter((_, i) => i !== idx));
  }

  async function saveTargets() {
    const valid = editTargets.filter((t) => t.sector && t.targetPercent > 0);
    const res = await fetch("/api/portfolio/allocation-targets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targets: valid }),
    });
    if (res.ok) {
      setTargets(valid.map((t, i) => ({ id: `t-${i}`, sector: t.sector, targetPercent: t.targetPercent })));
      setEditing(false);
    }
  }

  const totalEditPct = editTargets.reduce((s, t) => s + (t.targetPercent || 0), 0);

  if (loading) {
    return (
      <div className="rounded-xl bg-[var(--card)] border border-[var(--border)] p-5">
        <div className="flex justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-[var(--primary)] border-t-transparent" />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-[var(--card)] border border-[var(--border)] p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-sm flex items-center gap-2">
          <PieChart className="h-4 w-4 text-[var(--primary)]" />
          Allocation Target
        </h3>
        <button
          onClick={editing ? () => setEditing(false) : startEditing}
          className="text-[10px] font-bold text-[var(--primary)] flex items-center gap-1 hover:opacity-80"
        >
          <Edit3 className="h-3 w-3" />
          {editing ? "Cancel" : targets.length > 0 ? "Edit" : "Set Targets"}
        </button>
      </div>

      {editing ? (
        <div className="space-y-2">
          {editTargets.map((t, i) => {
            const sectorInfo = GICS_SECTORS.find((s) => s.value === t.sector);
            const color = getSectorColor(t.sector);
            return (
              <div key={i} className="flex items-center gap-2">
                {/* Color dot */}
                <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: color }} />
                {/* Sector dropdown */}
                <div className="relative flex-1">
                  <select
                    value={t.sector}
                    onChange={(e) => {
                      const updated = [...editTargets];
                      updated[i].sector = e.target.value;
                      setEditTargets(updated);
                    }}
                    className="w-full appearance-none px-3 py-2 pr-8 rounded-lg bg-[var(--surface-container-high)] text-sm outline-none cursor-pointer"
                  >
                    {/* Current selection */}
                    {sectorInfo && (
                      <option value={sectorInfo.value}>
                        {sectorInfo.emoji} {sectorInfo.label}
                      </option>
                    )}
                    {!sectorInfo && t.sector && (
                      <option value={t.sector}>{t.sector}</option>
                    )}
                    {/* Available sectors */}
                    {GICS_SECTORS.filter(
                      (s) => s.value !== t.sector && !editTargets.some((et, idx) => idx !== i && et.sector === s.value)
                    ).map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.emoji} {s.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--on-surface-variant)] pointer-events-none" />
                </div>
                {/* Percentage input */}
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={t.targetPercent || ""}
                    onChange={(e) => {
                      const updated = [...editTargets];
                      updated[i].targetPercent = parseInt(e.target.value) || 0;
                      setEditTargets(updated);
                    }}
                    className="w-16 px-2 py-2 rounded-lg bg-[var(--surface-container-high)] text-sm text-right outline-none font-mono"
                  />
                  <span className="text-xs text-[var(--on-surface-variant)] font-bold">%</span>
                </div>
                <button onClick={() => removeEditRow(i)} className="text-red-400 hover:opacity-70 p-1">
                  <X className="h-4 w-4" />
                </button>
              </div>
            );
          })}

          {/* Total bar + actions */}
          <div className="pt-3 space-y-2">
            {/* Visual total bar */}
            <div className="h-2 rounded-full bg-[var(--surface-container-high)] overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${totalEditPct === 100 ? "bg-emerald-500" : totalEditPct > 100 ? "bg-red-500" : "bg-amber-500"}`}
                style={{ width: `${Math.min(totalEditPct, 100)}%` }}
              />
            </div>

            <div className="flex items-center justify-between">
              <button
                onClick={addEditRow}
                disabled={getAvailableSectors().length === 0}
                className="text-xs font-bold text-[var(--primary)] flex items-center gap-1 disabled:opacity-40"
              >
                <Plus className="h-3 w-3" /> Add Sector ({getAvailableSectors().length} available)
              </button>
              <div className="flex items-center gap-3">
                <span className={`text-xs font-bold font-mono ${totalEditPct === 100 ? "text-emerald-400" : totalEditPct > 100 ? "text-red-400" : "text-amber-400"}`}>
                  {totalEditPct}% / 100%
                </span>
                <button
                  onClick={saveTargets}
                  disabled={totalEditPct !== 100}
                  className="px-3 py-1.5 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] text-xs font-bold disabled:opacity-40 flex items-center gap-1"
                >
                  <Check className="h-3 w-3" /> Save
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : targets.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-sm text-[var(--on-surface-variant)] mb-3">
            Set allocation targets to compare with your actual portfolio
          </p>
          <button
            onClick={startEditing}
            className="px-4 py-2 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] text-sm font-bold"
          >
            Set Allocation Targets
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Stacked comparison bars */}
          <div className="space-y-2.5">
            {/* Combine all sectors from both targets and actual */}
            {(() => {
              const allSectors = new Set([
                ...targets.map((t) => t.sector),
                ...actual.map((a) => a.sector),
              ]);
              return [...allSectors].map((sector) => {
                const target = targets.find((t) => t.sector === sector);
                const act = actual.find((a) => a.sector === sector);
                const targetPct = target?.targetPercent ?? 0;
                const actualPct = act?.percent ?? 0;
                const diff = actualPct - targetPct;
                const color = getSectorColor(sector);

                return (
                  <div key={sector}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                        <span className="text-xs font-bold">{sector}</span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px]">
                        <span className="text-[var(--on-surface-variant)]">Target: {targetPct}%</span>
                        <span className="font-bold">Actual: {actualPct.toFixed(1)}%</span>
                        <span className={`font-bold ${Math.abs(diff) < 3 ? "text-emerald-400" : diff > 0 ? "text-amber-400" : "text-red-400"}`}>
                          {diff >= 0 ? "+" : ""}{diff.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1 h-3">
                      {/* Target bar */}
                      <div className="relative flex-1 rounded-full bg-[var(--surface-container-high)] overflow-hidden">
                        <div
                          className="absolute h-full rounded-full opacity-30"
                          style={{ width: `${targetPct}%`, backgroundColor: color }}
                        />
                        <div
                          className="absolute h-full rounded-full"
                          style={{ width: `${actualPct}%`, backgroundColor: color }}
                        />
                        {/* Target marker */}
                        {targetPct > 0 && (
                          <div
                            className="absolute h-full w-0.5 bg-white/60"
                            style={{ left: `${targetPct}%` }}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
