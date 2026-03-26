"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Shield, Globe, BarChart3 } from "lucide-react";

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

const RISK_COLORS = {
  low: { bg: "bg-[var(--primary-container)]", text: "text-[var(--primary)]", bar: "#1a6b50" },
  medium: { bg: "bg-[#f59e0b]/15", text: "text-[#f59e0b]", bar: "#f59e0b" },
  high: { bg: "bg-[#fa746f]/15", text: "text-[#dc2626]", bar: "#dc2626" },
  critical: { bg: "bg-[#991b1b]/15", text: "text-[#991b1b]", bar: "#991b1b" },
};

const GEO_BAR_COLORS: Record<string, string> = {
  US: "#3b82f6",
  China: "#dc2626",
  Europe: "#1a6b50",
  Taiwan: "#f59e0b",
  Japan: "#8b5cf6",
  Other: "#6b7280",
  LatAm: "#14b8a6",
  AsiaPac: "#06b6d4",
  Singapore: "#10b981",
  Russia: "#b91c1c",
};

function ScoreGauge({ score }: { score: number }) {
  const color = score >= 70 ? "#dc2626" : score >= 40 ? "#f59e0b" : "#1a6b50";
  const label = score >= 70 ? "High Risk" : score >= 40 ? "Moderate" : "Low Risk";
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-32 h-32">
        <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
          <circle cx="60" cy="60" r="50" fill="none" stroke="var(--surface-container-high)" strokeWidth="10" />
          <circle
            cx="60" cy="60" r="50" fill="none"
            stroke={color} strokeWidth="10" strokeLinecap="round"
            strokeDasharray={`${(score / 100) * 314} 314`}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold" style={{ color }}>{score}</span>
          <span className="text-[10px] text-[var(--on-surface-variant)] uppercase tracking-wider">{label}</span>
        </div>
      </div>
    </div>
  );
}

export function ExposureClient() {
  const [data, setData] = useState<ExposureData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/portfolio/exposure");
        const json = await res.json();
        setData(json);
      } catch {
        /* ignore */
      }
      setLoading(false);
    }
    load();
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
      <div className="rounded-2xl bg-[var(--card)] p-10 text-center">
        <BarChart3 className="h-12 w-12 mx-auto mb-3 text-[var(--on-surface-variant)]" />
        <p className="text-[var(--on-surface-variant)]">Add holdings to your portfolio to see exposure analysis</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Concentration Score */}
      <div className="rounded-2xl bg-[var(--card)] shadow-[0_2px_32px_rgba(0,0,0,0.04)] p-6">
        <div className="flex items-start gap-6 flex-col md:flex-row">
          <ScoreGauge score={data.concentration.score} />
          <div className="flex-1">
            <h3 className="font-[var(--font-headline)] font-bold text-lg mb-2 flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Concentration Risk Score
            </h3>
            <p className="text-sm text-[var(--on-surface-variant)] mb-3">
              {data.concentration.recommendation}
            </p>
            {data.concentration.topClusterPercent > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-[var(--on-surface-variant)]">Top exposure:</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[var(--surface-container-high)]">
                  {data.concentration.topCluster} — {data.concentration.topClusterPercent.toFixed(1)}%
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Supply Chain Clusters */}
      <div className="rounded-2xl bg-[var(--card)] shadow-[0_2px_32px_rgba(0,0,0,0.04)] p-6">
        <h3 className="font-[var(--font-headline)] font-bold text-lg mb-4 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Supply Chain Overlap
        </h3>

        {data.clusters.length === 0 ? (
          <p className="text-sm text-[var(--on-surface-variant)]">No overlapping supply chain clusters detected</p>
        ) : (
          <div className="space-y-4">
            {data.clusters.map((cluster) => {
              const colors = RISK_COLORS[cluster.riskLevel];
              return (
                <div key={cluster.id} className="rounded-xl border border-[var(--border)] p-4">
                  <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm">{cluster.name}</h4>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${colors.bg} ${colors.text}`}>
                        {cluster.riskLevel}
                      </span>
                    </div>
                    <span className="text-sm font-bold">{cluster.concentrationPercent.toFixed(1)}%</span>
                  </div>

                  <p className="text-xs text-[var(--on-surface-variant)] mb-3">{cluster.description}</p>

                  {/* Concentration bar */}
                  <div className="relative h-2 rounded-full bg-[var(--surface-container-high)] mb-3">
                    <div
                      className="absolute h-full rounded-full transition-all"
                      style={{ width: `${Math.min(cluster.concentrationPercent, 100)}%`, backgroundColor: colors.bar }}
                    />
                  </div>

                  {/* Holdings */}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {cluster.holdings.map((h) => (
                      <span key={h.symbol} className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-[var(--surface-container-high)]">
                        {h.symbol} <span className="font-normal text-[var(--on-surface-variant)]">{h.percentOfPortfolio.toFixed(1)}%</span>
                      </span>
                    ))}
                  </div>

                  {/* Risk factors */}
                  <div className="flex flex-wrap gap-1.5">
                    {cluster.riskFactors.map((rf) => (
                      <span key={rf} className="text-[10px] px-2 py-0.5 rounded-full bg-[#fa746f]/10 text-[#a83836]">
                        {rf}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Geographic Revenue Exposure */}
      <div className="rounded-2xl bg-[var(--card)] shadow-[0_2px_32px_rgba(0,0,0,0.04)] p-6">
        <h3 className="font-[var(--font-headline)] font-bold text-lg mb-4 flex items-center gap-2">
          <Globe className="h-5 w-5" />
          Geopolitical Revenue Exposure
        </h3>

        {/* Stacked bar */}
        <div className="flex h-10 rounded-xl overflow-hidden mb-4">
          {data.geoExposure.filter((g) => g.revenuePercent >= 1).map((g) => (
            <div
              key={g.region}
              className="flex items-center justify-center text-[10px] font-bold text-white transition-all relative group"
              style={{
                width: `${g.revenuePercent}%`,
                backgroundColor: GEO_BAR_COLORS[g.region] || "#6b7280",
                minWidth: g.revenuePercent >= 3 ? "32px" : "0",
              }}
            >
              {g.revenuePercent >= 5 && (
                <span>{g.region} {g.revenuePercent.toFixed(0)}%</span>
              )}
            </div>
          ))}
        </div>

        {/* Region table */}
        <div className="space-y-2">
          {data.geoExposure.filter((g) => g.revenuePercent >= 1).map((g) => {
            const isHighRisk = g.riskLevel === "high";
            return (
              <div
                key={g.region}
                className={`flex items-center justify-between py-2 px-3 rounded-lg transition-colors ${
                  isHighRisk ? "bg-[#fa746f]/5" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: GEO_BAR_COLORS[g.region] || "#6b7280" }}
                  />
                  <div>
                    <span className="text-sm font-bold">{g.region}</span>
                    {isHighRisk && (
                      <span className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#fa746f]/15 text-[#dc2626] uppercase">
                        High Risk
                      </span>
                    )}
                    <p className="text-[10px] text-[var(--on-surface-variant)] mt-0.5">{g.riskDescription}</p>
                  </div>
                </div>
                <span className={`text-sm font-bold font-mono ${isHighRisk ? "text-[#dc2626]" : ""}`}>
                  {g.revenuePercent.toFixed(1)}%
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
