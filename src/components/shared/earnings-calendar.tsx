"use client";

import { useEffect, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Clock, TrendingUp, TrendingDown, Star } from "lucide-react";
import { useRouter } from "next/navigation";

interface EarningsEvent {
  symbol: string;
  date: string;
  hour: string;
  epsEstimate: number | null;
  epsActual: number | null;
  revenueEstimate: number | null;
  revenueActual: number | null;
  quarter: number;
  year: number;
  // enriched client-side
  name?: string;
}

const HOUR_LABELS: Record<string, string> = {
  bmo: "Before Open",
  amc: "After Close",
  dmh: "During Market",
};

const HOUR_ICONS: Record<string, string> = {
  bmo: "🌅",
  amc: "🌙",
  dmh: "☀️",
};

// S&P 500 major constituents (comprehensive list)
const SP500 = new Set([
  "AAPL","ABBV","ABT","ACN","ADBE","ADI","ADM","ADP","ADSK","AEE","AEP","AES","AFL","AIG","AIZ",
  "AJG","AKAM","ALB","ALGN","ALK","ALL","ALLE","AMAT","AMCR","AMD","AME","AMGN","AMP","AMT","AMZN",
  "ANET","ANSS","AON","AOS","APA","APD","APH","APTV","ARE","ATO","ATVI","AVGO","AVY","AWK","AXP",
  "AZO","BA","BAC","BAX","BBWI","BBY","BDX","BEN","BF.B","BIIB","BIO","BK","BKNG","BKR","BLK",
  "BMY","BR","BRK.B","BRO","BSX","BWA","BXP","C","CAG","CAH","CARR","CAT","CB","CBOE","CBRE",
  "CCI","CCL","CDAY","CDNS","CDW","CE","CEG","CF","CFG","CHD","CHRW","CHTR","CI","CINF","CL",
  "CLX","CMA","CMCSA","CME","CMG","CMI","CMS","CNC","CNP","COF","COO","COP","COST","CPB","CPRT",
  "CPT","CRL","CRM","CSCO","CSGP","CSX","CTAS","CTLT","CTRA","CTSH","CTVA","CVS","CVX","CZR",
  "D","DAL","DD","DE","DFS","DG","DGX","DHI","DHR","DIS","DISH","DLR","DLTR","DOV","DOW",
  "DPZ","DRI","DTE","DUK","DVA","DVN","DXC","DXCM","EA","EBAY","ECL","ED","EFX","EIX","EL",
  "EMN","EMR","ENPH","EOG","EPAM","EQIX","EQR","EQT","ES","ESS","ETN","ETR","ETSY","EVRG","EW",
  "EXC","EXPD","EXPE","EXR","F","FANG","FAST","FBHS","FCX","FDS","FDX","FE","FFIV","FIS","FISV",
  "FITB","FLT","FMC","FOX","FOXA","FRC","FRT","FTNT","FTV","GD","GE","GILD","GIS","GL","GLW",
  "GM","GNRC","GOOG","GOOGL","GPC","GPN","GRMN","GS","GWW","HAL","HAS","HBAN","HCA","HD","HOLX",
  "HON","HPE","HPQ","HRL","HSIC","HST","HSY","HUM","HWM","IBM","ICE","IDXX","IEX","IFF","ILMN",
  "INCY","INTC","INTU","INVH","IP","IPG","IQV","IR","IRM","ISRG","IT","ITW","IVZ","J","JBHT",
  "JCI","JKHY","JNJ","JNPR","JPM","K","KDP","KEY","KEYS","KHC","KIM","KLAC","KMB","KMI","KMX",
  "KO","KR","L","LDOS","LEN","LH","LHX","LIN","LKQ","LLY","LMT","LNC","LNT","LOW","LRCX",
  "LUMN","LUV","LVS","LW","LYB","LYV","MA","MAA","MAR","MAS","MCD","MCHP","MCK","MCO","MDLZ",
  "MDT","MET","META","MGM","MHK","MKC","MKTX","MLM","MMC","MMM","MNST","MO","MOH","MOS","MPC",
  "MPWR","MRK","MRNA","MRO","MS","MSCI","MSFT","MSI","MTB","MTCH","MTD","MU","NCLH","NDAQ",
  "NDSN","NEE","NEM","NFLX","NI","NKE","NOC","NOW","NRG","NSC","NTAP","NTRS","NUE","NVDA",
  "NVR","NWL","NWS","NWSA","NXPI","O","ODFL","OGN","OKE","OMC","ON","ORCL","ORLY","OTIS","OXY",
  "PARA","PAYC","PAYX","PCAR","PCG","PEAK","PEG","PEP","PFE","PFG","PG","PGR","PH","PHM","PKG",
  "PKI","PLD","PM","PNC","PNR","PNW","POOL","PPG","PPL","PRU","PSA","PSX","PTC","PVH","PWR",
  "PXD","PYPL","QCOM","QRVO","RCL","RE","REG","REGN","RF","RHI","RJF","RL","RMD","ROK","ROL",
  "ROP","ROST","RSG","RTX","SBAC","SBNY","SBUX","SCHW","SEE","SHW","SIVB","SJM","SLB","SNA",
  "SNPS","SO","SPG","SPGI","SRE","STE","STT","STX","STZ","SWK","SWKS","SYF","SYK","SYY",
  "T","TAP","TDG","TDY","TECH","TEL","TER","TFC","TFX","TGT","TMO","TMUS","TPR","TRGP","TRMB",
  "TROW","TRV","TSCO","TSLA","TSN","TT","TTWO","TXN","TXT","TYL","UAL","UDR","UHS","ULTA",
  "UNH","UNP","UPS","URI","USB","V","VFC","VICI","VLO","VMC","VNO","VRSK","VRSN","VRTX","VTR",
  "VTRS","VZ","WAB","WAT","WBA","WBD","WDC","WEC","WELL","WFC","WHR","WM","WMB","WMT","WRB",
  "WRK","WST","WTW","WY","WYNN","XEL","XOM","XRAY","XYL","YUM","ZBH","ZBRA","ZION","ZTS",
]);

