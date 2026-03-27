"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, RefreshCw } from "lucide-react";
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

function Sparkline({ data, positive }: { data: number[]; positive: boolean }) {
  if (data.length < 2) return <div className="w-16 h-8" />;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const W = 64;
  const H = 28;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * W},${H - ((v - min) / range) * H}`).join(" ");
  const color = positive ? "#22c55e" : "#ef4444";

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="shrink-0">
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

function ConvictionDots({ level }: { level: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="w-1.5 h-1.5 rounded-full"
          style={{
            backgroundColor: i <= level ? (level >= 4 ? "#22c55e" : level >= 2 ? "#f59e0b" : "#ef4444") : "var(--surface-container-high)",
          }}
        />
      ))}
    </div>
  );
}

export function WatchlistClient({ items }: { items: WatchlistItem[] }) {
  const [quotes, setQuotes] = useState<QuoteData[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
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

  useEffect(() => { fetchQuotes(); }, []);

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      title: "Remove from Watchlist",
      message: "Remove this stock from your watchlist?",
      confirmText: "Remove",
      cancelText: "Keep",
      variant: "danger",
      icon: "trash",
    });
    if (!ok) return;
    setDeleting(id);
    try {
      await fetch(`/api/watchlist/${id}`, { method: "DELETE" });
      toastSuccess("Removed", "Stock removed from watchlist.");
      router.refresh();
    } catch { /* ignore */ }
    setDeleting(null);
  };

  const getQuote = (symbol: string) => quotes.find((q) => q.symbol === symbol);

  if (items.length === 0) {
    return (
      <div className="rounded-2xl bg-[var(--card)] p-12 text-center">
        <p className="text-[var(--on-surface-variant)]">Your watchlist is empty. Add symbols to start tracking.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Refresh button */}
      <div className="flex justify-end mb-2">
        <button
          onClick={fetchQuotes}
          className="flex items-center gap-1.5 text-xs text-[var(--on-surface-variant)] hover:text-[var(--on-surface)] transition-colors px-3 py-1.5 rounded-lg hover:bg-[var(--surface-container-high)]"
        >
          <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Table header */}
      <div className="hidden md:grid grid-cols-[1fr_80px_100px_80px_80px_80px_80px_80px_40px] gap-2 px-4 py-2 text-[10px] uppercase tracking-wider text-[var(--on-surface-variant)] font-medium">
        <span>Symbol</span>
        <span className="text-right">Sparkline</span>
        <span className="text-right">Last</span>
        <span className="text-right">Change</span>
        <span className="text-right">% Chg</span>
        <span className="text-right">High</span>
        <span className="text-right">Low</span>
        <span className="text-right">Open</span>
        <span></span>
      </div>

      {/* Rows */}
      {items.map((item) => {
        const q = getQuote(item.symbol);
        const positive = (q?.change ?? 0) >= 0;
        const isLoading = loading && !q;

        return (
          <div
            key={item.id}
            className="grid grid-cols-[1fr_auto] md:grid-cols-[1fr_80px_100px_80px_80px_80px_80px_80px_40px] gap-2 items-center px-4 py-3 rounded-xl bg-[var(--card)] hover:bg-[var(--surface-container-high)] transition-colors cursor-pointer group"
            onClick={() => router.push(`/stock/${item.symbol}`)}
          >
            {/* Symbol + conviction */}
            <div className="flex items-center gap-3 min-w-0">
              <div>
                <div className="font-bold text-sm">{item.symbol}</div>
                <div className="flex items-center gap-2 mt-0.5">
                  <ConvictionDots level={item.convictionLevel} />
                  {item.notes && (
                    <span className="text-[10px] text-[var(--on-surface-variant)] truncate max-w-[120px]">{item.notes}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Mobile: price + change */}
            <div className="flex items-center gap-2 md:hidden">
              {isLoading ? (
                <div className="h-4 w-16 bg-[var(--surface-container-high)] rounded animate-pulse" />
              ) : q ? (
                <div className="text-right">
                  <div className="font-bold text-sm">${q.price.toFixed(2)}</div>
                  <div className={`text-xs ${positive ? "text-green-400" : "text-red-400"}`}>
                    {positive ? "+" : ""}{q.changePercent.toFixed(2)}%
                  </div>
                </div>
              ) : null}
            </div>

            {/* Desktop columns */}
            <div className="hidden md:flex justify-end">
              {q ? <Sparkline data={q.sparkline} positive={positive} /> : <div className="w-16 h-7 bg-[var(--surface-container-high)] rounded animate-pulse" />}
            </div>

            <div className="hidden md:block text-right font-bold text-sm">
              {isLoading ? <div className="h-4 w-16 bg-[var(--surface-container-high)] rounded animate-pulse ml-auto" /> : q ? `$${q.price.toFixed(2)}` : "—"}
            </div>

            <div className={`hidden md:block text-right text-xs font-medium ${positive ? "text-green-400" : "text-red-400"}`}>
              {q ? `${positive ? "+" : ""}${q.change.toFixed(2)}` : "—"}
            </div>

            <div className={`hidden md:block text-right text-xs font-medium`}>
              {q ? (
                <span className={`px-1.5 py-0.5 rounded text-[11px] font-bold ${positive ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                  {positive ? "+" : ""}{q.changePercent.toFixed(2)}%
                </span>
              ) : "—"}
            </div>

            <div className="hidden md:block text-right text-xs text-[var(--on-surface-variant)]">
              {q ? `$${q.high.toFixed(2)}` : "—"}
            </div>

            <div className="hidden md:block text-right text-xs text-[var(--on-surface-variant)]">
              {q ? `$${q.low.toFixed(2)}` : "—"}
            </div>

            <div className="hidden md:block text-right text-xs text-[var(--on-surface-variant)]">
              {q ? `$${q.open.toFixed(2)}` : "—"}
            </div>

            {/* Delete button */}
            <div className="hidden md:flex justify-center">
              <button
                onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                className="p-1 rounded hover:bg-red-500/20 text-[var(--on-surface-variant)] hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                disabled={deleting === item.id}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
