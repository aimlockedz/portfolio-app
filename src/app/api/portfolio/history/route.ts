import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getDb } from "@/db/db";
import { initializeLucia } from "@/lib/auth";
import { PortfolioRepository } from "@/db/repositories/portfolio";

export const dynamic = "force-dynamic";

/* eslint-disable @typescript-eslint/no-explicit-any */

// Yahoo Finance range strings for each period
const PERIOD_MAP: Record<string, string> = {
  "1m": "1mo",
  "3m": "3mo",
  "6m": "6mo",
  "1y": "1y",
  "all": "5y",
};

async function fetchDailyCloses(symbol: string, range: string): Promise<{ date: string; close: number }[]> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=${range}&interval=1d`;
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      cache: "no-store",
    });
    const data = await res.json();
    const result = data?.chart?.result?.[0];
    if (!result) return [];

    const timestamps: number[] = result.timestamp || [];
    const closes: (number | null)[] = result.indicators?.quote?.[0]?.close || [];
    const points: { date: string; close: number }[] = [];

    for (let i = 0; i < timestamps.length; i++) {
      if (closes[i] != null && closes[i]! > 0) {
        const dateStr = new Date(timestamps[i] * 1000).toISOString().split("T")[0];
        points.push({ date: dateStr, close: closes[i]! });
      }
    }
    return points;
  } catch {
    return [];
  }
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
  const yahooRange = PERIOD_MAP[period] || "5y";

  try {
    const portfolioRepo = new PortfolioRepository(db);
    const holdings = await portfolioRepo.getHoldings(user.id);

    if (holdings.length === 0) {
      return NextResponse.json({ dataPoints: [] });
    }

    // Simple approach: get current holdings, fetch daily prices, compute daily portfolio value
    // This shows how the current portfolio would have performed over the period

    // Fetch daily prices for all held symbols in parallel
    const priceData = await Promise.all(
      holdings.map(async (h) => ({
        symbol: h.symbol,
        qty: h.totalQuantity,
        avgCost: h.averageCost / 100, // cents to dollars
        prices: await fetchDailyCloses(h.symbol, yahooRange),
      }))
    );

    // Build a map: date -> { symbol -> close price }
    const allDates = new Set<string>();
    const priceMap: Record<string, Record<string, number>> = {};

    for (const { symbol, prices } of priceData) {
      for (const { date, close } of prices) {
        allDates.add(date);
        if (!priceMap[date]) priceMap[date] = {};
        priceMap[date][symbol] = close;
      }
    }

    const sortedDates = [...allDates].sort();

    // For each date, compute total portfolio value & total cost basis
    const totalCostBasis = priceData.reduce((sum, h) => sum + h.qty * h.avgCost, 0);

    // Track last known price per symbol (for days where one symbol has no trade)
    const lastPrice: Record<string, number> = {};

    const dataPoints: { date: string; value: number; cost: number }[] = [];

    for (const date of sortedDates) {
      let portfolioValue = 0;
      let allHavePrice = true;

      for (const { symbol, qty } of priceData) {
        const price = priceMap[date]?.[symbol];
        if (price) {
          lastPrice[symbol] = price;
        }
        if (lastPrice[symbol]) {
          portfolioValue += qty * lastPrice[symbol];
        } else {
          allHavePrice = false;
        }
      }

      // Only include days where we have prices for all symbols
      if (allHavePrice && portfolioValue > 0) {
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