// Nasdaq 100 constituents
const NDX100 = new Set([
  "AAPL","ABNB","ADBE","ADI","ADP","ADSK","AEP","AMAT","AMGN","AMZN",
  "ANSS","ARM","ASML","AVGO","AZN","BIIB","BKNG","BKR","CCEP","CDNS",
  "CDW","CEG","CHTR","CMCSA","COST","CPRT","CRWD","CSCO","CSGP","CTAS",
  "CTSH","DASH","DDOG","DLTR","DXCM","EA","EXC","FANG","FAST","FTNT",
  "GEHC","GFS","GILD","GOOG","GOOGL","HON","IDXX","ILMN","INTC","INTU",
  "ISRG","KDP","KHC","KLAC","LIN","LRCX","LULU","MAR","MCHP","MDB",
  "MDLZ","MELI","META","MNST","MRNA","MRVL","MSFT","MU","NFLX","NVDA",
  "NXPI","ODFL","ON","ORLY","PANW","PAYX","PCAR","PDD","PEP","PYPL",
  "QCOM","REGN","ROP","ROST","SBUX","SNPS","SPLK","TEAM","TMUS","TSLA",
  "TTD","TTWO","TXN","VRSK","VRTX","WBA","WBD","WDAY","XEL","ZS",
]);

function getLogoUrl(symbol: string): string {
  return `https://financialmodelingprep.com/image-stock/${symbol}.png`;
}

function getWeekRange(offset: number) {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1) + offset * 7);
  const friday = new Date(monday);
  friday.setDate(monday.getDate() + 4);

  return {
    from: monday.toISOString().split("T")[0],
    to: friday.toISOString().split("T")[0],
    label: `${monday.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${friday.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`,
  };
}

function LogoAvatar({ symbol, isSP500, isNDX }: { symbol: string; isSP500: boolean; isNDX: boolean }) {
  const [imgError, setImgError] = useState(false);
  const ringClass = isSP500 ? "ring-2 ring-amber-400/50" : isNDX ? "ring-2 ring-blue-400/50" : "";

  return (
    <div className={`relative w-9 h-9 rounded-full flex items-center justify-center shrink-0 overflow-hidden ${ringClass} bg-[var(--primary-container)]`}>
      {!imgError ? (
        <img
          src={getLogoUrl(symbol)}
          alt={symbol}
          width={36}
          height={36}
          className="w-full h-full object-contain rounded-full"
          onError={() => setImgError(true)}
        />
      ) : (
        <span className="text-[10px] font-bold text-[var(--primary)]">
          {symbol.slice(0, 2)}
        </span>
      )}
    </div>
  );
}

