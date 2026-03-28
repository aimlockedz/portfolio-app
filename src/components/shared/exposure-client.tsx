"use client";

import { useEffect, useState } from "react";
import { Shield, Globe, BarChart3, AlertTriangle, TrendingUp } from "lucide-react";

interface ClusterExposure {
  id: string;
  name: string;
  description: string;
  holdings: { symbol: string; percentOfPortfolio: number }[];
  concentrationPercent: number;
  riskLevel: "low" | "medium" | "high" | "critical";
  riskFactors: string[];
}

interface RegionExposure {
  region: string;
  revenuePercent: number;
  riskLevel: "low" | "medium" | "high";
  riskDescription: string;
}

interface ConcentrationScore {
  score: number;
  topCluster: string;
  topClusterPercent: number;
  recommendation: string;
}

interface ExposureData {
  clusters: ClusterExposure[];
  geoExposure: RegionExposure[];
  concentration: ConcentrationScore;
  totalPortfolioValue: number;
}

const RISK_BADGE: Record<string, { bg: string; text: string }> = {
  low: { bg: "bg-emerald-500/10", text: "text-emerald-400" },
  medium: { bg: "bg-amber-500/10", text: "text-amber-400" },
  high: { bg: "bg-red-500/10", text: "text-red-400" },
  critical: { bg: "bg-red-600/20", text: "text-red-500" },
};

const GEO_COLORS: Record<string, string> = {
  US: "#3b82f6",
  China: "#dc2626",
  Europe: "#10b981",
  Taiwan: "#f59e0b",
  Japan: "#8b5cf6",
  Other: "#6b7280",
  LatAm: "#14b8a6",
  AsiaPac: "#06b6d4",
  Singapore: "#10b981",
};

