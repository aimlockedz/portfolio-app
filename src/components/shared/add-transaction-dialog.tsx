"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { StockSymbolInput } from "./stock-symbol-input";

export function AddTransactionDialog() {
  const [open, setOpen] = useState(false);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [selectedSymbol, setSelectedSymbol] = useState("");
  const router = useRouter();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const response = await fetch("/api/portfolio/transactions", {
      method: "POST",
      body: formData,
    });
    if (response.ok) {
      setOpen(false);
      setCurrentPrice(null);
      setSelectedSymbol("");
      router.refresh();
    }
  }

  function handleSymbolSelect(symbol: string, price?: number) {
    setSelectedSymbol(symbol);
    if (price) setCurrentPrice(price);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setCurrentPrice(null); setSelectedSymbol(""); } }}>
      <DialogTrigger asChild>
        <Button className="rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 px-5">
          <Plus className="mr-2 h-4 w-4" /> Add Transaction
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px] rounded-2xl border-none bg-[var(--card)] shadow-[0_16px_64px_rgba(0,0,0,0.15)] p-0 overflow-visible">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="px-6 pt-6 pb-2">
            <DialogTitle className="font-[var(--font-headline)] text-xl font-bold">
              Add Transaction
            </DialogTitle>
            <DialogDescription className="text-[var(--on-surface-variant)] text-sm">
              Search for a stock and enter your transaction details.
            </DialogDescription>
          </DialogHeader>

          <div className="px-6 py-4 space-y-4">
            {/* Symbol Search */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[var(--on-surface-variant)] uppercase tracking-wider">
                Symbol
              </label>
              <StockSymbolInput name="symbol" onSymbolSelect={handleSymbolSelect} />
            </div>

            {/* Market Price Badge */}
            {currentPrice !== null && (
              <div className="rounded-xl bg-[var(--primary-container)] px-4 py-3 flex items-center justify-between">
                <span className="text-xs font-medium text-[var(--primary)]">Market Price</span>
                <span className="font-[var(--font-headline)] font-bold text-lg text-[var(--primary)]">
                  ${currentPrice.toFixed(2)}
                </span>
              </div>
            )}

            {/* Type + Quantity Row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[var(--on-surface-variant)] uppercase tracking-wider">
                  Type
                </label>
                <Select name="type" defaultValue="BUY">
                  <SelectTrigger className="rounded-xl bg-[var(--surface-container-high)] border-none h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BUY">Buy</SelectItem>
                    <SelectItem value="SELL">Sell</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[var(--on-surface-variant)] uppercase tracking-wider">
                  Quantity
                </label>
                <input
                  name="quantity"
                  type="number"
                  step="any"
                  required
                  className="w-full rounded-xl bg-[var(--surface-container-high)] px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:bg-[var(--card)] h-10"
                  placeholder="0"
                />
              </div>
            </div>

            {/* Price + Date Row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[var(--on-surface-variant)] uppercase tracking-wider">
                  Price
                </label>
                <input
                  name="price"
                  type="number"
                  step="0.01"
                  required
                  defaultValue={currentPrice?.toFixed(2) ?? ""}
                  key={currentPrice}
                  className="w-full rounded-xl bg-[var(--surface-container-high)] px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:bg-[var(--card)] h-10"
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[var(--on-surface-variant)] uppercase tracking-wider">
                  Date
                </label>
                <input
                  name="date"
                  type="date"
                  required
                  defaultValue={new Date().toISOString().split("T")[0]}
                  className="w-full rounded-xl bg-[var(--surface-container-high)] px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:bg-[var(--card)] h-10"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="px-6 pb-6 pt-2">
            <Button
              type="submit"
              className="w-full rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 h-11 font-bold"
            >
              Save Transaction
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
