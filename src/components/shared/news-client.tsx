"use client";

import { useEffect, useState, useCallback } from "react";
import { Newspaper, ExternalLink, RefreshCw, Clock, Tag, Sparkles } from "lucide-react";

interface Article {
  id: number;
  headline: string;
  source: string;
  url: string;
  image: string | null;
  summary: string;
  summaryTh: string;
  category: string;
  datetime: number;
  related: string;
}

const CATEGORIES = [
  { key: "general", label: "ทั่วไป" },
  { key: "forex", label: "Forex" },
  { key: "crypto", label: "Crypto" },
  { key: "merger", label: "M&A" },
];

function timeAgo(unix: number): string {
  const diff = Math.floor(Date.now() / 1000 - unix);
  if (diff < 60) return "เมื่อกี้";
  if (diff < 3600) return `${Math.floor(diff / 60)} นาทีที่แล้ว`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ชม.ที่แล้ว`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} วันที่แล้ว`;
  return new Date(unix * 1000).toLocaleDateString("th-TH");
}

export function NewsClient() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("general");
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const fetchNews = useCallback(async (cat: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/news?category=${cat}`);
      const json = await res.json();
      if (json.error) setError(json.error);
      setArticles(json.articles || []);
    } catch {
      setError("ไม่สามารถโหลดข่าวได้");
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchNews(category); }, [category, fetchNews]);

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
          onClick={() => fetchNews(category)}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-[var(--surface-container-high)] hover:bg-[var(--surface-container-highest)] transition-colors"
        >
          <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
          รีเฟรช
        </button>
      </div>

      {/* Category tabs */}
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
          const hasThai = article.summaryTh && article.summaryTh !== article.summary;

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
                      {article.category}
                    </span>
                    <span className="text-[11px] text-[var(--on-surface-variant)]">{article.source}</span>
                    <span className="text-[11px] text-[var(--on-surface-variant)] flex items-center gap-1">
                      <Clock className="h-2.5 w-2.5" />
                      {timeAgo(article.datetime)}
                    </span>
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
