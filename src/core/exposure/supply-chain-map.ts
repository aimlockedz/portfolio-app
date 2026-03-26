// Supply Chain Cluster Definitions
export interface ClusterDef {
  name: string;
  description: string;
  symbols: string[];
  riskFactors: string[];
}

export const SUPPLY_CHAIN_CLUSTERS: Record<string, ClusterDef> = {
  ai_datacenter: {
    name: "AI & Data Center",
    description: "Companies driving AI infrastructure: GPU makers, AI chip designers, and hyperscale cloud providers building data centers",
    symbols: ["NVDA", "AMD", "AVGO", "MRVL", "ARM", "SMCI", "DELL", "MSFT", "GOOGL", "GOOG", "AMZN", "META", "ORCL", "TSM", "MU", "QCOM", "INTC"],
    riskFactors: ["AI spending slowdown", "GPU oversupply risk", "Datacenter CAPEX cuts", "Regulatory scrutiny on AI"],
  },
  semiconductor: {
    name: "Semiconductor Manufacturing",
    description: "Chip foundries, equipment makers, and key suppliers in the semiconductor supply chain",
    symbols: ["TSM", "INTC", "GFS", "UMC", "ASML", "AMAT", "LRCX", "KLAC", "TER", "SNPS", "CDNS", "MRVL", "ON", "NXPI", "TXN", "ADI"],
    riskFactors: ["Taiwan geopolitical tension", "Chip cycle downturn", "Export controls", "Fab construction delays"],
  },
  cloud_saas: {
    name: "Cloud & SaaS",
    description: "Cloud infrastructure providers and major SaaS platforms",
    symbols: ["AMZN", "MSFT", "GOOGL", "GOOG", "CRM", "NOW", "SNOW", "DDOG", "NET", "MDB", "ZS", "PANW", "CRWD", "ORCL", "IBM"],
    riskFactors: ["Cloud spending deceleration", "Enterprise budget cuts", "Pricing pressure", "Competition from AI-native tools"],
  },
  consumer_electronics: {
    name: "Consumer Electronics",
    description: "Smartphones, PCs, wearables and their component suppliers",
    symbols: ["AAPL", "QCOM", "SWKS", "CRUS", "TXN", "STM", "SONY", "SSNLF", "DELL", "HPQ", "LOGI"],
    riskFactors: ["Consumer spending weakness", "Smartphone saturation", "Component shortage", "China market access"],
  },
  ev_battery: {
    name: "EV & Battery",
    description: "Electric vehicle makers, battery manufacturers, and lithium/materials suppliers",
    symbols: ["TSLA", "RIVN", "LCID", "NIO", "XPEV", "LI", "BYD", "GM", "F", "TM", "ALB", "LAC", "SQM", "PANW", "QS"],
    riskFactors: ["EV demand slowdown", "Battery material price volatility", "Subsidy policy changes", "China competition"],
  },
  fintech_payments: {
    name: "Fintech & Payments",
    description: "Digital payments, neobanks, and financial technology platforms",
    symbols: ["V", "MA", "PYPL", "SQ", "COIN", "AFRM", "SOFI", "NU", "ADYEN", "FIS", "GPN", "FISV"],
    riskFactors: ["Regulatory tightening", "Credit risk increase", "Crypto volatility", "Interest rate sensitivity"],
  },
  streaming_media: {
    name: "Streaming & Digital Media",
    description: "Video streaming, music, gaming, and digital entertainment",
    symbols: ["NFLX", "DIS", "WBD", "PARA", "ROKU", "SPOT", "RBLX", "EA", "ATVI", "TTWO", "U"],
    riskFactors: ["Subscriber fatigue", "Content cost inflation", "Ad market weakness", "Competition intensifying"],
  },
  biotech_pharma: {
    name: "Biotech & Pharma",
    description: "Biotechnology, pharmaceuticals, and healthcare innovation",
    symbols: ["JNJ", "PFE", "MRK", "ABBV", "LLY", "NVO", "AMGN", "GILD", "BIIB", "REGN", "MRNA", "BNTX", "BMY"],
    riskFactors: ["Drug pricing legislation", "Patent cliff", "Clinical trial failures", "FDA regulatory changes"],
  },
  energy_oil: {
    name: "Energy & Oil",
    description: "Oil & gas producers, refiners, and energy infrastructure",
    symbols: ["XOM", "CVX", "COP", "EOG", "SLB", "HAL", "OXY", "PXD", "DVN", "MPC", "VLO", "PSX"],
    riskFactors: ["Oil price volatility", "OPEC policy changes", "Energy transition pressure", "Geopolitical supply disruption"],
  },
  big_bank: {
    name: "Major Banks",
    description: "Systemically important financial institutions",
    symbols: ["JPM", "BAC", "WFC", "C", "GS", "MS", "USB", "PNC", "TFC", "SCHW"],
    riskFactors: ["Interest rate risk", "Credit deterioration", "Regulatory capital requirements", "Commercial real estate exposure"],
  },
};

