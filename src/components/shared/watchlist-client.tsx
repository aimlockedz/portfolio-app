"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Trash2, RefreshCw, Star, Sparkles, ShoppingCart,
  TrendingUp, TrendingDown, ChevronDown, ChevronUp,
  MessageSquare, ExternalLink,
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

function ConvictionStars({
  level,
  onChange,
}: {
  level: number;
  onChange: (level: number) => void;
}) {
  const [hover, setHover] = useState(0);

  return (
    <div className="flex gap-0.5" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onChange(i);
          }}
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

export function WatchlistClient({ items: initialItems }: { items: WatchlistItem[] }) {
  const [items, setItems] = useState(initialItems);
  const [quotes, setQuotes] = useState<QuoteData[]>([]);
  const [profiles, setProfiles] = useState<Record<string, ProfileData>>({});
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [aiTakes, setAiTakes] = useState<Record<string, { text: string; loading: boolean }>>({});
  const router = useRouter();
  const { confirm, success: toastSuccess } = useToast();

  const fetchQuotes = async () => {
    if (items.length === 0) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const symbols = items.map((i) => i.symbol).join(",");
      const res = await fetch(`/api/watchlist/quotes?symbols=${symbols}`);
      const json = await res.json();
      setQuotes(json.quotes || []);
    } catch {
      /* ignore */
    }
    setLoading(false);
  };

  // Fetch profiles for all symbols
  const fetchProfiles = async () => {
    const profileMap: Record<string, ProfileData> = {};
    await Promise.all(
      items.map(async (item) => {
        try {
          const res = await fetch(`/api/stock/profile?symbol=${item.symbol}`);
          const data = await res.json();
          if (data.name) {
            profileMap[item.symbol] = { name: data.name, industry: data.industry || "—" };
          }
        } catch {
          /* skip */
        }
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
    } catch {
      /* ignore */
    }
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
    } catch {
      /* ignore */
    }
  };

  const fetchAiTake = async (symbol: string) => {
    if (aiTakes[symbol]?.text) return; // already fetched
    setAiTakes((prev) => ({ ...prev, [symbol]: { text: "", loading: true } }));

    const q = quotes.find((qq) => qq.symbol === symbol);
    const profile = profiles[symbol];

    try {
      const groqRes = await fetch("/api/portfolio/suggestion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          holdings: [
            {
              symbol,
              name: profile?.name || symbol,
              sector: profile?.industry || "Unknown",
              qty: 0,
              avgCost: 0,
              currentPrice: q?.price || 0,
              pnl: 0,
              pnlPercent: 0,
              dayChangePercent: q?.changePercent || 0,
              weight: 100,
            },
          ],
          totalValue: q?.price || 0,
          totalCost: 0,
          totalPnL: 0,
          totalPnLPct: 0,
          totalDayChange: q?.change || 0,
          totalDayChangePct: q?.changePercent || 0,
        }),
      });
      const data = await groqRes.json();
      setAiTakes((prev) => ({
        ...prev,
        [symbol]: { text: data.suggestion || "ไม่สามารถวิเคราะห์ได้", loading: false },
      }));
    } catch {
      setAiTakes((prev) => ({ ...prev, [symbol]: { text: "เกิดข้อผิดพลาด", loading: false } }));
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
              {/* Symbol + Info */}
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
                      <span
                        className={`text-[11px] font-bold ${
                          positive ? "text-emerald-400" : "text-red-400"
                        }`}
                      >
                        {positive ? "+" : ""}
                        {q.changePercent.toFixed(2)}%
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
                    if (!isExpanded && !aiTake) fetchAiTake(item.symbol);
                  }}
                  className="p-1.5 rounded-lg hover:bg-[var(--surface-container-high)] text-[var(--on-surface-variant)] transition-colors"
                  title="Details"
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

            {/* Expanded Section */}
            {isExpanded && (
              <div className="border-t border-[var(--border)] p-4 space-y-3 bg-[var(--surface-container-low)]/50">
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

                {/* AI Quick Take */}
                <div className="rounded-lg bg-blue-500/5 border border-blue-500/15 p-3">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-blue-400" />
                    <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">AI Quick Take</span>
                  </div>
                  {aiTake?.loading ? (
                    <div className="space-y-1.5">
                      <div className="h-3 w-3/4 rounded bg-blue-400/10 animate-pulse" />
                      <div className="h-3 w-1/2 rounded bg-blue-400/10 animate-pulse" />
                    </div>
                  ) : aiTake?.text ? (
                    <p className="text-xs text-blue-300 leading-relaxed">{aiTake.text}</p>
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
