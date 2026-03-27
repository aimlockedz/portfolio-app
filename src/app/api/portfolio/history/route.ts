import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getDb } from "@/db/db";
import { initializeLucia } from "@/lib/auth";
import { PortfolioRepository } from "@/db/repositories/portfolio";

export const dynamic = "force-dynamic";

/* eslint-disable @typescript-eslint/no-explicit-any */

// Use direct Yahoo Finance HTTP API (same as candles route — proven reliable)
async function fetchDailyPrices(symbol: string, from: string, to: string): Promise<Record<string, number>> {
  const prices: Record<string, number> = {};
  try {
    // Convert date strings to unix timestamps
    const fromTs = Math.floor(new Date(from).getTime() / 1000);
    const toTs = Math.floor(new Date(to).getTime() / 1000) + 86400; // +1 day to include today
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?period1=${fromTs}&period2=${toTs}&interval=1d`;
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      cache: "no-store",
    });
    const data = await res.json();
    const result = data?.chart?.result?.[0];
    if (!result) return prices;

    const timestamps = result.timestamp || [];
    const closes = result.indicators?.quote?.[0]?.close || [];

    for (let i = 0; i < timestamps.length; i++) {
      if (closes[i] != null && closes[i] > 0) {
        const dateStr = new Date(timestamps[i] * 1000).toISOString().split("T")[0];
        prices[dateStr] = closes[i];
      }
    }
  } catch { /* skip */ }
  return prices;
}

export async function GET(request: NextRequest) {
  const db = getDb();
  const lucia = initializeLucia(db);

  const cookieStore = await cookies();
  const sessionId = cookieStore.get(lucia.sessionCookieName)?.value ?? null;
  if (!sessionId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { user } = await lucia.validateSession(sessionId);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const period = request.nextUrl.searchParams.get("period") || "all";

  try {
    const portfolioRepo = new PortfolioRepository(db);
    const transactions = await portfolioRepo.getTransactions(user.id);

    if (transactions.length === 0) {
      return NextResponse.json({ dataPoints: [] });
    }

    // Sort transactions by date ascending
    const sortedTx = [...transactions].sort((a, b) => a.date.getTime() - b.date.getTime());

    // Earliest transaction = start of investment history
    const earliestDate = sortedTx[0].date;
    const now = new Date();

    // Determine chart start date based on period
    let chartStart = new Date(earliestDate);
    switch (period) {
      case "1m": {
        const d = new Date(now);
        d.setMonth(d.getMonth() - 1);
        if (d > earliestDate) chartStart = d;
        break;
      }
      case "3m": {
        const d = new Date(now);
        d.setMonth(d.getMonth() - 3);
        if (d > earliestDate) chartStart = d;
        break;
      }
      case "6m": {
        const d = new Date(now);
        d.setMonth(d.getMonth() - 6);
        if (d > earliestDate) chartStart = d;
        break;
      }
      case "1y": {
        const d = new Date(now);
        d.setFullYear(d.getFullYear() - 1);
        if (d > earliestDate) chartStart = d;
        break;
      }
      // "all" uses earliestDate (already set)
    }

    const allSymbols = [...new Set(sortedTx.map((t) => t.symbol))];
    const fromStr = earliestDate.toISOString().split("T")[0];
    const toStr = now.toISOString().split("T")[0];

    // Fetch historical prices using direct Yahoo HTTP API
    const priceHistory: Record<string, Record<string, number>> = {};
    await Promise.all(
      allSymbols.map(async (symbol) => {
        priceHistory[symbol] = await fetchDailyPrices(symbol, fromStr, toStr);
      })
    );

    // Get all trading dates from price data
    const allDates = new Set<string>();
    Object.values(priceHistory).forEach((prices) => {
      Object.keys(prices).forEach((d) => allDates.add(d));
    });
    const sortedDates = [...allDates].sort();

    // For each date, reconstruct what we held at that point
    const chartStartStr = chartStart.toISOString().split("T")[0];
    let txIdx = 0;
    const currentHoldings: Record<string, number> = {}; // symbol -> qty
    const currentCost: Record<string, number> = {}; // symbol -> total cost in dollars

    const dataPoints: { date: string; value: number; cost: number }[] = [];

    for (const date of sortedDates) {
      // Apply all transactions up to and including this date
      while (txIdx < sortedTx.length) {
        const tx = sortedTx[txIdx];
        const txDate = tx.date.toISOString().split("T")[0];
        if (txDate > date) break;

        const sym = tx.symbol;
        const qty = tx.quantity;
        const price = tx.price / 100; // cents to dollars

        if (tx.type === "BUY") {
          currentHoldings[sym] = (currentHoldings[sym] || 0) + qty;
          currentCost[sym] = (currentCost[sym] || 0) + qty * price;
        } else {
          // SELL
          const prevQty = currentHoldings[sym] || 0;
          const prevCost = currentCost[sym] || 0;
          const avgCostPerShare = prevQty > 0 ? prevCost / prevQty : 0;
          currentHoldings[sym] = Math.max(0, prevQty - qty);
          currentCost[sym] = Math.max(0, prevCost - qty * avgCostPerShare);
        }
        txIdx++;
      }

      // Skip dates before chart start
      if (date < chartStartStr) continue;

      // Skip dates before any transaction happened (no holdings yet)
      const totalQty = Object.values(currentHoldings).reduce((a, b) => a + b, 0);
      if (totalQty === 0 && dataPoints.length === 0) continue;

      // Calculate portfolio value for this date
      let portfolioValue = 0;
      let totalCostBasis = 0;

      for (const [sym, qty] of Object.entries(currentHoldings)) {
        if (qty <= 0) continue;
        const price = priceHistory[sym]?.[date];
        if (price) {
          portfolioValue += qty * price;
        }
        totalCostBasis += currentCost[sym] || 0;
      }

      if (portfolioValue > 0 || totalCostBasis > 0) {
        dataPoints.push({
          date,
          value: parseFloat(portfolioValue.toFixed(2)),
          cost: parseFloat(totalCostBasis.toFixed(2)),
        });
      }
    }

    return NextResponse.json({ dataPoints });
  } catch (err) {
    return NextResponse.json({ error: "Failed to build portfolio history", debug: String(err) }, { status: 500 });
  }
}
