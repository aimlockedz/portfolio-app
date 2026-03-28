"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Trash2, RefreshCw, Star, Sparkles, ShoppingCart,
  TrendingUp, TrendingDown, ChevronDown, ChevronUp,
  MessageSquare, ExternalLink, BarChart3, Zap, Brain, Users, Activity,
} from "lucide-react";
import { useToast } from "@/components/ui/toast-provider";

interface WatchlistItem {
  id: string;
  symbol: string;
  convictionLevel: number;
  notes: string;
  addedAt: string;
}

interface QuoteData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  open: number;
  high: number;
  low: number;
  prevClose: number;
  sparkline: number[];
}

interface ProfileData {
  name: string;
  industry: string;
}

interface ScoreData {
  score: number;
  detail: string;
}

interface AiTakeData {
  fundamental?: ScoreData;
  growth?: ScoreData;
  sentiment?: ScoreData;
  technical?: ScoreData;
  overall?: string;
  verdict?: string;
  rawData?: {
    analystStrongBuy?: number;
    analystBuy?: number;
    analystHold?: number;
    analystSell?: number;
    analystStrongSell?: number;
    targetMedian?: number | string;
    targetMean?: number | string;
    targetHigh?: number | string;
    targetLow?: number | string;
    peRatio?: number | string;
    dividendYield?: number;
    high52w?: number;
    low52w?: number;
    beta?: number | string;
  };
  loading?: boolean;
  error?: boolean;
}

function Sparkline({ data, positive }: { data: number[]; positive: boolean }) {
  if (data.length < 2) return <div className="w-20 h-8" />;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const W = 80;
  const H = 32;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * W},${H - ((v - min) / range) * H}`).join(" ");
  const color = positive ? "#34d399" : "#f87171";
  const areaPoints = `0,${H} ${points} ${W},${H}`;

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="shrink-0">
      <defs>
        <linearGradient id={`sg-${positive ? "g" : "r"}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill={`url(#sg-${positive ? "g" : "r"})`} />
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

function ConvictionStars({ level, onChange }: { level: number; onChange: (level: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-0.5" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          onClick={(e) => { e.stopPropagation(); onChange(i); }}
          onMouseEnter={() => setHover(i)}
          className="p-0 transition-transform hover:scale-110"
        >
          <Star
            className="h-3.5 w-3.5 transition-colors"
            fill={i <= (hover || level) ? "#f59e0b" : "transparent"}
            stroke={i <= (hover || level) ? "#f59e0b" : "var(--on-surface-variant)"}
            strokeWidth={2}
          />
        </button>
      ))}
    </div>
  );
}

function ScoreBar({ score, label, icon: Icon, color }: { score: number; label: string; icon: React.ElementType; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-3.5 w-3.5 shrink-0" style={{ color }} />
      <span className="text-[10px] font-semibold w-20 shrink-0">{label}</span>
      <div className="flex-1 h-2 rounded-full bg-[var(--surface-container-high)] overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${score * 10}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-xs font-bold w-6 text-right" style={{ color }}>
        {score}
      </span>
    </div>
  );
}

