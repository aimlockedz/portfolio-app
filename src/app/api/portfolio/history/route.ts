import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getDb } from "@/db/db";
import { initializeLucia } from "@/lib/auth";
import { PortfolioRepository } from "@/db/repositories/portfolio";

export const dynamic = "force-dynamic";

/* eslint-disable @typescript-eslint/no-explicit-any */

// Period → how many calendar days back from today
const PERIOD_DAYS: Record<string, number> = {
  "1d": 1,
  "7d": 7,
  "30d": 30,
  "3m": 90,
  "6m": 180,
  "1y": 365,
  "3y": 365 * 3,
  "5y": 365 * 5,
  "all": 365 * 30, // effectively unlimited
};

// Fetch daily close prices for a symbol within a date range
async function fetchDailyCloses(
  symbol: string,
  fromDate: Date,
  toDate: Date
): Promise<{ date: string; close: number }[]> {
  try {
    const period1 = Math.floor(fromDate.getTime() / 1000);
    const period2 = Math.floor(toDate.getTime() / 1000) + 86400; // +1 day buffer
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
      symbol
    )}?period1=${period1}&period2=${period2}&interval=1d`;

    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      cache: "no-store",
    });
    const data = await res.json();
    const result = data?.chart?.result?.[0];
    if (!result) return [];

    const timestamps: number[] = result.timestamp || [];
    const closes: (number | null)[] =
      result.indicators?.quote?.[0]?.close || [];
    const points: { date: string; close: number }[] = [];

    for (let i = 0; i < timestamps.length; i++) {
      if (closes[i] != null && closes[i]! > 0) {
        const dateStr = new Date(timestamps[i] * 1000)
          .toISOString()
          .split("T")[0];
        points.push({ date: dateStr, close: closes[i]! });
      }
    }
    return points;
  } catch {
    return [];
  }
}

// Generate all dates (YYYY-MM-DD) between start and end inclusive
function generateDateRange(start: Date, end: Date): string[] {
  const dates: string[] = [];
  const cur = new Date(start);
  cur.setHours(0, 0, 0, 0);
  const endTime = new Date(end);
  endTime.setHours(0, 0, 0, 0);

  while (cur <= endTime) {
    dates.push(cur.toISOString().split("T")[0]);
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

export async function GET(request: NextRequest) {
  const db = getDb();
  const lucia = initializeLucia(db);

  const cookieStore = await cookies();
  const sessionId = cookieStore.get(lucia.sessionCookieName)?.value ?? null;
  if (!sessionId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { user } = await lucia.validateSession(sessionId);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const period = request.nextUrl.searchParams.get("period") || "all";
  const daysBack = PERIOD_DAYS[period] ?? 365 * 30;

  try {
    const portfolioRepo = new PortfolioRepository(db);

    // 1) Get ALL transactions for this user, sorted by date ascending
    const allTxs = await portfolioRepo.getTransactions(user.id);

    if (allTxs.length === 0) {
      return NextResponse.json({ dataPoints: [] });
    }

    // 2) Build daily holdings snapshot from transactions
    //    holdings[symbol] = { qty, totalCostBasis (in dollars) }
    interface HoldingState {
      qty: number;
      avgCost: number; // in dollars per share
      totalCost: number; // qty * avgCost in dollars
    }

    // Sort transactions by date
    const sortedTxs = [...allTxs].sort(
      (a, b) =>
        new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const firstTxDate = new Date(sortedTxs[0].date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Determine the chart start date based on period
    const periodStart = new Date(today);
    periodStart.setDate(periodStart.getDate() - daysBack);

    // Actual start = later of (firstTxDate, periodStart)
    const chartStart =
      firstTxDate > periodStart ? firstTxDate : periodStart;

    // Build transaction events by date string
    const txByDate: Record<
      string,
      { symbol: string; type: string; qty: number; price: number }[]
    > = {};
    for (const tx of sortedTxs) {
      const d = new Date(tx.date).toISOString().split("T")[0];
      if (!txByDate[d]) txByDate[d] = [];
      txByDate[d].push({
        symbol: tx.symbol,
        type: tx.type,
        qty: tx.quantity,
        price: tx.price / 100, // cents → dollars
      });
    }

    // 3) Replay transactions day by day to build the holdings state at each date
    const allDates = generateDateRange(firstTxDate, today);
    const holdingsState: Record<string, HoldingState> = {};
    const dailyHoldings: Record<
      string,
      { symbol: string; qty: number; avgCost: number }[]
    > = {};

    for (const date of allDates) {
      // Apply any transactions on this date
      const dayTxs = txByDate[date] || [];
      for (const tx of dayTxs) {
        if (!holdingsState[tx.symbol]) {
          holdingsState[tx.symbol] = { qty: 0, avgCost: 0, totalCost: 0 };
        }
        const h = holdingsState[tx.symbol];

        if (tx.type === "BUY") {
          const newTotalCost = h.totalCost + tx.qty * tx.price;
          const newQty = h.qty + tx.qty;
          h.avgCost = newQty > 0 ? newTotalCost / newQty : 0;
          h.qty = newQty;
          h.totalCost = newTotalCost;
        } else {
          // SELL
          h.qty = Math.max(0, h.qty - tx.qty);
          h.totalCost = h.qty * h.avgCost;
        }

        // Remove if fully sold
        if (h.qty <= 0) {
          delete holdingsState[tx.symbol];
        }
      }

      // Snapshot current holdings for this date
      const snapshot = Object.entries(holdingsState)
        .filter(([, v]) => v.qty > 0)
        .map(([symbol, v]) => ({
          symbol,
          qty: v.qty,
          avgCost: v.avgCost,
        }));

      dailyHoldings[date] = snapshot;
    }

    // 4) Collect all unique symbols that were ever held
    const allSymbols = new Set<string>();
    for (const snapshot of Object.values(dailyHoldings)) {
      for (const h of snapshot) {
        allSymbols.add(h.symbol);
      }
    }

    if (allSymbols.size === 0) {
      return NextResponse.json({ dataPoints: [] });
    }

    // 5) Fetch daily prices for all symbols from chartStart to today
    const priceFetchStart = new Date(chartStart);
    priceFetchStart.setDate(priceFetchStart.getDate() - 5); // buffer for weekends

    const priceResults = await Promise.all(
      [...allSymbols].map(async (symbol) => ({
        symbol,
        prices: await fetchDailyCloses(symbol, priceFetchStart, today),
      }))
    );

    // Build price lookup: symbol → date → close
    const priceLookup: Record<string, Record<string, number>> = {};
    for (const { symbol, prices } of priceResults) {
      priceLookup[symbol] = {};
      for (const { date, close } of prices) {
        priceLookup[symbol][date] = close;
      }
    }

    // 6) Compute daily portfolio value from chartStart to today
    const chartDates = allDates.filter((d) => d >= chartStart.toISOString().split("T")[0]);

    // Track last known price per symbol to fill gaps (weekends/holidays)
    const lastKnownPrice: Record<string, number> = {};

    // Pre-fill lastKnownPrice with data before chartStart
    for (const { symbol, prices } of priceResults) {
      const chartStartStr = chartStart.toISOString().split("T")[0];
      for (const { date, close } of prices) {
        if (date < chartStartStr) {
          lastKnownPrice[symbol] = close;
        }
      }
    }

    const dataPoints: { date: string; value: number; cost: number }[] = [];

    for (const date of chartDates) {
      const snapshot = dailyHoldings[date];
      if (!snapshot || snapshot.length === 0) continue;

      // Update lastKnownPrice for this date
      for (const symbol of allSymbols) {
        if (priceLookup[symbol]?.[date]) {
          lastKnownPrice[symbol] = priceLookup[symbol][date];
        }
      }

      let portfolioValue = 0;
      let totalCost = 0;
      let allHavePrice = true;

      for (const h of snapshot) {
        const price = lastKnownPrice[h.symbol];
        if (price) {
          portfolioValue += h.qty * price;
        } else {
          allHavePrice = false;
        }
        totalCost += h.qty * h.avgCost;
      }

      // Only include days where we have prices for all held symbols
      if (allHavePrice && portfolioValue > 0) {
        dataPoints.push({
          date,
          value: parseFloat(portfolioValue.toFixed(2)),
          cost: parseFloat(totalCost.toFixed(2)),
        });
      }
    }

    return NextResponse.json({ dataPoints });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to build portfolio history", debug: String(err) },
      { status: 500 }
    );
  }
}
