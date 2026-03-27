"use client";

import { useEffect, useState, useCallback } from "react";
import { Newspaper, ExternalLink, RefreshCw, Clock, Tag } from "lucide-react";

interface Article {
  id: number;
  headline: string;
  source: string;
  url: string;
  image: string | null;
  summary: string;
  category: string;
  datetime: number;
  related: string;
}

const CATEGORIES = [
  { key: "general", label: "General" },
  { key: "forex", label: "Forex" },
  { key: "crypto", label: "Crypto" },
  { key: "merger", label: "M&A" },
];

function timeAgo(unix: number): string {
  const diff = Math.floor(Date.now() / 1000 - unix);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(unix * 1000).toLocaleDateString();
}

export function NewsClient() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("general");
  const [error, setError] = useState("");

  const fetchNews = useCallback(async (cat: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/news?category=${cat}`);
      const json = await res.json();
      if (json.error) setError(json.error);
      setArticles(json.articles || []);
    } catch {
      setError("Failed to load news");
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchNews(category); }, [category, fetchNews]);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[var(--primary)]/10 rounded-xl">
            <Newspaper className="h-6 w-6 text-[var(--primary)]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Market News</h1>
            <p className="text-sm text-[var(--on-surface-variant)]">Live updates from Finnhub</p>
          </div>
        </div>
        <button
          onClick={() => fetchNews(category)}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-[var(--surface-container-high)] hover:bg-[var(--surface-container-highest)] transition-colors"
        >
          <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
          Refresh
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

      {/* Loading skeleton */}
      {loading && articles.length === 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-2xl bg-[var(--card)] p-5 animate-pulse">
              <div className="h-4 w-20 bg-[var(--surface-container-high)] rounded mb-3" />
              <div className="h-5 w-3/4 bg-[var(--surface-container-high)] rounded mb-2" />
              <div className="h-4 w-1/2 bg-[var(--surface-container-high)] rounded mb-4" />
              <div className="h-3 w-full bg-[var(--surface-container-high)] rounded mb-1" />
              <div className="h-3 w-2/3 bg-[var(--surface-container-high)] rounded" />
            </div>
          ))}
        </div>
      )}

      {/* Articles grid */}
      {!loading && articles.length === 0 && !error && (
        <div className="rounded-2xl bg-[var(--card)] p-12 text-center">
          <p className="text-[var(--on-surface-variant)]">No news articles found</p>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {articles.map((article) => (
          <a
            key={article.id}
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group rounded-2xl bg-[var(--card)] hover:bg-[var(--surface-container-high)] transition-all overflow-hidden flex flex-col"
          >
            {/* Image */}
            {article.image && (
              <div className="relative h-40 overflow-hidden bg-[var(--surface-container-high)]">
                <img
                  src={article.image}
                  alt=""
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => (e.currentTarget.style.display = "none")}
                />
              </div>
            )}

            <div className="p-5 flex-1 flex flex-col">
              {/* Meta */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded bg-[var(--primary)]/15 text-[var(--primary)]">
                    {article.category}
                  </span>
                  <span className="text-xs text-[var(--on-surface-variant)]">{article.source}</span>
                </div>
                <div className="flex items-center gap-1 text-[var(--on-surface-variant)]">
                  <Clock className="h-3 w-3" />
                  <span className="text-[10px]">{timeAgo(article.datetime)}</span>
                </div>
              </div>

              {/* Headline */}
              <h3 className="font-bold text-sm leading-snug mb-2 group-hover:text-[var(--primary)] transition-colors line-clamp-2">
                {article.headline}
              </h3>

              {/* Summary */}
              <p className="text-xs text-[var(--on-surface-variant)] line-clamp-3 flex-1">
                {article.summary}
              </p>

              {/* Related tickers */}
              {article.related && (
                <div className="flex items-center gap-1.5 mt-3 flex-wrap">
                  <Tag className="h-3 w-3 text-[var(--on-surface-variant)]" />
                  {article.related.split(",").slice(0, 5).map((ticker) => (
                    <span key={ticker} className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--surface-container-highest)] font-medium">
                      {ticker.trim()}
                    </span>
                  ))}
                </div>
              )}

              {/* Read more */}
              <div className="flex items-center gap-1 mt-3 text-[10px] text-[var(--primary)] opacity-0 group-hover:opacity-100 transition-opacity">
                <span>Read full article</span>
                <ExternalLink className="h-3 w-3" />
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
