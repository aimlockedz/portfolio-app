"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Newspaper, ExternalLink, RefreshCw, Clock, Sparkles, Search, X } from "lucide-react";

interface Article {
  id: number;
  headline: string;
  source: string;
  url: string;
  image: string | null;
  summary: string;
  summaryTh: string;
  suggestion: string | null;
  category: string;
  datetime: number;
  related: string;
}

const CATEGORIES = [
  { key: "all", label: "ทั้งหมด" },
  { key: "general", label: "ข่าวตลาด" },
  { key: "forex", label: "Forex & สกุลเงิน" },
  { key: "crypto", label: "สินทรัพย์ดิจิทัล" },
  { key: "merger", label: "ควบรวม & เข้าซื้อ" },
];

const SUGGESTION_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  "Strong Buy":  { bg: "bg-emerald-500/15", text: "text-emerald-400", border: "border-emerald-500/30" },
  "Buy":         { bg: "bg-green-500/15", text: "text-green-400", border: "border-green-500/30" },
  "Hold":        { bg: "bg-amber-500/15", text: "text-amber-400", border: "border-amber-500/30" },
  "Sell":        { bg: "bg-orange-500/15", text: "text-orange-400", border: "border-orange-500/30" },
  "Strong Sell": { bg: "bg-red-500/15", text: "text-red-400", border: "border-red-500/30" },
};

function timeAgo(unix: number): string {
  const diff = Math.floor(Date.now() / 1000 - unix);
  if (diff < 60) return "เมื่อกี้";
  if (diff < 3600) return `${Math.floor(diff / 60)} นาทีที่แล้ว`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ชม.ที่แล้ว`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} วันที่แล้ว`;
  return new Date(unix * 1000).toLocaleDateString("th-TH");
}

