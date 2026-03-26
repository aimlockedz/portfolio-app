"use client";

import { useEffect, useState } from "react";
import { StockChart } from "./stock-chart";
import { ArrowLeft, TrendingUp, TrendingDown } from "lucide-react";
import Link from "next/link";

interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface Quote {
  currentPrice: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
}

interface TAData {
  ema9: { time: number; value: number }[];
  ema21: { time: number; value: number }[];
  ema50: { time: number; value: number }[];
  ema200: { time: number; value: number }[];
  rsi: number;
  macd: { macd: number; signal: number; histogram: number };
  fibonacci: { label: string; value: number }[];
  support: number[];
  resistance: number[];
  week52High: number;
  week52Low: number;
  currentEMA: { ema9: number; ema21: number; ema50: number; ema200: number };
}

const RANGES = ["1M", "3M", "6M", "1Y"] as const;

function calculateTA(candles: Candle[]): TAData {
  const closes = candles.map((c) => c.close);
  const highs = candles.map((c) => c.high);
  const lows = candles.map((c) => c.low);

  // EMAs
  function calcEMA(prices: number[], period: number): number[] {
    const k = 2 / (period + 1);
    const ema: number[] = [prices[0]];
    for (let i = 1; i < prices.length; i++) {
      ema.push(prices[i] * k + ema[i - 1] * (1 - k));
    }
    return ema;
  }

  const ema9 = calcEMA(closes, 9);
  const ema21 = calcEMA(closes, 21);
  const ema50 = calcEMA(closes, 50);
  const ema200 = calcEMA(closes, 200);

  // RSI
  function calcRSI(prices: number[], period: number = 14): number {
    if (prices.length <= period) return 50;
    let gains = 0, losses = 0;
    for (let i = 1; i <= period; i++) {
      const diff = prices[i] - prices[i - 1];
      if (diff >= 0) gains += diff; else losses -= diff;
    }
    let avgGain = gains / period, avgLoss = losses / period;
    for (let i = period + 1; i < prices.length; i++) {
      const diff = prices[i] - prices[i - 1];
      avgGain = (avgGain * (period - 1) + (diff > 0 ? diff : 0)) / period;
      avgLoss = (avgLoss * (period - 1) + (diff < 0 ? -diff : 0)) / period;
    }
    if (avgLoss === 0) return 100;
    return 100 - 100 / (1 + avgGain / avgLoss);
  }

  // MACD
  const ema12 = calcEMA(closes, 12);
  const ema26 = calcEMA(closes, 26);
  const macdLine = ema12.map((v, i) => v - ema26[i]);
  const signalLine = calcEMA(macdLine, 9);

  // 52-week high/low
  const last252 = closes.slice(-252);
  const last252H = highs.slice(-252);
  const last252L = lows.slice(-252);

  // Fibonacci from 52-week range
  const week52High = Math.max(...last252H);
  const week52Low = Math.min(...last252L);
  const fibDiff = week52High - week52Low;

  // Support/Resistance
  function detectSR(prices: number[], window: number = 5) {
    const res: number[] = [], sup: number[] = [];
    for (let i = window; i < prices.length - window; i++) {
      const current = prices[i];
      const left = prices.slice(i - window, i);
      const right = prices.slice(i + 1, i + window + 1);
      if (current > Math.max(...left) && current > Math.max(...right)) res.push(current);
      if (current < Math.min(...left) && current < Math.min(...right)) sup.push(current);
    }
    return {
      resistance: [...new Set(res)].sort((a, b) => b - a).slice(0, 3),
      support: [...new Set(sup)].sort((a, b) => a - b).slice(0, 3),
    };
  }

  const sr = detectSR(closes);

  return {
    ema9: candles.map((c, i) => ({ time: c.time, value: ema9[i] })),
    ema21: candles.map((c, i) => ({ time: c.time, value: ema21[i] })),
    ema50: candles.map((c, i) => ({ time: c.time, value: ema50[i] })),
    ema200: candles.map((c, i) => ({ time: c.time, value: ema200[i] })),
    rsi: calcRSI(closes),
    macd: {
      macd: macdLine[macdLine.length - 1],
      signal: signalLine[signalLine.length - 1],
      histogram: macdLine[macdLine.length - 1] - signalLine[signalLine.length - 1],
    },
    fibonacci: [
      { label: "0%", value: week52High },
      { label: "23.6%", value: week52High - fibDiff * 0.236 },
      { label: "38.2%", value: week52High - fibDiff * 0.382 },
      { label: "50%", value: week52High - fibDiff * 0.5 },
      { label: "61.8%", value: week52High - fibDiff * 0.618 },
      { label: "78.6%", value: week52High - fibDiff * 0.786 },
      { label: "100%", value: week52Low },
    ],
    support: sr.support,
    resistance: sr.resistance,
    week52High,
    week52Low,
    currentEMA: {
      ema9: ema9[ema9.length - 1],
      ema21: ema21[ema21.length - 1],
      ema50: ema50[ema50.length - 1],
      ema200: ema200[ema200.length - 1],
    },
  };
}

