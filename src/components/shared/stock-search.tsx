"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";

interface SearchResult {
  symbol: string;
  description: string;
  type: string;
}

export function StockSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSearch(value: string) {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.length < 1) {
      setResults([]);
      setOpen(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/stock/search?q=${encodeURIComponent(value)}`);
        const data = await res.json();
        setResults(data.results || []);
        setOpen(true);
      } catch {
        setResults([]);
      }
      setLoading(false);
    }, 300);
  }

  function selectStock(symbol: string) {
    setQuery("");
    setResults([]);
    setOpen(false);
    router.push(`/stock/${symbol}`);
  }

  return (
    <div ref={wrapperRef} className="relative px-3 mb-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--on-surface-variant)]" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Search stocks..."
          className="w-full pl-9 pr-8 py-2 rounded-full text-sm bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--on-surface-variant)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 transition-all"
        />
        {query && (
          <button
            onClick={() => { setQuery(""); setResults([]); setOpen(false); }}
            className="absolute right-3 top-1/2 -translate-y-1/2"
          >
            <X className="h-3.5 w-3.5 text-[var(--on-surface-variant)]" />
          </button>
        )}
      </div>

      {open && (
        <div className="absolute left-3 right-3 top-full mt-1 rounded-xl bg-[var(--card)] border border-[var(--border)] shadow-xl z-50 max-h-72 overflow-y-auto">
          {loading ? (
            <div className="px-4 py-3 text-sm text-[var(--on-surface-variant)]">Searching...</div>
          ) : results.length > 0 ? (
            results.map((r) => (
              <button
                key={r.symbol}
                onClick={() => selectStock(r.symbol)}
                className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-[var(--surface-container-high)] transition-colors text-left"
              >
                <div>
                  <span className="text-sm font-bold">{r.symbol}</span>
                  <span className="text-xs text-[var(--on-surface-variant)] ml-2 truncate">
                    {r.description}
                  </span>
                </div>
                <span className="text-[10px] text-[var(--on-surface-variant)] uppercase">{r.type}</span>
              </button>
            ))
          ) : (
            <div className="px-4 py-3 text-sm text-[var(--on-surface-variant)]">No results found</div>
          )}
        </div>
      )}
    </div>
  );
}
