import { SUPPLY_CHAIN_CLUSTERS, GEO_REVENUE_MAP, GEO_RISK_FACTORS, type ClusterDef } from "./supply-chain-map";

export interface HoldingInput {
  symbol: string;
  marketValue: number;
  industry?: string;
  country?: string;
}

export interface ClusterExposure {
  id: string;
  name: string;
  description: string;
  holdings: { symbol: string; percentOfPortfolio: number }[];
  concentrationPercent: number;
  riskLevel: "low" | "medium" | "high" | "critical";
  riskFactors: string[];
}

export interface RegionExposure {
  region: string;
  revenuePercent: number;
  riskLevel: "low" | "medium" | "high";
  riskDescription: string;
}

export interface ConcentrationScore {
  score: number; // 0-100
  topCluster: string;
  topClusterPercent: number;
  recommendation: string;
}

export interface ExposureResult {
  clusters: ClusterExposure[];
  geoExposure: RegionExposure[];
  concentration: ConcentrationScore;
  totalPortfolioValue: number;
}

function getRiskLevel(percent: number): "low" | "medium" | "high" | "critical" {
  if (percent >= 60) return "critical";
  if (percent >= 40) return "high";
  if (percent >= 20) return "medium";
  return "low";
}

export function analyzeExposure(holdings: HoldingInput[]): ExposureResult {
  const totalValue = holdings.reduce((sum, h) => sum + h.marketValue, 0);
  if (totalValue === 0) {
    return {
      clusters: [],
      geoExposure: [],
      concentration: { score: 0, topCluster: "N/A", topClusterPercent: 0, recommendation: "Add holdings to see analysis" },
      totalPortfolioValue: 0,
    };
  }

  // --- Supply Chain Clusters ---
  const clusters: ClusterExposure[] = [];

  for (const [id, cluster] of Object.entries(SUPPLY_CHAIN_CLUSTERS)) {
    const matchedHoldings = holdings.filter((h) =>
      cluster.symbols.includes(h.symbol.toUpperCase())
    );

    if (matchedHoldings.length === 0) continue;

    const clusterValue = matchedHoldings.reduce((sum, h) => sum + h.marketValue, 0);
    const concentrationPercent = (clusterValue / totalValue) * 100;

    clusters.push({
      id,
      name: cluster.name,
      description: cluster.description,
      holdings: matchedHoldings.map((h) => ({
        symbol: h.symbol,
        percentOfPortfolio: (h.marketValue / totalValue) * 100,
      })),
      concentrationPercent,
      riskLevel: getRiskLevel(concentrationPercent),
      riskFactors: cluster.riskFactors,
    });
  }

  // Also group by Finnhub industry for stocks not in any cluster
  const clusteredSymbols = new Set(clusters.flatMap((c) => c.holdings.map((h) => h.symbol)));
  const unclustered = holdings.filter((h) => !clusteredSymbols.has(h.symbol) && h.industry);
  const industryGroups: Record<string, HoldingInput[]> = {};
  for (const h of unclustered) {
    const key = h.industry!;
    if (!industryGroups[key]) industryGroups[key] = [];
    industryGroups[key].push(h);
  }
  for (const [industry, group] of Object.entries(industryGroups)) {
    if (group.length < 2) continue;
    const groupValue = group.reduce((sum, h) => sum + h.marketValue, 0);
    const pct = (groupValue / totalValue) * 100;
    clusters.push({
      id: `industry_${industry.toLowerCase().replace(/\s/g, "_")}`,
      name: industry,
      description: `Stocks grouped by industry: ${industry}`,
      holdings: group.map((h) => ({
        symbol: h.symbol,
        percentOfPortfolio: (h.marketValue / totalValue) * 100,
      })),
      concentrationPercent: pct,
      riskLevel: getRiskLevel(pct),
      riskFactors: ["Industry-specific downturn"],
    });
  }

  clusters.sort((a, b) => b.concentrationPercent - a.concentrationPercent);

  // --- Geographic Exposure ---
  const regionTotals: Record<string, number> = {};

  for (const h of holdings) {
    const sym = h.symbol.toUpperCase();
    const geoMap = GEO_REVENUE_MAP[sym];
    const weight = h.marketValue / totalValue;

    if (geoMap) {
      for (const [region, pct] of Object.entries(geoMap)) {
        regionTotals[region] = (regionTotals[region] || 0) + weight * pct;
      }
    } else {
      // Fallback: use country from Finnhub profile
      const region = h.country || "Other";
      regionTotals[region] = (regionTotals[region] || 0) + weight * 100;
    }
  }

  const geoExposure: RegionExposure[] = Object.entries(regionTotals)
    .map(([region, pct]) => {
      const risk = GEO_RISK_FACTORS[region] || GEO_RISK_FACTORS["Other"]!;
      return {
        region,
        revenuePercent: Math.round(pct * 10) / 10,
        riskLevel: risk.severity,
        riskDescription: risk.description,
      };
    })
    .sort((a, b) => b.revenuePercent - a.revenuePercent);

  // --- Concentration Score ---
  const topCluster = clusters[0];
  const highRiskGeo = geoExposure
    .filter((g) => g.riskLevel === "high")
    .reduce((sum, g) => sum + g.revenuePercent, 0);

  // Score: weighted combo of top cluster concentration + high-risk geo
  const clusterScore = topCluster ? Math.min(topCluster.concentrationPercent * 1.2, 80) : 0;
  const geoScore = Math.min(highRiskGeo * 0.5, 20);
  const score = Math.round(Math.min(clusterScore + geoScore, 100));

  let recommendation = "";
  if (score >= 70) {
    recommendation = `High concentration risk! ${topCluster?.name || "Your top sector"} represents ${topCluster?.concentrationPercent.toFixed(0)}% of your portfolio. Consider diversifying across different sectors.`;
  } else if (score >= 40) {
    recommendation = `Moderate concentration in ${topCluster?.name || "one sector"}. Monitor supply chain dependencies and consider gradual diversification.`;
  } else {
    recommendation = "Good diversification. Your portfolio has balanced exposure across sectors.";
  }

  return {
    clusters,
    geoExposure,
    concentration: {
      score,
      topCluster: topCluster?.name || "N/A",
      topClusterPercent: topCluster?.concentrationPercent || 0,
      recommendation,
    },
    totalPortfolioValue: totalValue,
  };
}