// Geographic Revenue Exposure (approximate %)
export const GEO_REVENUE_MAP: Record<string, Record<string, number>> = {
  AAPL: { US: 42, Europe: 25, China: 19, Japan: 7, Other: 7 },
  MSFT: { US: 50, Europe: 25, China: 5, Japan: 5, Other: 15 },
  GOOGL: { US: 48, Europe: 30, China: 0, Japan: 5, Other: 17 },
  GOOG: { US: 48, Europe: 30, China: 0, Japan: 5, Other: 17 },
  AMZN: { US: 60, Europe: 25, China: 0, Japan: 5, Other: 10 },
  META: { US: 42, Europe: 25, China: 0, Japan: 3, Other: 30 },
  NVDA: { US: 25, China: 17, Taiwan: 25, Europe: 8, Other: 25 },
  TSM: { US: 65, China: 10, Taiwan: 5, Europe: 5, Other: 15 },
  TSLA: { US: 47, China: 22, Europe: 20, Other: 11 },
  AMD: { US: 30, China: 15, Taiwan: 15, Europe: 10, Other: 30 },
  INTC: { US: 50, China: 27, Europe: 10, Other: 13 },
  QCOM: { US: 25, China: 62, Europe: 5, Other: 8 },
  AVGO: { US: 35, China: 30, Singapore: 15, Other: 20 },
  MU: { US: 25, China: 10, Taiwan: 25, Japan: 15, Other: 25 },
  ARM: { US: 35, China: 20, Europe: 15, Japan: 10, Other: 20 },
  TXN: { US: 30, China: 45, Europe: 10, Other: 15 },
  NXPI: { US: 20, China: 35, Europe: 25, Other: 20 },
  V: { US: 45, Europe: 25, LatAm: 10, AsiaPac: 15, Other: 5 },
  MA: { US: 35, Europe: 30, AsiaPac: 15, LatAm: 10, Other: 10 },
  JPM: { US: 75, Europe: 10, AsiaPac: 10, Other: 5 },
  JNJ: { US: 52, Europe: 22, AsiaPac: 15, Other: 11 },
  LLY: { US: 60, Europe: 18, China: 8, Japan: 7, Other: 7 },
  NVO: { US: 55, Europe: 20, China: 10, Other: 15 },
  XOM: { US: 40, Europe: 15, AsiaPac: 20, Other: 25 },
  NFLX: { US: 45, Europe: 30, LatAm: 10, AsiaPac: 15 },
  NIO: { China: 95, Europe: 5 },
  XPEV: { China: 90, Europe: 10 },
  LI: { China: 100 },
  BYD: { China: 70, Europe: 15, Other: 15 },
};

// Geopolitical Risk Definitions
export const GEO_RISK_FACTORS: Record<string, { description: string; severity: "low" | "medium" | "high" }> = {
  China: { description: "Trade war escalation, export controls, delisting risk, capital flow restrictions", severity: "high" },
  Taiwan: { description: "Cross-strait tension, semiconductor supply chain single-point-of-failure", severity: "high" },
  Russia: { description: "Sanctions, asset freezes, energy supply disruption", severity: "high" },
  Europe: { description: "GDPR/regulation, economic slowdown, energy costs", severity: "low" },
  Japan: { description: "Yen depreciation, aging demographics", severity: "low" },
  US: { description: "Fed policy, fiscal deficit, regulation changes", severity: "low" },
  LatAm: { description: "Currency volatility, political instability, inflation", severity: "medium" },
  AsiaPac: { description: "Currency risk, diverse regulatory environments", severity: "low" },
  Singapore: { description: "Stable regulatory environment, trade hub", severity: "low" },
  Other: { description: "Diversified exposure across emerging markets", severity: "low" },
};
