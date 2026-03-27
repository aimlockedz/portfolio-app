import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getDb } from "@/db/db";
import { initializeLucia } from "@/lib/auth";
import { PortfolioRepository } from "@/db/repositories/portfolio";
import YahooFinance from "yahoo-finance2";

export const dynamic = "force-dynamic";

const yf = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

/* eslint-disable @typescript-eslint/no-explicit-any */

export async function GET(request: NextRequest) {
  const db = getDb();
  const lucia = initializeLucia(db);

  const cookieStore = await cookies();
  const sessionId = cookieStore.get(lucia.sessionCookieName)?.value ?? null;
  if (!sessionId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { user } = await lucia.validateSession(sessionId);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const period = request.nextUrl.searchParams.get("period") || "3m";

  try {
    const portfolioRepo = new PortfolioRepository(db);
    const holdings = await portfolioRepo.getHoldings(user.id);
    const transactions = await portfolioRepo.getTransactions(user.id);

    if (holdings.length === 0) {
      return NextResponse.json({ dataPoints: [] });
    }

    // Determine date range
    const now = new Date();
    const startDate = new Date(now);
    switch (period) {
      case "1m": startDate.setMonth(startDate.getMonth() - 1); break;
      case "3m": startDate.setMonth(startDate.getMonth() - 3); break;
      case "6m": startDate.setMonth(startDate.getMonth() - 6); break;
      case "1y": startDate.setFullYear(startDate.getFullYear() - 1); break;
      case "all":
        // Find earliest transaction
        if (transactions.length > 0) {
          const earliest = transactions.reduce((min, t) => t.date < min ? t.date : min, transactions[0].date);
          startDate.setTime(earliest.getTime());
        } else {
          startDate.setFullYear(startDate.getFullYear() - 1);
        }
        break;
      default: startDate.setMonth(startDate.getMonth() - 3);
    }

    // Fetch historical prices for all symbols
    const symbols = [...new Set(holdings.map((h) => h.symbol))];
    const priceHistory: Record<string, Record<string, number>> = {};

    await Promise.all(
      symbols.map(async (symbol) => {
        try {
          const result: any = await yf.chart(symbol, {
            period1: startDate.toISOString().split("T")[0],
            period2: now.toISOString().split("T")[0],
            interval: "1d",
          });

          const quotes = result.quotes || [];
          priceHistory[symbol] = {};
          quotes.forEach((q: any) => {
            if (q.date && q.close) {
              const dateStr = new Date(q.date).toISOString().split("T")[0];
              priceHistory[symbol][dateStr] = q.close;
            }
          });
        } catch { /* skip */ }
      })
    );

    // Build daily portfolio value
    // For each trading day, calculate total portfolio value based on holdings at that time
    // Simple approach: use current holdings quantities (doesn't reconstruct from transactions)
    const allDates = new Set<string>();
    Object.values(priceHistory).forEach((prices) => {
      Object.keys(prices).forEach((d) => allDates.add(d));
    });

    const sortedDates = [...allDates].sort();
    const totalCost = holdings.reduce((sum, h) => sum + (h.totalQuantity * h.averageCost) / 100, 0);

    const dataPoints = sortedDates.map((date) => {
      let portfolioValue = 0;
      holdings.forEach((h) => {
        const price = priceHistory[h.symbol]?.[date];
        if (price) {
          portfolioValue += h.totalQuantity * price;
        } else {
          // Use average cost as fallback
          portfolioValue += (h.totalQuantity * h.averageCost) / 100;
        }
      });

      return {
        date,
        value: parseFloat(portfolioValue.toFixed(2)),
        cost: parseFloat(totalCost.toFixed(2)),
      };
    });

    return NextResponse.json({ dataPoints });
  } catch (err) {
    return NextResponse.json({ error: "Failed to build portfolio history", debug: String(err) }, { status: 500 });
  }
}