export function ExposureClient() {
  const [data, setData] = useState<ExposureData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/portfolio/exposure")
      .then((r) => r.json())
      .then((json) => setData(json))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-[var(--primary)] border-t-transparent" />
      </div>
    );
  }

  if (!data || data.totalPortfolioValue === 0) {
    return (
      <div className="rounded-xl bg-[var(--card)] border border-[var(--border)] p-10 text-center">
        <BarChart3 className="h-12 w-12 mx-auto mb-3 text-[var(--on-surface-variant)]" />
        <p className="text-[var(--on-surface-variant)]">Add holdings to see exposure analysis</p>
      </div>
    );
  }

  const { concentration, clusters, geoExposure } = data;
  const scoreColor = concentration.score >= 70 ? "#ef4444" : concentration.score >= 40 ? "#f59e0b" : "#10b981";
  const scoreLabel = concentration.score >= 70 ? "High" : concentration.score >= 40 ? "Moderate" : "Low";

  return (
    <div className="space-y-5">
      {/* Score + Summary Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Score Card */}
        <div className="rounded-xl bg-[var(--card)] border border-[var(--border)] p-5 flex items-center gap-5">
          <div className="relative w-20 h-20 shrink-0">
            <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
              <circle cx="40" cy="40" r="32" fill="none" stroke="var(--surface-container-high)" strokeWidth="6" />
              <circle
                cx="40" cy="40" r="32" fill="none"
                stroke={scoreColor} strokeWidth="6" strokeLinecap="round"
                strokeDasharray={`${(concentration.score / 100) * 201} 201`}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl font-bold" style={{ color: scoreColor }}>{concentration.score}</span>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Shield className="h-4 w-4" style={{ color: scoreColor }} />
              <span className="text-sm font-bold">Risk: {scoreLabel}</span>
            </div>
            <p className="text-[11px] text-[var(--on-surface-variant)] leading-relaxed">
              {concentration.recommendation}
            </p>
          </div>
        </div>

        {/* Top Concentration */}
        <div className="rounded-xl bg-[var(--card)] border border-[var(--border)] p-5">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-4 w-4 text-[var(--primary)]" />
            <span className="text-sm font-bold">Top Concentration</span>
          </div>
          {concentration.topClusterPercent > 0 ? (
            <div>
              <p className="text-2xl font-bold">{concentration.topClusterPercent.toFixed(1)}%</p>
              <p className="text-xs text-[var(--on-surface-variant)]">{concentration.topCluster}</p>
            </div>
          ) : (
            <p className="text-sm text-[var(--on-surface-variant)]">Well diversified</p>
          )}
        </div>

        {/* Portfolio Value */}
        <div className="rounded-xl bg-[var(--card)] border border-[var(--border)] p-5">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="h-4 w-4 text-[var(--primary)]" />
            <span className="text-sm font-bold">Total Analyzed</span>
          </div>
          <p className="text-2xl font-bold">
            ${data.totalPortfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-[var(--on-surface-variant)]">{clusters.length} overlap clusters detected</p>
        </div>
      </div>

      {/* Geographic Exposure */}
      <div className="rounded-xl bg-[var(--card)] border border-[var(--border)] p-5">
        <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
          <Globe className="h-4 w-4 text-[var(--primary)]" />
          Geographic Revenue Exposure
        </h3>

        {/* Bar chart */}
        <div className="flex h-8 rounded-lg overflow-hidden mb-4">
          {geoExposure.filter((g) => g.revenuePercent >= 1).map((g) => (
            <div
              key={g.region}
              className="flex items-center justify-center text-[10px] font-bold text-white"
              style={{
                width: `${g.revenuePercent}%`,
                backgroundColor: GEO_COLORS[g.region] || "#6b7280",
                minWidth: g.revenuePercent >= 3 ? "28px" : "0",
              }}
            >
              {g.revenuePercent >= 8 && `${g.region} ${g.revenuePercent.toFixed(0)}%`}
            </div>
          ))}
        </div>

        {/* Region list */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {geoExposure.filter((g) => g.revenuePercent >= 1).map((g) => {
            const badge = RISK_BADGE[g.riskLevel] || RISK_BADGE.low;
            return (
              <div key={g.region} className="flex items-center gap-2 rounded-lg bg-[var(--surface-container-low)] px-3 py-2">
                <div
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: GEO_COLORS[g.region] || "#6b7280" }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold">{g.region}</span>
                    <span className="text-xs font-bold font-mono">{g.revenuePercent.toFixed(1)}%</span>
                  </div>
                  {g.riskLevel === "high" && (
                    <span className={`text-[9px] font-bold uppercase ${badge.text}`}>High Risk</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Supply Chain Clusters */}
      {clusters.length > 0 && (
        <div className="rounded-xl bg-[var(--card)] border border-[var(--border)] p-5">
          <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-400" />
            Supply Chain Overlap
          </h3>

          <div className="space-y-3">
            {clusters.map((cluster) => {
              const badge = RISK_BADGE[cluster.riskLevel] || RISK_BADGE.low;
              return (
                <div key={cluster.id} className="rounded-lg border border-[var(--border)] p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm">{cluster.name}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${badge.bg} ${badge.text}`}>
                        {cluster.riskLevel}
                      </span>
                    </div>
                    <span className="text-sm font-bold font-mono">{cluster.concentrationPercent.toFixed(1)}%</span>
                  </div>

                  <p className="text-[11px] text-[var(--on-surface-variant)] mb-2">{cluster.description}</p>

                  {/* Progress bar */}
                  <div className="h-1.5 rounded-full bg-[var(--surface-container-high)] mb-2">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.min(cluster.concentrationPercent, 100)}%`,
                        backgroundColor: badge.text.includes("emerald") ? "#10b981" : badge.text.includes("amber") ? "#f59e0b" : "#ef4444",
                      }}
                    />
                  </div>

                  {/* Holdings + risk factors */}
                  <div className="flex flex-wrap gap-1.5">
                    {cluster.holdings.map((h) => (
                      <span key={h.symbol} className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[var(--surface-container-high)]">
                        {h.symbol} {h.percentOfPortfolio.toFixed(1)}%
                      </span>
                    ))}
                    {cluster.riskFactors.map((rf) => (
                      <span key={rf} className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-400">
                        {rf}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