const VERDICT_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  "Strong Buy": { bg: "bg-emerald-500/15", text: "text-emerald-400", border: "border-emerald-500/30" },
  "Buy": { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20" },
  "Hold": { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20" },
  "Sell": { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/20" },
  "Strong Sell": { bg: "bg-red-500/15", text: "text-red-400", border: "border-red-500/30" },
};

export function WatchlistClient({ items: initialItems }: { items: WatchlistItem[] }) {
  const [items, setItems] = useState(initialItems);
  const [quotes, setQuotes] = useState<QuoteData[]>([]);
  const [profiles, setProfiles] = useState<Record<string, ProfileData>>({});
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [aiTakes, setAiTakes] = useState<Record<string, AiTakeData>>({});
  const router = useRouter();
  const { confirm, success: toastSuccess } = useToast();

  const fetchQuotes = async () => {
    if (items.length === 0) { setLoading(false); return; }
    setLoading(true);
    try {
      const symbols = items.map((i) => i.symbol).join(",");
      const res = await fetch(`/api/watchlist/quotes?symbols=${symbols}`);
      const json = await res.json();
      setQuotes(json.quotes || []);
    } catch { /* ignore */ }
    setLoading(false);
  };

  const fetchProfiles = async () => {
    const profileMap: Record<string, ProfileData> = {};
    await Promise.all(
      items.map(async (item) => {
        try {
          const res = await fetch(`/api/stock/profile?symbol=${item.symbol}`);
          const data = await res.json();
          if (data.name) profileMap[item.symbol] = { name: data.name, industry: data.industry || "—" };
        } catch { /* skip */ }
      })
    );
    setProfiles(profileMap);
  };

  useEffect(() => {
    fetchQuotes();
    fetchProfiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDelete = async (id: string, symbol: string) => {
    const ok = await confirm({
      title: "Remove from Watchlist",
      message: `Remove ${symbol} from your watchlist?`,
      confirmText: "Remove",
      cancelText: "Keep",
      variant: "danger",
      icon: "trash",
    });
    if (!ok) return;
    setDeleting(id);
    try {
      await fetch(`/api/watchlist/${id}`, { method: "DELETE" });
      setItems((prev) => prev.filter((i) => i.id !== id));
      toastSuccess("Removed", `${symbol} removed from watchlist.`);
    } catch { /* ignore */ }
    setDeleting(null);
  };

  const handleConvictionChange = async (id: string, level: number) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, convictionLevel: level } : i)));
    try {
      await fetch(`/api/watchlist/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ convictionLevel: level }),
      });
    } catch { /* ignore */ }
  };

  const fetchAiTake = async (symbol: string) => {
    if (aiTakes[symbol] && !aiTakes[symbol].error) return;
    setAiTakes((prev) => ({ ...prev, [symbol]: { loading: true } }));

    try {
      const res = await fetch(`/api/watchlist/ai-take?symbol=${symbol}`);
      const data = await res.json();
      setAiTakes((prev) => ({
        ...prev,
        [symbol]: { ...data, loading: false },
      }));
    } catch {
      setAiTakes((prev) => ({
        ...prev,
        [symbol]: { overall: "เกิดข้อผิดพลาด", loading: false, error: true },
      }));
    }
  };

  const getQuote = (symbol: string) => quotes.find((q) => q.symbol === symbol);

  if (items.length === 0) {
    return (
      <div className="rounded-xl bg-[var(--card)] border border-[var(--border)] p-12 text-center">
        <Star className="h-10 w-10 mx-auto mb-3 text-[var(--on-surface-variant)] opacity-50" />
        <p className="text-[var(--on-surface-variant)] font-medium">Your watchlist is empty</p>
        <p className="text-sm text-[var(--on-surface-variant)] opacity-60 mt-1">Add symbols to start tracking.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Refresh button */}
      <div className="flex justify-end">
        <button
          onClick={fetchQuotes}
          className="flex items-center gap-1.5 text-xs text-[var(--on-surface-variant)] hover:text-[var(--foreground)] transition-colors px-3 py-1.5 rounded-lg hover:bg-[var(--surface-container-high)]"
        >
          <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Cards */}
      {items.map((item) => {
        const q = getQuote(item.symbol);
        const positive = (q?.change ?? 0) >= 0;
        const isExpanded = expandedId === item.id;
        const profile = profiles[item.symbol];
        const aiTake = aiTakes[item.symbol];
        const dayRange = q ? ((q.price - q.low) / (q.high - q.low || 1)) * 100 : 50;

        return (
          <div
            key={item.id}
            className="rounded-xl bg-[var(--card)] border border-[var(--border)] overflow-hidden transition-all"
          >
            {/* Main row */}
            <div
              className="flex items-center gap-3 p-4 cursor-pointer hover:bg-[var(--surface-container-low)] transition-colors"
              onClick={() => router.push(`/stock/${item.symbol}`)}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-full bg-[var(--primary-container)] flex items-center justify-center text-[10px] font-bold text-[var(--primary)] shrink-0">
                    {item.symbol.slice(0, 2)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm">{item.symbol}</span>
                      <ConvictionStars
                        level={item.convictionLevel}
                        onChange={(l) => handleConvictionChange(item.id, l)}
                      />
                    </div>
                    <p className="text-[10px] text-[var(--on-surface-variant)] truncate">
                      {profile?.name || "Loading..."} · {profile?.industry || ""}
                    </p>
                  </div>
                </div>
              </div>

              {/* Sparkline — desktop only */}
              <div className="hidden md:block">
                {q ? (
                  <Sparkline data={q.sparkline} positive={positive} />
                ) : (
                  <div className="w-20 h-8 bg-[var(--surface-container-high)] rounded animate-pulse" />
                )}
              </div>

              {/* Price + Change */}
              <div className="text-right shrink-0">
                {loading && !q ? (
                  <div className="h-5 w-16 bg-[var(--surface-container-high)] rounded animate-pulse" />
                ) : q ? (
                  <>
                    <p className="font-bold text-sm">${q.price.toFixed(2)}</p>
                    <div className="flex items-center justify-end gap-1">
                      {positive ? (
                        <TrendingUp className="h-2.5 w-2.5 text-emerald-400" />
                      ) : (
                        <TrendingDown className="h-2.5 w-2.5 text-red-400" />
                      )}
                      <span className={`text-[11px] font-bold ${positive ? "text-emerald-400" : "text-red-400"}`}>
                        {positive ? "+" : ""}{q.changePercent.toFixed(2)}%
                      </span>
                    </div>
                  </>
                ) : (
                  <span className="text-xs text-[var(--on-surface-variant)]">—</span>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => {
                    setExpandedId(isExpanded ? null : item.id);
                    if (!isExpanded) fetchAiTake(item.symbol);
                  }}
                  className="p-1.5 rounded-lg hover:bg-[var(--surface-container-high)] text-[var(--on-surface-variant)] transition-colors"
                  title="AI Analysis"
                >
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
                <button
                  onClick={() => handleDelete(item.id, item.symbol)}
                  disabled={deleting === item.id}
                  className="p-1.5 rounded-lg hover:bg-red-500/10 text-[var(--on-surface-variant)] hover:text-red-400 transition-colors"
                  title="Remove"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Expanded Section — Stock Analysis */}
            {isExpanded && (
              <div className="border-t border-[var(--border)] p-4 space-y-4 bg-[var(--surface-container-low)]/50">
                {/* Price details row */}
                {q && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <span className="text-[10px] text-[var(--on-surface-variant)] uppercase">Open</span>
                      <p className="text-sm font-semibold">${q.open.toFixed(2)}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-[var(--on-surface-variant)] uppercase">Prev Close</span>
                      <p className="text-sm font-semibold">${q.prevClose.toFixed(2)}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-[var(--on-surface-variant)] uppercase">Day High</span>
                      <p className="text-sm font-semibold text-emerald-400">${q.high.toFixed(2)}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-[var(--on-surface-variant)] uppercase">Day Low</span>
                      <p className="text-sm font-semibold text-red-400">${q.low.toFixed(2)}</p>
                    </div>
                  </div>
                )}

                {/* Day range bar */}
                {q && (
                  <div>
                    <div className="flex justify-between text-[10px] text-[var(--on-surface-variant)] mb-1">
                      <span>${q.low.toFixed(2)}</span>
                      <span>Day Range</span>
                      <span>${q.high.toFixed(2)}</span>
                    </div>
                    <div className="relative h-1.5 rounded-full bg-[var(--surface-container-high)]">
                      <div
                        className="absolute h-full rounded-full bg-gradient-to-r from-red-400 via-amber-400 to-emerald-400"
                        style={{ width: "100%" }}
                      />
                      <div
                        className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white border-2 border-[var(--primary)] shadow-sm"
                        style={{ left: `${Math.max(2, Math.min(98, dayRange))}%`, marginLeft: "-6px" }}
                      />
                    </div>
                  </div>
                )}

                {/* Notes */}
                {item.notes && (
                  <div className="flex items-start gap-2 rounded-lg bg-[var(--surface-container-high)] p-3">
                    <MessageSquare className="h-3.5 w-3.5 text-[var(--on-surface-variant)] mt-0.5 shrink-0" />
                    <p className="text-xs text-[var(--on-surface-variant)]">{item.notes}</p>
                  </div>
                )}

                {/* AI Stock Analysis */}
                <div className="rounded-xl bg-blue-500/5 border border-blue-500/15 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-blue-400" />
                      <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                        AI Stock Analysis
                      </span>
                    </div>
                    {aiTake?.verdict && !aiTake.loading && (
                      <span
                        className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${
                          VERDICT_COLORS[aiTake.verdict]?.bg || "bg-gray-500/10"
                        } ${VERDICT_COLORS[aiTake.verdict]?.text || "text-gray-400"} ${
                          VERDICT_COLORS[aiTake.verdict]?.border || "border-gray-500/20"
                        }`}
                      >
                        {aiTake.verdict}
                      </span>
                    )}
                  </div>

                  {aiTake?.loading ? (
                    <div className="space-y-3">
                      <div className="space-y-2">
                        {[1, 2, 3, 4].map((i) => (
                          <div key={i} className="flex items-center gap-2">
                            <div className="w-3.5 h-3.5 rounded bg-blue-400/10 animate-pulse" />
                            <div className="w-20 h-3 rounded bg-blue-400/10 animate-pulse" />
                            <div className="flex-1 h-2 rounded bg-blue-400/10 animate-pulse" />
                          </div>
                        ))}
                      </div>
                      <div className="h-4 w-3/4 rounded bg-blue-400/10 animate-pulse mt-3" />
                      <div className="h-4 w-1/2 rounded bg-blue-400/10 animate-pulse" />
                    </div>
                  ) : aiTake ? (
                    <div className="space-y-3">
                      {/* Score Bars */}
                      {aiTake.fundamental && (
                        <div className="space-y-2">
                          <ScoreBar score={aiTake.fundamental.score} label="Fundamental" icon={BarChart3} color="#3b82f6" />
                          <ScoreBar score={aiTake.growth?.score || 0} label="Growth" icon={Zap} color="#10b981" />
                          <ScoreBar score={aiTake.sentiment?.score || 0} label="Sentiment" icon={Users} color="#f59e0b" />
                          <ScoreBar score={aiTake.technical?.score || 0} label="Technical" icon={Activity} color="#8b5cf6" />
                        </div>
                      )}

                      {/* Score Details (collapsible) */}
                      {aiTake.fundamental && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                          {[
                            { key: "fundamental", icon: BarChart3, color: "#3b82f6", label: "Fundamental" },
                            { key: "growth", icon: Zap, color: "#10b981", label: "Growth" },
                            { key: "sentiment", icon: Users, color: "#f59e0b", label: "Sentiment" },
                            { key: "technical", icon: Activity, color: "#8b5cf6", label: "Technical" },
                          ].map(({ key, icon: SIcon, color, label }) => {
                            const s = aiTake[key as keyof AiTakeData] as ScoreData | undefined;
                            if (!s?.detail) return null;
                            return (
                              <div key={key} className="rounded-lg bg-[var(--surface-container-high)]/50 p-2.5">
                                <div className="flex items-center gap-1.5 mb-1">
                                  <SIcon className="h-3 w-3" style={{ color }} />
                                  <span className="text-[10px] font-bold" style={{ color }}>{label}</span>
                                </div>
                                <p className="text-[11px] text-[var(--on-surface-variant)] leading-relaxed">
                                  {s.detail}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Key Metrics from raw data */}
                      {aiTake.rawData && (
                        <div className="flex flex-wrap gap-2 mt-1">
                          {aiTake.rawData.peRatio && aiTake.rawData.peRatio !== "N/A" && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--surface-container-high)] font-mono">
                              P/E {typeof aiTake.rawData.peRatio === "number" ? aiTake.rawData.peRatio.toFixed(1) : aiTake.rawData.peRatio}
                            </span>
                          )}
                          {aiTake.rawData.targetMedian && aiTake.rawData.targetMedian !== "N/A" && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--surface-container-high)] font-mono">
                              Target ${typeof aiTake.rawData.targetMedian === "number" ? aiTake.rawData.targetMedian.toFixed(0) : aiTake.rawData.targetMedian}
                            </span>
                          )}
                          {aiTake.rawData.dividendYield !== undefined && aiTake.rawData.dividendYield > 0 && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--surface-container-high)] font-mono">
                              Yield {aiTake.rawData.dividendYield.toFixed(2)}%
                            </span>
                          )}
                          {aiTake.rawData.beta && aiTake.rawData.beta !== "N/A" && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--surface-container-high)] font-mono">
                              Beta {typeof aiTake.rawData.beta === "number" ? aiTake.rawData.beta.toFixed(2) : aiTake.rawData.beta}
                            </span>
                          )}
                          {/* Analyst consensus mini */}
                          {(aiTake.rawData.analystBuy || 0) + (aiTake.rawData.analystHold || 0) + (aiTake.rawData.analystSell || 0) > 0 && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-mono">
                              {(aiTake.rawData.analystStrongBuy || 0) + (aiTake.rawData.analystBuy || 0)}B / {aiTake.rawData.analystHold || 0}H / {(aiTake.rawData.analystSell || 0) + (aiTake.rawData.analystStrongSell || 0)}S
                            </span>
                          )}
                        </div>
                      )}

                      {/* Overall Summary */}
                      {aiTake.overall && (
                        <div className="mt-2 pt-2 border-t border-blue-500/10">
                          <div className="flex items-start gap-2">
                            <Brain className="h-3.5 w-3.5 text-blue-400 mt-0.5 shrink-0" />
                            <p className="text-xs text-blue-200 leading-relaxed">{aiTake.overall}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-[var(--on-surface-variant)]">กำลังโหลด...</p>
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => router.push(`/stock/${item.symbol}`)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[var(--surface-container-high)] text-xs font-semibold hover:bg-[var(--surface-container)] transition-colors"
                  >
                    <ExternalLink className="h-3 w-3" />
                    View Detail
                  </button>
                  <button
                    onClick={() => router.push(`/transactions`)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] text-xs font-semibold hover:opacity-90 transition-opacity"
                  >
                    <ShoppingCart className="h-3 w-3" />
                    Buy
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
