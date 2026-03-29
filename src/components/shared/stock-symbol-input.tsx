"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Search } from "lucide-react";

interface StockResult {
  symbol: string;
  description: string;
}

interface StockSymbolInputProps {
  name: string;
  placeholder?: string;
  onSymbolSelect?: (symbol: string, price?: number) => void;
  required?: boolean;
}

export function StockSymbolInput({
  name,
  placeholder = "Search AAPL, TSLA, Nvidia...",
  onSymbolSelect,
  required = true,
}: StockSymbolInputProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<StockResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSymbol, setSelectedSymbol] = useState("");
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const searchStocks = useCallback(async (q: string) => {
    if (q.length < 1) { setResults([]); setIsOpen(false); return; }
    setIsLoading(true);
    try {
      const res = await fetch(`/api/stock/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      const list = Array.isArray(data) ? data : (data.results || []);
      setResults(list);
      setIsOpen(list.length > 0);
    } catch { setResults([]); }
    finally { setIsLoading(false); }
  }, []);

  function handleInputChange(value: string) {
    setQuery(value);
    setSelectedSymbol("");
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchStocks(value), 300);
  }

  async function handleSelect(item: StockResult) {
    setQuery(`${item.symbol} - ${item.description}`);
    setSelectedSymbol(item.symbol);
    setIsOpen(false);
    try {
      const res = await fetch(`/api/stock/quote?symbol=${item.symbol}`);
      const data = await res.json();
      if (data.currentPrice && onSymbolSelect) onSymbolSelect(item.symbol, data.currentPrice);
      else if (onSymbolSelect) onSymbolSelect(item.symbol);
    } catch { if (onSymbolSelect) onSymbolSelect(item.symbol); }
  }

  return (
    <div ref={wrapperRef} className="relative w-full">
      <input type="hidden" name={name} value={selectedSymbol} />
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--on-surface-variant)]" />
        <input
          placeholder={placeholder}
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          className="w-full rounded-xl bg-[var(--surface-container-high)] px-10 py-2.5 text-sm font-medium placeholder:text-[var(--on-surface-variant)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:bg-[var(--card)] transition-all"
          required={required}
          autoComplete="off"
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" />
          </div>
        )}
      </div>

      {isOpen && (
        <div className="absolute z-[100] mt-2 w-full rounded-xl bg-[var(--card)] shadow-[0_8px_32px_rgba(0,0,0,0.12)] max-h-56 overflow-auto border border-[var(--border)]">
          {results.map((item) => (
            <button
              key={item.symbol}
              type="button"
              className="flex w-full items-center justify-between px-4 py-3 text-sm hover:bg-[var(--surface-container-low)] transition-colors first:rounded-t-xl last:rounded-b-xl"
              onClick={() => handleSelect(item)}
            >
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-[var(--primary-container)] flex items-center justify-center text-[10px] font-bold text-[var(--primary)]">
                  {item.symbol.slice(0, 2)}
                </div>
                <span className="font-bold text-[var(--primary)]">{item.symbol}</span>
              </div>
              <span className="text-xs text-[var(--on-surface-variant)] truncate ml-3 max-w-[180px]">
                {item.description}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
