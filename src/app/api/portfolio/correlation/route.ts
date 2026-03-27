import { NextRequest, NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";

export const dynamic = "force-dynamic";

const yf = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

function pearsonCorrelation(x: number[], y: number[]): number {
  const n = Math.min(x.length, y.length);
  if (n < 5) return 0;

  const xSlice = x.slice(0, n);
  const ySlice = y.slice(0, n);

  const meanX = xSlice.reduce((a, b) => a + b, 0) / n;
  const meanY = ySlice.reduce((a, b) => a + b, 0) / n;

  let num = 0, denX = 0, denY = 0;
  for (let i = 0; i < n; i++) {
    const dx = xSlice[i] - meanX;
    const dy = ySlice[i] - meanY;
    num += dx * dy;
    denX += dx * dx;
    denY += dy * dy;
  }

  const den = Math.sqrt(denX * denY);
  return den === 0 ? 0 : num / den;
}

export async function GET(request: NextRequest) {
  const symbolsParam = request.nextUrl.searchParams.get("symbols");
  if (!symbolsParam) {
    return NextResponse.json({ error: "symbols required" }, { status: 400 });
  }

  const symbols = symbolsParam.split(",").map((s) => s.trim().toUpperCase()).filter(Boolean);
  if (symbols.length < 2) {
    return NextResponse.json({ error: "Need at least 2 symbols" }, { status: 400 });
  }

  // Cap at 10 symbols to avoid too many requests
  const limited = symbols.slice(0, 10);

  try {
    const now = new Date();
    const threeMonthsAgo = new Date(now);
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    // Fetch historical data for all symbols
    const historicalData: Record<string, number[]> = {};

    await Promise.all(
      limited.map(async (symbol) => {
        try {
          const result: any = await yf.chart(symbol, {
            period1: threeMonthsAgo.toISOString().split("T")[0],
            period2: now.toISOString().split("T")[0],
            interval: "1d",
          });

          const quotes = result.quotes || [];
          // Calculate daily returns
          const prices = quotes.map((q: any) => q.close).filter((p: any) => p != null && p > 0);
          const returns: number[] = [];
          for (let i = 1; i < prices.length; i++) {
            returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
          }
          historicalData[symbol] = returns;
        } catch {
          historicalData[symbol] = [];
        }
      })
    );

    // Calculate correlation matrix
    const matrix: { row: string; col: string; value: number }[] = [];

    for (let i = 0; i < limited.length; i++) {
      for (let j = 0; j < limited.length; j++) {
        if (i === j) {
          matrix.push({ row: limited[i], col: limited[j], value: 1 });
        } else {
          const corr = pearsonCorrelation(
            historicalData[limited[i]] || [],
            historicalData[limited[j]] || []
          );
          matrix.push({ row: limited[i], col: limited[j], value: parseFloat(corr.toFixed(3)) });
        }
      }
    }

    return NextResponse.json({ symbols: limited, matrix });
  } catch (err) {
    return NextResponse.json({ error: "Failed to calculate correlation", debug: String(err) }, { status: 500 });
  }
}
