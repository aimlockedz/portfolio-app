"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { StockSymbolInput } from "./stock-symbol-input";
import { useToast } from "@/components/ui/toast-provider";

export function AddWatchlistDialog() {
  const [open, setOpen] = useState(false);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [selectedSymbol, setSelectedSymbol] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const toast = useToast();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    // Validate symbol was selected from dropdown
    if (!selectedSymbol) {
      setError("Please select a stock from the search dropdown");
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData(event.currentTarget);
      // Ensure the correct symbol is set
      formData.set("symbol", selectedSymbol);

      const response = await fetch("/api/watchlist", { method: "POST", body: formData });
      if (response.ok) {
        setOpen(false);
        setCurrentPrice(null);
        setSelectedSymbol("");
        setError("");
        toast.success(
          `${selectedSymbol} added to Watchlist!`,
          `Now tracking ${selectedSymbol} — check back for AI analysis.`
        );
        router.refresh();
      } else {
        const json = await response.json().catch(() => null);
        if (response.status === 409) {
          setError(`${selectedSymbol} is already in your watchlist`);
        } else {
          setError(json?.error || "Failed to add");
        }
      }
    } catch {
      setError("Network error — please try again");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setCurrentPrice(null); setSelectedSymbol(""); setError(""); } }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="rounded-full border-[var(--primary)] text-[var(--primary)] hover:bg-[var(--primary-container)] px-5">
          <Plus className="mr-2 h-4 w-4" /> Add to Watchlist
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px] rounded-2xl border-none bg-[var(--card)] shadow-[0_16px_64px_rgba(0,0,0,0.15)] p-0 overflow-visible">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="px-6 pt-6 pb-2">
            <DialogTitle className="font-[var(--font-headline)] text-xl font-bold">
              Add to Watchlist
            </DialogTitle>
            <DialogDescription className="text-[var(--on-surface-variant)] text-sm">
              Search for a stock to monitor its performance.
            </DialogDescription>
          </DialogHeader>

          <div className="px-6 py-4 space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[var(--on-surface-variant)] uppercase tracking-wider">
                Symbol
              </label>
              <StockSymbolInput
                name="symbol"
                placeholder="Search TSLA, AAPL..."
                onSymbolSelect={(sym, price) => {
                  setSelectedSymbol(sym);
                  setError("");
                  if (price) setCurrentPrice(price);
                }}
              />
              {selectedSymbol && (
                <p className="text-xs text-emerald-400 font-medium">
                  Selected: {selectedSymbol}
                </p>
              )}
            </div>

            {currentPrice !== null && (
              <div className="rounded-xl bg-[var(--primary-container)] px-4 py-3 flex items-center justify-between">
                <span className="text-xs font-medium text-[var(--primary)]">Current Price</span>
                <span className="font-[var(--font-headline)] font-bold text-lg text-[var(--primary)]">
                  ${currentPrice.toFixed(2)}
                </span>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-semibold text-[var(--on-surface-variant)] uppercase tracking-wider">
                Conviction Level
              </label>
              <Select name="convictionLevel" defaultValue="3">
                <SelectTrigger className="rounded-xl bg-[var(--surface-container-high)] border-none h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 - Low</SelectItem>
                  <SelectItem value="2">2 - Moderate</SelectItem>
                  <SelectItem value="3">3 - High</SelectItem>
                  <SelectItem value="4">4 - Very High</SelectItem>
                  <SelectItem value="5">5 - Extreme</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-[var(--on-surface-variant)] uppercase tracking-wider">
                Notes
              </label>
              <input
                name="notes"
                placeholder="Growth potential..."
                className="w-full rounded-xl bg-[var(--surface-container-high)] px-4 py-2.5 text-sm font-medium placeholder:text-[var(--on-surface-variant)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:bg-[var(--card)] h-10"
              />
            </div>
          </div>

          {error && (
            <div className="mx-6 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-2.5">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <DialogFooter className="px-6 pb-6 pt-2">
            <Button
              type="submit"
              disabled={submitting || !selectedSymbol}
              className="w-full rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 h-11 font-bold disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add to Watchlist"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
