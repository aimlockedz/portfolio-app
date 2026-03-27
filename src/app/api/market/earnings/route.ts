import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const FINNHUB_KEY = process.env.FINNHUB_API_KEY || "";

export async function GET(request: NextRequest) {
  const from = request.nextUrl.searchParams.get("from");
  const to = request.nextUrl.searchParams.get("to");

  if (!from || !to) {
    return NextResponse.json({ error: "from and to dates required (YYYY-MM-DD)" }, { status: 400 });
  }

  try {
    // Use Finnhub earnings calendar (free tier)
    const url = `https://finnhub.io/api/v1/calendar/earnings?from=${from}&to=${to}&token=${FINNHUB_KEY}`;
    const res = await fetch(url, { next: { revalidate: 3600 } });
    const data = await res.json();

    const earnings = (data.earningsCalendar || []).map((e: any) => ({
      symbol: e.symbol,
      date: e.date,
      hour: e.hour, // 'bmo' (before market open), 'amc' (after market close), 'dmh' (during market hours)
      epsEstimate: e.epsEstimate,
      epsActual: e.epsActual,
      revenueEstimate: e.revenueEstimate,
      revenueActual: e.revenueActual,
      quarter: e.quarter,
      year: e.year,
    }));

    return NextResponse.json({ earnings });
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch earnings calendar", debug: String(err) }, { status: 500 });
  }
}