export function EarningsCalendar() {
  const router = useRouter();
  const [earnings, setEarnings] = useState<EarningsEvent[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [weekOffset, setWeekOffset] = useState(0);
  const [week, setWeek] = useState(getWeekRange(0));

  useEffect(() => {
    const w = getWeekRange(weekOffset);
    setWeek(w);
    setLoading(true);

    fetch(`/api/market/earnings?from=${w.from}&to=${w.to}`)
      .then((r) => r.json())
      .then((d) => {
        const list: EarningsEvent[] = d.earnings || [];
        setEarnings(list);
        // Fetch company names for visible symbols (limit to first 40)
        const syms = [...new Set(list.map((e) => e.symbol))].slice(0, 40);
        fetchNames(syms);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [weekOffset]);

  async function fetchNames(symbols: string[]) {
    const nameMap: Record<string, string> = {};
    await Promise.all(
      symbols.map(async (sym) => {
        try {
          const res = await fetch(`/api/stock/profile?symbol=${sym}`);
          const data = await res.json();
          if (data.name) nameMap[sym] = data.name;
        } catch { /* skip */ }
      })
    );
    setNames(nameMap);
  }

  // Group by date
  const grouped: Record<string, EarningsEvent[]> = {};
  earnings.forEach((e) => {
    if (!grouped[e.date]) grouped[e.date] = [];
    grouped[e.date].push(e);
  });

  // Sort: S&P 500 first, then NDX100, then others
  Object.values(grouped).forEach((events) => {
    events.sort((a, b) => {
      const aRank = SP500.has(a.symbol) ? 0 : NDX100.has(a.symbol) ? 1 : 2;
      const bRank = SP500.has(b.symbol) ? 0 : NDX100.has(b.symbol) ? 1 : 2;
      if (aRank !== bRank) return aRank - bRank;
      const order: Record<string, number> = { bmo: 0, dmh: 1, amc: 2 };
      return (order[a.hour] ?? 1) - (order[b.hour] ?? 1);
    });
  });

  const sortedDates = Object.keys(grouped).sort();

  const getDayName = (dateStr: string) => {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
  };

  const sp500Count = earnings.filter((e) => SP500.has(e.symbol)).length;
  const ndx100Count = earnings.filter((e) => NDX100.has(e.symbol) && !SP500.has(e.symbol)).length;

  return (
    <div className="space-y-4">
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setWeekOffset((p) => p - 1)}
          className="p-2 rounded-full hover:bg-[var(--surface-container-high)] transition-all"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="text-center">
          <p className="font-bold text-sm">{week.label}</p>
          <p className="text-[10px] text-[var(--on-surface-variant)]">
            {weekOffset === 0 ? "This Week" : weekOffset === 1 ? "Next Week" : weekOffset === -1 ? "Last Week" : ""}
          </p>
        </div>
        <button
          onClick={() => setWeekOffset((p) => p + 1)}
          className="p-2 rounded-full hover:bg-[var(--surface-container-high)] transition-all"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Summary */}
      {!loading && earnings.length > 0 && (
        <div className="flex items-center gap-4 text-[11px] text-[var(--on-surface-variant)] flex-wrap">
          <span>{earnings.length} US companies reporting</span>
          {sp500Count > 0 && (
            <span className="flex items-center gap-1 text-amber-400 font-semibold">
              <Star className="h-3 w-3 fill-amber-400" /> {sp500Count} S&P 500
            </span>
          )}
          {ndx100Count > 0 && (
            <span className="flex items-center gap-1 text-blue-400 font-semibold">
              <Star className="h-3 w-3 fill-blue-400" /> {ndx100Count} Nasdaq 100
            </span>
          )}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-[var(--primary)] border-t-transparent" />
        </div>
      ) : earnings.length === 0 ? (
        <div className="text-center py-12 text-[var(--on-surface-variant)]">
          <CalendarDays className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium">No earnings this week</p>
          <p className="text-sm mt-1">Try navigating to a different week.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedDates.map((date) => {
            const events = grouped[date];
            const daySP500 = events.filter((e) => SP500.has(e.symbol)).length;
            const dayNDX = events.filter((e) => NDX100.has(e.symbol) && !SP500.has(e.symbol)).length;

            return (
              <div key={date} className="rounded-xl bg-[var(--card)] border border-[var(--border)] overflow-hidden">
                <div className="px-5 py-3 bg-[var(--surface-container-low)] border-b border-[var(--border)] flex items-center justify-between">
                  <div>
                    <p className="font-bold text-sm">{getDayName(date)}</p>
                    <p className="text-[10px] text-[var(--on-surface-variant)]">{events.length} companies</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {daySP500 > 0 && (
                      <span className="flex items-center gap-1 text-[10px] text-amber-400 font-bold px-2 py-1 rounded-full bg-amber-400/10">
                        <Star className="h-3 w-3 fill-amber-400" /> {daySP500} S&P 500
                      </span>
                    )}
                    {dayNDX > 0 && (
                      <span className="flex items-center gap-1 text-[10px] text-blue-400 font-bold px-2 py-1 rounded-full bg-blue-400/10">
                        <Star className="h-3 w-3 fill-blue-400" /> {dayNDX} NDX
                      </span>
                    )}
                  </div>
                </div>
                <div className="divide-y divide-[var(--border)]">
                  {events.slice(0, 40).map((e, idx) => {
                    const beat = e.epsActual !== null && e.epsEstimate !== null && e.epsActual > e.epsEstimate;
                    const miss = e.epsActual !== null && e.epsEstimate !== null && e.epsActual < e.epsEstimate;
                    const isSP500 = SP500.has(e.symbol);
                    const isNDX = NDX100.has(e.symbol);
                    const companyName = names[e.symbol] || "";

                    return (
                      <div
                        key={`${e.symbol}-${idx}`}
                        onClick={() => router.push(`/stock/${e.symbol}`)}
                        className={`flex items-center justify-between px-5 py-3 cursor-pointer transition-all ${
                          isSP500
                            ? "bg-amber-400/[0.03] hover:bg-amber-400/[0.07]"
                            : isNDX
                            ? "bg-blue-400/[0.03] hover:bg-blue-400/[0.07]"
                            : "hover:bg-[var(--surface-container-low)]"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <LogoAvatar symbol={e.symbol} isSP500={isSP500} isNDX={isNDX} />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-sm">{e.symbol}</span>
                              {isSP500 && (
                                <span className="flex items-center gap-0.5 text-[9px] font-bold text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded-full">
                                  <Star className="h-2.5 w-2.5 fill-amber-400" /> S&P 500
                                </span>
                              )}
                              {isNDX && !isSP500 && (
                                <span className="flex items-center gap-0.5 text-[9px] font-bold text-blue-400 bg-blue-400/10 px-1.5 py-0.5 rounded-full">
                                  <Star className="h-2.5 w-2.5 fill-blue-400" /> NDX 100
                                </span>
                              )}
                              {isSP500 && isNDX && (
                                <span className="flex items-center gap-0.5 text-[9px] font-bold text-blue-400 bg-blue-400/10 px-1.5 py-0.5 rounded-full">
                                  NDX
                                </span>
                              )}
                            </div>
                            {companyName && (
                              <p className="text-[11px] text-[var(--on-surface-variant)] truncate max-w-[200px]">{companyName}</p>
                            )}
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[10px]">{HOUR_ICONS[e.hour] || "📅"}</span>
                              <span className="text-[10px] text-[var(--on-surface-variant)]">
                                {HOUR_LABELS[e.hour] || e.hour || "TBA"}
                              </span>
                              {e.quarter && (
                                <span className="text-[10px] text-[var(--on-surface-variant)]">
                                  · Q{e.quarter} {e.year}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right flex items-center gap-3 shrink-0">
                          {e.revenueEstimate !== null && (
                            <div className="hidden sm:block">
                              <p className="text-[10px] text-[var(--on-surface-variant)]">Rev Est.</p>
                              <p className="text-xs font-semibold">
                                ${(e.revenueEstimate / 1e9).toFixed(1)}B
                              </p>
                            </div>
                          )}
                          {e.epsEstimate !== null && (
                            <div>
                              <p className="text-[10px] text-[var(--on-surface-variant)]">EPS Est.</p>
                              <p className="text-sm font-semibold">${e.epsEstimate?.toFixed(2)}</p>
                            </div>
                          )}
                          {e.epsActual !== null && (
                            <div>
                              <p className="text-[10px] text-[var(--on-surface-variant)]">Actual</p>
                              <p className={`text-sm font-bold ${beat ? "text-emerald-400" : miss ? "text-red-400" : ""}`}>
                                ${e.epsActual?.toFixed(2)}
                              </p>
                            </div>
                          )}
                          {beat && <TrendingUp className="h-4 w-4 text-emerald-400" />}
                          {miss && <TrendingDown className="h-4 w-4 text-red-400" />}
                          {e.epsActual === null && (
                            <Clock className="h-4 w-4 text-[var(--on-surface-variant)] opacity-40" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {events.length > 40 && (
                    <div className="px-5 py-2 text-center text-[10px] text-[var(--on-surface-variant)]">
                      +{events.length - 40} more companies
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
