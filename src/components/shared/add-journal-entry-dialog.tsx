"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search } from "lucide-react";
import { useRouter } from "next/navigation";

interface SearchResult {
  symbol: string;
  description: string;
  type: string;
}

export function AddJournalEntryDialog() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  // Symbol autocomplete
  const [symbolQuery, setSymbolQuery] = useState("");
  const [symbolValue, setSymbolValue] = useState("");
  const [symbolName, setSymbolName] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSymbolSearch(value: string) {
    setSymbolQuery(value);
    setSymbolValue(value);
    setSymbolName("");
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.length < 1) {
      setSearchResults([]);
      setSearchOpen(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await fetch(`/api/stock/search?q=${encodeURIComponent(value)}`);
        const data = await res.json();
        setSearchResults(data.results || []);
        setSearchOpen(true);
      } catch {
        setSearchResults([]);
      }
      setSearchLoading(false);
    }, 300);
  }

  function selectSymbol(sym: string, name: string) {
    setSymbolValue(sym);
    setSymbolName(name);
    setSymbolQuery(sym);
    setSearchResults([]);
    setSearchOpen(false);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    // Override symbol with the validated value
    formData.set("symbol", symbolValue);

    const response = await fetch("/api/journal", {
      method: "POST",
      body: formData,
    });

    if (response.ok) {
      setOpen(false);
      setSymbolQuery("");
      setSymbolValue("");
      setSymbolName("");
      router.refresh();
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setSymbolQuery(""); setSymbolValue(""); setSymbolName(""); } }}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> New Journal Entry
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>New Investment Thesis</DialogTitle>
            <DialogDescription>
              Document your research and reasons for this investment.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Symbol with autocomplete */}
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="symbol" className="text-right pt-2">Symbol</Label>
              <div className="col-span-3 relative" ref={searchRef}>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    id="symbol"
                    value={symbolQuery}
                    onChange={(e) => handleSymbolSearch(e.target.value)}
                    onFocus={() => searchResults.length > 0 && setSearchOpen(true)}
                    placeholder="Search AAPL, NVDA..."
                    className="pl-9"
                    required
                  />
                </div>
                {symbolName && (
                  <p className="text-[10px] text-primary font-medium mt-1">{symbolName}</p>
                )}
                {/* Hidden input to submit the actual symbol value */}
                <input type="hidden" name="symbol" value={symbolValue} />

                {searchOpen && (
                  <div className="absolute left-0 right-0 top-full mt-1 rounded-xl bg-popover border shadow-xl z-50 max-h-52 overflow-y-auto">
                    {searchLoading ? (
                      <div className="px-4 py-3 text-sm text-muted-foreground">Searching...</div>
                    ) : searchResults.length > 0 ? (
                      searchResults.map((r) => (
                        <button
                          key={r.symbol}
                          type="button"
                          onClick={() => selectSymbol(r.symbol, r.description)}
                          className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-accent transition-colors text-left"
                        >
                          <div>
                            <span className="text-sm font-bold">{r.symbol}</span>
                            <span className="text-xs text-muted-foreground ml-2 truncate">{r.description}</span>
                          </div>
                          <span className="text-[10px] text-muted-foreground uppercase">{r.type}</span>
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-sm text-muted-foreground">No results</div>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="thesis">Investment Thesis</Label>
              <Textarea id="thesis" name="thesis" placeholder="Why are you buying?" rows={3} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="risks">Risks & Concerns</Label>
              <Textarea id="risks" name="risks" placeholder="What could go wrong?" rows={2} />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="expectedUpside" className="text-right">Upside</Label>
              <Input id="expectedUpside" name="expectedUpside" placeholder="+20%" className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="reviewDate" className="text-right">Review Date</Label>
              <Input id="reviewDate" name="reviewDate" type="date" className="col-span-3" />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">Save Entry</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
