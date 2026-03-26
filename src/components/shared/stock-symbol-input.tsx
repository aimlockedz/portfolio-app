"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Input } from "@/components/ui/input";
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
  placeholder = "Search AAPL, TSLA...",
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

  // Close dropdown when clicking outside
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
    if (q.length < 1) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`/api/stock/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setResults(data);
        setIsOpen(data.length > 0);
      }
    } catch {
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  function handleInputChange(value: string) {
    const upper = value.toUpperCase();
    setQuery(upper);
    setSelectedSymbol("");

    // Debounce search
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      searchStocks(upper);
    }, 300);
  }

  async function handleSelect(item: StockResult) {
    setQuery(`${item.symbol} — ${item.description}`);
    setSelectedSymbol(item.symbol);
    setIsOpen(false);

    // Fetch current price
    try {
      const res = await fetch(`/api/stock/quote?symbol=${item.symbol}`);
      const data = await res.json();
      if (data.currentPrice && onSymbolSelect) {
        onSymbolSelect(item.symbol, data.currentPrice);
      } else if (onSymbolSelect) {
        onSymbolSelect(item.symbol);
      }
    } catch {
      if (onSymbolSelect) onSymbolSelect(item.symbol);
    }
  }

  return (
    <div ref={wrapperRef} className="relative col-span-3">
      {/* Hidden input for form submission */}
      <input type="hidden" name={name} value={selectedSymbol} />

      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={placeholder}
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          className="pl-8"
          required={required}
          autoComplete="off"
        />
        {isLoading && (
          <div className="absolute right-2.5 top-2.5">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        )}
      </div>

      {/* Dropdown results */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg max-h-60 overflow-auto">
          {results.map((item) => (
            <button
              key={item.symbol}
              type="button"
              className="flex w-full items-center justify-between px-3 py-2.5 text-sm hover:bg-accent hover:text-accent-foreground transition-colors border-b last:border-0"
              onClick={() => handleSelect(item)}
            >
              <span className="font-bold text-primary">{item.symbol}</span>
              <span className="text-xs text-muted-foreground truncate ml-2 max-w-[200px]">
                {item.description}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
