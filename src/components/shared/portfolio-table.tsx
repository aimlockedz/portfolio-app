"use client";

import { useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface Holding {
  id: string;
  symbol: string;
  totalQuantity: number;
  averageCost: number; // in cents
}

interface QuoteData {
  currentPrice: number;
  change: number;
  changePercent: number;
}

export function PortfolioTable({ holdings }: { holdings: Holding[] }) {
  const [quotes, setQuotes] = useState<Record<string, QuoteData>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchQuotes() {
      if (holdings.length === 0) {
        setLoading(false);
        return;
      }

      const quoteMap: Record<string, QuoteData> = {};
      // Fetch all quotes in parallel
      await Promise.all(
        holdings.map(async (h) => {
          try {
            const res = await fetch(`/api/stock/quote?symbol=${h.symbol}`);
            const data = await res.json();
            if (data.currentPrice) {
              quoteMap[h.symbol] = {
                currentPrice: data.currentPrice,
                change: data.change,
                changePercent: data.changePercent,
              };
            }
          } catch {
            // Skip failed quotes
          }
        })
      );
      setQuotes(quoteMap);
      setLoading(false);
    }

    fetchQuotes();
  }, [holdings]);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Symbol</TableHead>
          <TableHead className="text-right">Qty</TableHead>
          <TableHead className="text-right">Avg Cost</TableHead>
          <TableHead className="text-right">Market Price</TableHead>
          <TableHead className="text-right">Total Cost</TableHead>
          <TableHead className="text-right">Market Value</TableHead>
          <TableHead className="text-right">P&L</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {holdings.length === 0 ? (
          <TableRow>
            <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
              No holdings yet. Add a transaction to get started.
            </TableCell>
          </TableRow>
        ) : (
          holdings.map((holding) => {
            const quote = quotes[holding.symbol];
            const avgCost = holding.averageCost / 100;
            const totalCost = (holding.totalQuantity * holding.averageCost) / 100;
            const marketPrice = quote?.currentPrice ?? null;
            const marketValue = marketPrice ? holding.totalQuantity * marketPrice : null;
            const pnl = marketValue !== null ? marketValue - totalCost : null;
            const pnlPercent = totalCost > 0 && pnl !== null ? (pnl / totalCost) * 100 : null;

            return (
              <TableRow key={holding.id}>
                <TableCell>
                  <div>
                    <span className="font-bold">{holding.symbol}</span>
                    {quote && (
                      <div className="flex items-center gap-1 mt-0.5">
                        {quote.change > 0 ? (
                          <TrendingUp className="h-3 w-3 text-green-500" />
                        ) : quote.change < 0 ? (
                          <TrendingDown className="h-3 w-3 text-red-500" />
                        ) : (
                          <Minus className="h-3 w-3 text-muted-foreground" />
                        )}
                        <span className={`text-xs ${
                          quote.change > 0 ? "text-green-500" : quote.change < 0 ? "text-red-500" : "text-muted-foreground"
                        }`}>
                          {quote.change > 0 ? "+" : ""}{quote.changePercent?.toFixed(2)}%
                        </span>
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">{holding.totalQuantity}</TableCell>
                <TableCell className="text-right">${avgCost.toFixed(2)}</TableCell>
                <TableCell className="text-right">
                  {loading ? (
                    <div className="h-4 w-16 animate-pulse bg-muted rounded ml-auto" />
                  ) : marketPrice ? (
                    <span className="font-medium">${marketPrice.toFixed(2)}</span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="text-right">${totalCost.toFixed(2)}</TableCell>
                <TableCell className="text-right">
                  {loading ? (
                    <div className="h-4 w-16 animate-pulse bg-muted rounded ml-auto" />
                  ) : marketValue ? (
                    <span className="font-medium">${marketValue.toFixed(2)}</span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {loading ? (
                    <div className="h-4 w-20 animate-pulse bg-muted rounded ml-auto" />
                  ) : pnl !== null ? (
                    <Badge variant={pnl >= 0 ? "default" : "destructive"} className="font-mono">
                      {pnl >= 0 ? "+" : ""}{pnl.toFixed(2)} ({pnlPercent?.toFixed(1)}%)
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
  );
}
