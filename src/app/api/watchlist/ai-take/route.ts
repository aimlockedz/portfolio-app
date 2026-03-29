import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, unauthorizedResponse } from "@/lib/auth-guard";
import { symbolSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

/* eslint-disable @typescript-eslint/no-explicit-any */

const FINNHUB_KEY = process.env.FINNHUB_API_KEY || "";

async function finnhub(path: string) {
  const res = await fetch(`https://finnhub.io/api/v1${path}&token=${FINNHUB_KEY}`, {
    cache: "no-store",
  });
  if (!res.ok) return null;
  return res.json();
}

export async function GET(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorizedResponse();

  const rawSymbol = request.nextUrl.searchParams.get("symbol");
  const parsed = symbolSchema.safeParse(rawSymbol);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid symbol" }, { status: 400 });
  }
  const symbol = parsed.data;

  try {
    // Fetch real data from multiple sources in parallel
    const [quote, profile, recommendation, peers, basicFinancials] = await Promise.all([
      finnhub(`/quote?symbol=${symbol}`),
      finnhub(`/stock/profile2?symbol=${symbol}`),
      finnhub(`/stock/recommendation?symbol=${symbol}`),
      finnhub(`/stock/peers?symbol=${symbol}`),
      finnhub(`/stock/metric?symbol=${symbol}&metric=all`),
    ]);

    // Extract key metrics
    const metrics = basicFinancials?.metric || {};
    const latestRec = recommendation?.[0] || {};
    const prevRec = recommendation?.[1] || {};

    // Build comprehensive data for AI
    const stockData = {
      symbol,
      name: profile?.name || symbol,
      sector: profile?.finnhubIndustry || "Unknown",
      marketCap: profile?.marketCapitalization
        ? `$${(profile.marketCapitalization / 1000).toFixed(1)}B`
        : "N/A",
      price: quote?.c || 0,
      change: quote?.d || 0,
      changePercent: quote?.dp || 0,
      high52w: metrics["52WeekHigh"] || 0,
      low52w: metrics["52WeekLow"] || 0,
      // Fundamental
      peRatio: metrics.peTTM || metrics.peNormalizedAnnual || "N/A",
      forwardPE: metrics.forwardPE || "N/A",
      pbRatio: metrics.pbAnnual || "N/A",
      psRatio: metrics.psAnnual || "N/A",
      dividendYield: metrics.dividendYieldIndicatedAnnual || 0,
      epsGrowth: metrics.epsGrowthTTMYoy || "N/A",
      revenueGrowth: metrics.revenueGrowthTTMYoy || "N/A",
      // Margins
      grossMargin: metrics.grossMarginTTM || "N/A",
      operatingMargin: metrics.operatingMarginTTM || "N/A",
      netMargin: metrics.netProfitMarginTTM || "N/A",
      roeTTM: metrics.roeTTM || "N/A",
      roaTTM: metrics.roaTTM || "N/A",
      // Technical
      beta: metrics.beta || "N/A",
      sma10d: metrics["10DayAverageTradingVolume"] || "N/A",
      rsi: metrics.currentRsi14 || "N/A",
      // Analyst recommendations
      analystBuy: latestRec.buy || 0,
      analystHold: latestRec.hold || 0,
      analystSell: latestRec.sell || 0,
      analystStrongBuy: latestRec.strongBuy || 0,
      analystStrongSell: latestRec.strongSell || 0,
      analystPeriod: latestRec.period || "N/A",
      prevBuy: prevRec.buy || 0,
      prevHold: prevRec.hold || 0,
      prevSell: prevRec.sell || 0,
      // Peers
      peers: (peers || []).slice(0, 5).join(", "),
      // Price target
      targetHigh: metrics.targetHigh || "N/A",
      targetLow: metrics.targetLow || "N/A",
      targetMedian: metrics.targetMedian || "N/A",
      targetMean: metrics.targetMean || "N/A",
    };

    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey) {
      return NextResponse.json({
        analysis: "ไม่สามารถวิเคราะห์ได้ — ไม่พบ API key",
        scores: {},
      });
    }

    const prompt = `คุณเป็นนักวิเคราะห์หุ้นมืออาชีพ วิเคราะห์หุ้น ${symbol} (${stockData.name}) จากข้อมูลจริงด้านล่าง

## ข้อมูลพื้นฐาน
- Sector: ${stockData.sector} | Market Cap: ${stockData.marketCap}
- ราคา: $${stockData.price} (${stockData.changePercent >= 0 ? "+" : ""}${stockData.changePercent.toFixed(2)}% วันนี้)
- 52W High: $${stockData.high52w} | 52W Low: $${stockData.low52w}

## Fundamental
- P/E (TTM): ${stockData.peRatio} | Forward P/E: ${stockData.forwardPE}
- P/B: ${stockData.pbRatio} | P/S: ${stockData.psRatio}
- EPS Growth YoY: ${stockData.epsGrowth}% | Revenue Growth YoY: ${stockData.revenueGrowth}%
- Gross Margin: ${stockData.grossMargin}% | Operating Margin: ${stockData.operatingMargin}%
- Net Margin: ${stockData.netMargin}% | ROE: ${stockData.roeTTM}% | ROA: ${stockData.roaTTM}%
- Dividend Yield: ${stockData.dividendYield}%

## Technical
- Beta: ${stockData.beta}
- RSI (14): ${stockData.rsi}
- ราคาปัจจุบัน vs 52W High: ${stockData.high52w > 0 ? ((stockData.price / stockData.high52w) * 100).toFixed(1) : "N/A"}%

## Analyst Consensus (${stockData.analystPeriod})
- Strong Buy: ${stockData.analystStrongBuy} | Buy: ${stockData.analystBuy} | Hold: ${stockData.analystHold} | Sell: ${stockData.analystSell} | Strong Sell: ${stockData.analystStrongSell}
- เปรียบเทียบเดือนก่อน: Buy ${stockData.prevBuy} → ${stockData.analystBuy}, Hold ${stockData.prevHold} → ${stockData.analystHold}, Sell ${stockData.prevSell} → ${stockData.analystSell}
- Price Target: Median $${stockData.targetMedian} | Mean $${stockData.targetMean} | High $${stockData.targetHigh} | Low $${stockData.targetLow}

## Peers: ${stockData.peers}

## ตอบเป็น JSON เท่านั้น:
{
  "fundamental": { "score": 1-10, "detail": "สรุป 1-2 ประโยคภาษาไทย วิเคราะห์ valuation, margin, ROE" },
  "growth": { "score": 1-10, "detail": "สรุป 1-2 ประโยคภาษาไทย วิเคราะห์ EPS growth, revenue growth, outlook" },
  "sentiment": { "score": 1-10, "detail": "สรุป 1-2 ประโยคภาษาไทย วิเคราะห์ analyst consensus, price target vs ราคาปัจจุบัน" },
  "technical": { "score": 1-10, "detail": "สรุป 1-2 ประโยคภาษาไทย วิเคราะห์ RSI, beta, ตำแหน่งใน 52W range" },
  "overall": "สรุปรวม 2-3 ประโยคภาษาไทย — ควรซื้อ/ถือ/ขาย และเหตุผลหลัก",
  "verdict": "Strong Buy | Buy | Hold | Sell | Strong Sell"
}`;

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${groqKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content:
              "คุณเป็นนักวิเคราะห์หุ้นมืออาชีพ ให้ความเห็นจากข้อมูลจริง ไม่ bias ตอบเป็น JSON เท่านั้น ห้ามมี markdown code block",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.4,
        max_tokens: 800,
      }),
    });

    if (!res.ok) {
      return NextResponse.json({
        analysis: "ไม่สามารถวิเคราะห์ได้ในขณะนี้",
        scores: {},
        rawData: stockData,
      });
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || "";

    try {
      const cleaned = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
      const parsed = JSON.parse(cleaned);
      return NextResponse.json({
        ...parsed,
        rawData: stockData,
      });
    } catch {
      return NextResponse.json({
        overall: content.slice(0, 500),
        rawData: stockData,
      });
    }
  } catch (err) {
    return NextResponse.json(
      { error: String(err) },
      { status: 500 }
    );
  }
}