export function StockDetailClient({ symbol }: { symbol: string }) {
  const [candles, setCandles] = useState<Candle[]>([]);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [ta, setTA] = useState<TAData | null>(null);
  const [range, setRange] = useState<(typeof RANGES)[number]>("1Y");
  const [loading, setLoading] = useState(true);
  const [showFib, setShowFib] = useState(true);
  const [showSR, setShowSR] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [candleRes, quoteRes] = await Promise.all([
        fetch(`/api/stock/candles?symbol=${symbol}&range=${range}`),
        fetch(`/api/stock/quote?symbol=${symbol}`),
      ]);
      const candleData = await candleRes.json();
      const quoteData = await quoteRes.json();

      setCandles(candleData.candles || []);
      setQuote(quoteData);

      if (candleData.candles?.length > 0) {
        setTA(calculateTA(candleData.candles));
      }
      setLoading(false);
    }
    load();
  }, [symbol, range]);

  const emaLines = ta
    ? [
        { period: 9, color: "#f59e0b", data: ta.ema9 },
        { period: 21, color: "#3b82f6", data: ta.ema21 },
        { period: 50, color: "#8b5cf6", data: ta.ema50 },
        { period: 200, color: "#ef4444", data: ta.ema200 },
      ]
    : [];

  const srLevels = ta && showSR
    ? [
        ...ta.support.map((v) => ({ value: v, type: "support" as const })),
        ...ta.resistance.map((v) => ({ value: v, type: "resistance" as const })),
      ]
    : [];

  const fibLevels = ta && showFib ? ta.fibonacci : [];

  return (
    <div className="p-6 lg:p-10 max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/portfolio"
          className="w-9 h-9 rounded-full bg-[var(--surface-container-low)] flex items-center justify-center hover:bg-[var(--surface-container-high)] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1">
          <h1 className="font-[var(--font-headline)] text-3xl font-bold">{symbol}</h1>
          {quote && (
            <div className="flex items-center gap-3 mt-1">
              <span className="font-[var(--font-headline)] text-2xl font-bold">
                ${quote.currentPrice?.toFixed(2)}
              </span>
              <span
                className={`inline-flex items-center gap-1 text-sm font-bold px-3 py-1 rounded-full ${
                  quote.change >= 0
                    ? "bg-[var(--primary-container)] text-[var(--primary)]"
                    : "bg-[#fa746f]/15 text-[#a83836]"
                }`}
              >
                {quote.change >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {quote.change >= 0 ? "+" : ""}{quote.changePercent?.toFixed(2)}%
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Chart Card */}
      <div className="rounded-2xl bg-[var(--card)] shadow-[0_2px_32px_rgba(0,0,0,0.04)] p-6">
        {/* Range + Toggle buttons */}
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div className="flex gap-1.5">
            {RANGES.map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                  range === r
                    ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                    : "bg-[var(--surface-container-low)] text-[var(--on-surface-variant)] hover:bg-[var(--surface-container-high)]"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
          <div className="flex gap-1.5">
            <button
              onClick={() => setShowFib(!showFib)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                showFib ? "bg-[#6e5d35] text-white" : "bg-[var(--surface-container-low)] text-[var(--on-surface-variant)]"
              }`}
            >
              Fibonacci
            </button>
            <button
              onClick={() => setShowSR(!showSR)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                showSR ? "bg-[var(--primary)] text-[var(--primary-foreground)]" : "bg-[var(--surface-container-low)] text-[var(--on-surface-variant)]"
              }`}
            >
              S/R
            </button>
          </div>
        </div>

        {loading ? (
          <div className="h-[420px] flex items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-3 border-[var(--primary)] border-t-transparent" />
          </div>
        ) : candles.length > 0 ? (
          <StockChart
            candles={candles}
            emaLines={emaLines}
            srLevels={srLevels}
            fibLevels={fibLevels}
          />
        ) : (
          <div className="h-[420px] flex items-center justify-center text-[var(--on-surface-variant)]">
            No chart data available
          </div>
        )}

        {/* EMA Legend */}
        <div className="flex gap-4 mt-3 flex-wrap">
          <span className="text-xs flex items-center gap-1.5"><span className="w-3 h-0.5 bg-[#f59e0b] inline-block rounded" /> EMA 9</span>
          <span className="text-xs flex items-center gap-1.5"><span className="w-3 h-0.5 bg-[#3b82f6] inline-block rounded" /> EMA 21</span>
          <span className="text-xs flex items-center gap-1.5"><span className="w-3 h-0.5 bg-[#8b5cf6] inline-block rounded" /> EMA 50</span>
          <span className="text-xs flex items-center gap-1.5"><span className="w-3 h-0.5 bg-[#ef4444] inline-block rounded" /> EMA 200</span>
        </div>
      </div>

      {/* Technical Indicators Grid */}
      {ta && (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {/* 52-Week Range */}
          <div className="rounded-2xl bg-[var(--card)] shadow-[0_2px_32px_rgba(0,0,0,0.04)] p-6">
            <h3 className="font-[var(--font-headline)] font-bold text-sm mb-4 text-[var(--on-surface-variant)] uppercase tracking-wider">
              52 Week Range
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-[var(--on-surface-variant)]">52W Low</span>
                <span className="font-bold">${ta.week52Low.toFixed(2)}</span>
              </div>
              {/* Range bar */}
              <div className="relative h-2 rounded-full bg-[var(--surface-container-high)]">
                <div
                  className="absolute h-full rounded-full bg-gradient-to-r from-[#a83836] via-[#f59e0b] to-[#1a6b50]"
                  style={{
                    width: `${Math.min(100, Math.max(0, ((quote?.currentPrice ?? ta.week52Low) - ta.week52Low) / (ta.week52High - ta.week52Low) * 100))}%`
                  }}
                />
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--on-surface-variant)]">52W High</span>
                <span className="font-bold">${ta.week52High.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* EMA Values */}
          <div className="rounded-2xl bg-[var(--card)] shadow-[0_2px_32px_rgba(0,0,0,0.04)] p-6">
            <h3 className="font-[var(--font-headline)] font-bold text-sm mb-4 text-[var(--on-surface-variant)] uppercase tracking-wider">
              EMA Values
            </h3>
            <div className="space-y-2.5">
              {[
                { label: "EMA 9", value: ta.currentEMA.ema9, color: "#f59e0b" },
                { label: "EMA 21", value: ta.currentEMA.ema21, color: "#3b82f6" },
                { label: "EMA 50", value: ta.currentEMA.ema50, color: "#8b5cf6" },
                { label: "EMA 200", value: ta.currentEMA.ema200, color: "#ef4444" },
              ].map((ema) => (
                <div key={ema.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: ema.color }} />
                    <span className="text-sm text-[var(--on-surface-variant)]">{ema.label}</span>
                  </div>
                  <span className="text-sm font-bold">${ema.value.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* RSI + MACD */}
          <div className="rounded-2xl bg-[var(--card)] shadow-[0_2px_32px_rgba(0,0,0,0.04)] p-6">
            <h3 className="font-[var(--font-headline)] font-bold text-sm mb-4 text-[var(--on-surface-variant)] uppercase tracking-wider">
              Momentum
            </h3>
            <div className="space-y-4">
              {/* RSI */}
              <div>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-[var(--on-surface-variant)]">RSI (14)</span>
                  <span className={`font-bold ${
                    ta.rsi > 70 ? "text-[#a83836]" : ta.rsi < 30 ? "text-[var(--primary)]" : ""
                  }`}>
                    {ta.rsi.toFixed(1)}
                  </span>
                </div>
                <div className="relative h-2 rounded-full bg-[var(--surface-container-high)]">
                  <div
                    className={`absolute h-full rounded-full ${
                      ta.rsi > 70 ? "bg-[#a83836]" : ta.rsi < 30 ? "bg-[var(--primary)]" : "bg-[#f59e0b]"
                    }`}
                    style={{ width: `${ta.rsi}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-[var(--on-surface-variant)] mt-1">
                  <span>Oversold</span><span>Neutral</span><span>Overbought</span>
                </div>
              </div>

              {/* MACD */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--on-surface-variant)]">MACD</span>
                  <span className="font-bold">{ta.macd.macd.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--on-surface-variant)]">Signal</span>
                  <span className="font-bold">{ta.macd.signal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--on-surface-variant)]">Histogram</span>
                  <span className={`font-bold ${ta.macd.histogram >= 0 ? "text-[var(--primary)]" : "text-[#a83836]"}`}>
                    {ta.macd.histogram >= 0 ? "+" : ""}{ta.macd.histogram.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Fibonacci Levels */}
          <div className="rounded-2xl bg-[var(--card)] shadow-[0_2px_32px_rgba(0,0,0,0.04)] p-6">
            <h3 className="font-[var(--font-headline)] font-bold text-sm mb-4 text-[var(--on-surface-variant)] uppercase tracking-wider">
              Fibonacci Retracement
            </h3>
            <div className="space-y-2">
              {ta.fibonacci.map((fib) => (
                <div key={fib.label} className="flex justify-between text-sm">
                  <span className="text-[var(--on-surface-variant)]">{fib.label}</span>
                  <span className="font-bold font-mono">${fib.value.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Support Levels */}
          <div className="rounded-2xl bg-[var(--card)] shadow-[0_2px_32px_rgba(0,0,0,0.04)] p-6">
            <h3 className="font-[var(--font-headline)] font-bold text-sm mb-4 text-[var(--on-surface-variant)] uppercase tracking-wider">
              Support Levels
            </h3>
            <div className="space-y-2.5">
              {ta.support.length > 0 ? ta.support.map((s, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[var(--primary)]" />
                    <span className="text-sm text-[var(--on-surface-variant)]">Support {i + 1}</span>
                  </div>
                  <span className="text-sm font-bold font-mono">${s.toFixed(2)}</span>
                </div>
              )) : (
                <p className="text-sm text-[var(--on-surface-variant)]">Not enough data</p>
              )}
            </div>
          </div>

          {/* Resistance Levels */}
          <div className="rounded-2xl bg-[var(--card)] shadow-[0_2px_32px_rgba(0,0,0,0.04)] p-6">
            <h3 className="font-[var(--font-headline)] font-bold text-sm mb-4 text-[var(--on-surface-variant)] uppercase tracking-wider">
              Resistance Levels
            </h3>
            <div className="space-y-2.5">
              {ta.resistance.length > 0 ? ta.resistance.map((r, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#a83836]" />
                    <span className="text-sm text-[var(--on-surface-variant)]">Resistance {i + 1}</span>
                  </div>
                  <span className="text-sm font-bold font-mono">${r.toFixed(2)}</span>
                </div>
              )) : (
                <p className="text-sm text-[var(--on-surface-variant)]">Not enough data</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