function SuggestionBadge({ suggestion }: { suggestion: string }) {
  const style = SUGGESTION_STYLES[suggestion] || SUGGESTION_STYLES["Hold"];
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full border ${style.bg} ${style.text} ${style.border}`}>
      {suggestion === "Strong Buy" && "🟢"}
      {suggestion === "Buy" && "🟩"}
      {suggestion === "Hold" && "🟡"}
      {suggestion === "Sell" && "🟧"}
      {suggestion === "Strong Sell" && "🔴"}
      {suggestion}
    </span>
  );
}

export function NewsClient() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("all");
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  // Stock search
  const [stockSearch, setStockSearch] = useState("");
  const [searchSymbol, setSearchSymbol] = useState("");
  const [searchResults, setSearchResults] = useState<{ symbol: string; description: string }[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchNews = useCallback(async (cat: string, sym?: string) => {
    setLoading(true);
    setError("");
    try {
      let url = `/api/news?category=${cat}`;
      if (sym) url = `/api/news?symbol=${sym}`;
      const res = await fetch(url);
      const json = await res.json();
      if (json.error) setError(json.error);
      setArticles(json.articles || []);
    } catch {
      setError("ไม่สามารถโหลดข่าวได้");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (searchSymbol) {
      fetchNews("", searchSymbol);
    } else {
      fetchNews(category);
    }
  }, [category, searchSymbol, fetchNews]);

  function handleStockSearch(value: string) {
    setStockSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.length < 1) {
      setSearchResults([]);
      setSearchOpen(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/stock/search?q=${encodeURIComponent(value)}`);
        const data = await res.json();
        setSearchResults(data.results || []);
        setSearchOpen(true);
      } catch {
        setSearchResults([]);
      }
    }, 300);
  }

  function selectStock(sym: string) {
    setSearchSymbol(sym);
    setStockSearch(sym);
    setSearchOpen(false);
  }

  function clearStockSearch() {
    setSearchSymbol("");
    setStockSearch("");
    setSearchResults([]);
  }

  const toggleExpand = (id: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl" style={{ backgroundColor: "rgba(var(--primary-rgb, 26,107,80), 0.1)" }}>
            <Newspaper className="h-6 w-6 text-[var(--primary)]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">ข่าวตลาด</h1>
            <p className="text-sm text-[var(--on-surface-variant)] flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              สรุปอัตโนมัติโดย AI เป็นภาษาไทย
            </p>
          </div>
        </div>
        <button
          onClick={() => searchSymbol ? fetchNews("", searchSymbol) : fetchNews(category)}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-[var(--surface-container-high)] hover:bg-[var(--surface-container-highest)] transition-colors"
        >
          <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
          รีเฟรช
        </button>
      </div>

      {/* Stock-specific search */}
      <div className="mb-4" ref={searchRef}>
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--on-surface-variant)]" />
          <input
            type="text"
            value={stockSearch}
            onChange={(e) => handleStockSearch(e.target.value)}
            onFocus={() => searchResults.length > 0 && setSearchOpen(true)}
            placeholder="ค้นหาข่าวหุ้นรายตัว เช่น AAPL, NVDA..."
            className="w-full pl-9 pr-9 py-2 rounded-lg bg-[var(--surface-container)] border border-[var(--border)] text-sm outline-none focus:border-[var(--primary)]"
          />
          {searchSymbol && (
            <button
              onClick={clearStockSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="h-3.5 w-3.5 text-[var(--on-surface-variant)]" />
            </button>
          )}
          {searchOpen && searchResults.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1 rounded-xl bg-[var(--card)] border border-[var(--border)] shadow-xl z-50 max-h-48 overflow-y-auto">
              {searchResults.map((r) => (
                <button
                  key={r.symbol}
                  onClick={() => selectStock(r.symbol)}
                  className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-[var(--surface-container-high)] transition-colors text-left"
                >
                  <span className="text-sm font-bold">{r.symbol}</span>
                  <span className="text-xs text-[var(--on-surface-variant)] truncate">{r.description}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        {searchSymbol && (
          <p className="text-xs text-[var(--primary)] font-medium mt-1.5">
            แสดงข่าวสำหรับ: <span className="font-bold">{searchSymbol}</span>
          </p>
        )}
      </div>

      {/* Category tabs (hidden when searching by symbol) */}
      {!searchSymbol && (
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setCategory(cat.key)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                category === cat.key
                  ? "bg-[var(--primary)] text-[var(--on-primary)]"
                  : "bg-[var(--surface-container-high)] text-[var(--on-surface-variant)] hover:bg-[var(--surface-container-highest)]"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4 mb-4">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Loading */}
      {loading && articles.length === 0 && (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-2xl bg-[var(--card)] p-5 animate-pulse">
              <div className="flex gap-4">
                <div className="w-24 h-24 rounded-xl bg-[var(--surface-container-high)] shrink-0" />
                <div className="flex-1">
                  <div className="h-4 w-20 bg-[var(--surface-container-high)] rounded mb-2" />
                  <div className="h-5 w-3/4 bg-[var(--surface-container-high)] rounded mb-2" />
                  <div className="h-3 w-full bg-[var(--surface-container-high)] rounded mb-1" />
                  <div className="h-3 w-2/3 bg-[var(--surface-container-high)] rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && articles.length === 0 && !error && (
        <div className="rounded-2xl bg-[var(--card)] p-12 text-center">
          <p className="text-[var(--on-surface-variant)]">ไม่พบข่าว</p>
        </div>
      )}

      {/* Articles list */}
      <div className="space-y-3">
        {articles.map((article) => {
          const isExpanded = expanded.has(article.id);
          const hasThai = article.summaryTh && article.summaryTh.length > 0;

          return (
            <div
              key={article.id}
              className="rounded-2xl bg-[var(--card)] hover:bg-[var(--surface-container)] transition-all overflow-hidden"
            >
              <div className="flex gap-4 p-4">
                {/* Thumbnail */}
                {article.image && (
                  <div className="w-24 h-24 md:w-32 md:h-24 rounded-xl overflow-hidden bg-[var(--surface-container-high)] shrink-0">
                    <img
                      src={article.image}
                      alt=""
                      className="w-full h-full object-cover"
                      onError={(e) => (e.currentTarget.parentElement!.style.display = "none")}
                    />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  {/* Meta row */}
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded bg-[var(--primary)]/15 text-[var(--primary)]">
                      {article.category === "merger" ? "ควบรวม" : article.category}
                    </span>
                    <span className="text-[11px] text-[var(--on-surface-variant)]">{article.source}</span>
                    <span className="text-[11px] text-[var(--on-surface-variant)] flex items-center gap-1">
                      <Clock className="h-2.5 w-2.5" />
                      {timeAgo(article.datetime)}
                    </span>
                    {/* Suggestion badge */}
                    {article.suggestion && <SuggestionBadge suggestion={article.suggestion} />}
                  </div>

                  {/* Headline */}
                  <h3 className="font-bold text-sm leading-snug mb-2 line-clamp-2">{article.headline}</h3>

                  {/* Thai AI summary */}
                  {hasThai && (
                    <div className="mb-2 p-2.5 rounded-lg bg-[var(--surface-container-high)] border-l-2 border-[var(--primary)]">
                      <div className="flex items-center gap-1 mb-1">
                        <Sparkles className="h-3 w-3 text-[var(--primary)]" />
                        <span className="text-[10px] font-bold text-[var(--primary)]">AI สรุป</span>
                      </div>
                      <p className="text-xs leading-relaxed">
                        {isExpanded ? article.summaryTh : article.summaryTh.slice(0, 150)}
                        {article.summaryTh.length > 150 && !isExpanded && "..."}
                      </p>
                      {article.summaryTh.length > 150 && (
                        <button
                          onClick={(e) => { e.preventDefault(); toggleExpand(article.id); }}
                          className="text-[10px] text-[var(--primary)] mt-1 hover:underline"
                        >
                          {isExpanded ? "ย่อ" : "อ่านต่อ"}
                        </button>
                      )}
                    </div>
                  )}

                  {/* Original summary fallback */}
                  {!hasThai && (
                    <p className="text-xs text-[var(--on-surface-variant)] line-clamp-2 mb-2">{article.summary}</p>
                  )}

                  {/* Related tickers + read link */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {article.related && article.related.split(",").slice(0, 4).map((ticker) => (
                        <span key={ticker} className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--surface-container-highest)] font-medium">
                          {ticker.trim()}
                        </span>
                      ))}
                    </div>
                    <a
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-[10px] text-[var(--primary)] hover:underline shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      อ่านฉบับเต็ม <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
