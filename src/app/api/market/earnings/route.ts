import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const FINNHUB_KEY = process.env.FINNHUB_API_KEY || "";

/* eslint-disable @typescript-eslint/no-explicit-any */

// Filter: US stocks only (no dots like .TO, .L, .HK etc.)
function isUSSymbol(symbol: string): boolean {
  if (!symbol) return false;
  if (symbol.includes(".") || symbol.includes(":")) return false;
  if (symbol.length > 5) return false; // US tickers are 1-5 chars
  return /^[A-Z]+$/.test(symbol);
}

export async function GET(request: NextRequest) {
  const from = request.nextUrl.searchParams.get("from");
  const to = request.nextUrl.searchParams.get("to");

  if (!from || !to) {
    return NextResponse.json({ error: "from and to dates required (YYYY-MM-DD)" }, { status: 400 });
  }

  try {
    const url = `https://finnhub.io/api/v1/calendar/earnings?from=${from}&to=${to}&token=${FINNHUB_KEY}`;
    const res = await fetch(url, { next: { revalidate: 3600 } });
    const data = await res.json();

    // Filter US-only and deduplicate
    const seen = new Set<string>();
    const earnings = (data.earningsCalendar || [])
      .filter((e: any) => {
        if (!isUSSymbol(e.symbol)) return false;
        const key = `${e.symbol}-${e.date}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .map((e: any) => ({
        symbol: e.symbol,
        date: e.date,
        hour: e.hour || "",
        epsEstimate: e.epsEstimate ?? null,
        epsActual: e.epsActual ?? null,
        revenueEstimate: e.revenueEstimate ?? null,
        revenueActual: e.revenueActual ?? null,
        quarter: e.quarter || null,
        year: e.year || null,
      }));

    return NextResponse.json({ earnings });
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch earnings calendar", debug: String(err) }, { status: 500 });
  }
}
