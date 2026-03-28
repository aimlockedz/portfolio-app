"use client";

import { useEffect, useState, useRef } from "react";
import { StockChart } from "./stock-chart";
import { FundamentalsClient } from "./fundamentals-client";
import { ArrowLeft, TrendingUp, TrendingDown, Bell, Plus, X, Search } from "lucide-react";
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
const INTERVALS = [
  { key: "D", label: "Day" },
  { key: "W", label: "Week" },
  { key: "M", label: "Month" },
] as const;

interface Recommendation {
  buy: number;
  hold: number;
  sell: number;
  strongBuy: number;
  strongSell: number;
  period: string;
}

interface PriceAlert {
  id: string;
  symbol: string;
  targetPrice: number; // cents
  direction: string;
}

function calculateTA(candles: Candle[]): TAData {
  const closes = candles.map((c) => c.close);
  const highs = candles.map((c) => c.high);
  const lows = candles.map((c) => c.low);

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

  const ema12 = calcEMA(closes, 12);
  const ema26 = calcEMA(closes, 26);
  const macdLine = ema12.map((v, i) => v - ema26[i]);
  const signalLine = calcEMA(macdLine, 9);

  const last252H = highs.slice(-252);
  const last252L = lows.slice(-252);
  const week52High = Math.max(...last252H);
  const week52Low = Math.min(...last252L);
  const fibDiff = week52High - week52Low;

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

const EMA_CONFIG = [
  { key: "ema9", label: "EMA 9", color: "#f59e0b" },
  { key: "ema21", label: "EMA 21", color: "#3b82f6" },
  { key: "ema50", label: "EMA 50", color: "#8b5cf6" },
  { key: "ema200", label: "EMA 200", color: "#ef4444" },
] as const;

// Common pill button style
const pillActive = "bg-[var(--primary)] text-[var(--primary-foreground)]";
const pillInactive = "bg-[var(--surface-container-low)] text-[var(--on-surface-variant)] hover:bg-[var(--surface-container-high)]";

export function StockDetailClient({ symbol }: { symbol: string }) {
  const [candles, setCandles] = useState<Candle[]>([]);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [ta, setTA] = useState<TAData | null>(null);
  const [range, setRange] = useState<(typeof RANGES)[number]>("1Y");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showFib, setShowFib] = useState(false);
  const [showSR, setShowSR] = useState(false);
  const [interval, setInterval] = useState<string>("D");
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [showEMA, setShowEMA] = useState<Record<string, boolean>>({
    ema9: true, ema21: true, ema50: false, ema200: false,
  });
  const [activeTab, setActiveTab] = useState<"chart" | "fundamentals">("chart");
  const [companyName, setCompanyName] = useState("");

  // Price alerts
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [showAlertForm, setShowAlertForm] = useState(false);
  const [alertPrice, setAlertPrice] = useState("");
  const [alertDirection, setAlertDirection] = useState<"above" | "below">("above");
  const [creatingAlert, setCreatingAlert] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const [candleRes, quoteRes, recRes, profileRes] = await Promise.all([
          fetch(`/api/stock/candles?symbol=${symbol}&range=${range}&interval=${interval}`),
          fetch(`/api/stock/quote?symbol=${symbol}`),
          fetch(`/api/stock/recommendation?symbol=${symbol}`),
          fetch(`/api/stock/profile?symbol=${symbol}`),
        ]);
        const candleData = await candleRes.json();
        const quoteData = await quoteRes.json();
        const profileData = await profileRes.json().catch(() => ({}));
        if (profileData?.name) setCompanyName(profileData.name);

        if (candleData.error && candleData.candles?.length === 0) {
          setError(candleData.error);
        }

        setCandles(candleData.candles || []);
        setQuote(quoteData);

        if (candleData.candles?.length > 0) {
          setTA(calculateTA(candleData.candles));
        }

        const recData = await recRes.json().catch(() => null);
        if (recData?.recommendation) {
          setRecommendation(recData.recommendation);
        }
      } catch {
        setError("Failed to load data");
      }
      setLoading(false);
    }
    load();
  }, [symbol, range, interval]);

  // Fetch alerts for this symbol
  useEffect(() => {
    fetch("/api/portfolio/alerts")
      .then((r) => r.json())
      .then((data) => {
        const all: PriceAlert[] = data.alerts || [];
        setAlerts(all.filter((a) => a.symbol === symbol.toUpperCase()));
      })
      .catch(() => {});
  }, [symbol]);

  async function createAlert() {
    if (!alertPrice) return;
    setCreatingAlert(true);
    try {
      await fetch("/api/portfolio/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol: symbol.toUpperCase(),
          targetPrice: parseFloat(alertPrice),
          direction: alertDirection,
        }),
      });
      setAlertPrice("");
      setShowAlertForm(false);
      // Reload alerts
      const res = await fetch("/api/portfolio/alerts");
      const data = await res.json();
      setAlerts((data.alerts || []).filter((a: PriceAlert) => a.symbol === symbol.toUpperCase()));
    } catch { /* skip */ }
    setCreatingAlert(false);
  }

  async function deleteAlert(id: string) {
    await fetch("/api/portfolio/alerts", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  }

  const emaLines = ta
    ? EMA_CONFIG.filter((e) => showEMA[e.key]).map((e) => ({
        period: parseInt(e.label.split(" ")[1]),
        color: e.color,
        data: ta[e.key as keyof TAData] as { time: number; value: number }[],
      }))
    : [];

  const srLevels = ta && showSR
    ? [
        ...ta.support.map((v) => ({ value: v, type: "support" as const })),
        ...ta.resistance.map((v) => ({ value: v, type: "resistance" as const })),
      ]
    : [];

  const fibLevels = ta && showFib ? ta.fibonacci : [];

  // Alert levels for chart
  const alertLevels = alerts.map((a) => ({
    value: a.targetPrice / 100,
    direction: a.direction as "above" | "below",
  }));

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
          <h1 className="font-[var(--font-headline)] text-3xl font-bold">
            {symbol}
            {companyName && (
              <span className="ml-3 text-base font-medium text-[var(--on-surface-variant)]">{companyName}</span>
            )}
          </h1>
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
        {/* Quick Alert Button */}
        <button
          onClick={() => setShowAlertForm(!showAlertForm)}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
            showAlertForm
              ? "bg-red-500/10 text-red-400"
              : "bg-[var(--surface-container-low)] text-[var(--on-surface-variant)] hover:bg-[var(--surface-container-high)]"
          }`}
        >
          {showAlertForm ? <X className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
          {showAlertForm ? "Cancel" : "Set Alert"}
        </button>
      </div>

      {/* Quick Alert Form */}
      {showAlertForm && (
        <div className="rounded-xl bg-[var(--card)] border border-[var(--border)] p-4">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm font-bold text-[var(--primary)]">{symbol}</span>
            <input
              type="number"
              step="0.01"
              value={alertPrice}
              onChange={(e) => setAlertPrice(e.target.value)}
              placeholder={quote ? `e.g. ${(quote.currentPrice * 1.05).toFixed(2)}` : "Price"}
              className="w-32 px-3 py-2 rounded-lg bg-[var(--surface-container)] border border-[var(--border)] text-sm font-semibold outline-none focus:border-[var(--primary)]"
            />
            <div className="flex gap-1.5">
              <button
                onClick={() => setAlertDirection("above")}
                className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                  alertDirection === "above"
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    : "bg-[var(--surface-container)] text-[var(--on-surface-variant)] border border-[var(--border)]"
                }`}
              >
                ↑ Above
              </button>
              <button
                onClick={() => setAlertDirection("below")}
                className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                  alertDirection === "below"
                    ? "bg-red-500/10 text-red-400 border border-red-500/20"
                    : "bg-[var(--surface-container)] text-[var(--on-surface-variant)] border border-[var(--border)]"
                }`}
              >
                ↓ Below
              </button>
            </div>
            <button
              onClick={createAlert}
              disabled={creatingAlert || !alertPrice}
              className="px-4 py-2 rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] font-semibold text-sm hover:opacity-90 transition-all disabled:opacity-50"
            >
              {creatingAlert ? "..." : "Create"}
            </button>
          </div>
          {/* Current alerts for this symbol */}
          {alerts.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-[var(--border)]">
              {alerts.map((a) => (
                <span
                  key={a.id}
                  className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-full ${
                    a.direction === "above"
                      ? "bg-emerald-500/10 text-emerald-400"
                      : "bg-red-500/10 text-red-400"
                  }`}
                >
                  {a.direction === "above" ? "↑" : "↓"} ${(a.targetPrice / 100).toFixed(2)}
                  <button
                    onClick={() => deleteAlert(a.id)}
                    className="ml-0.5 hover:opacity-70"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab Switcher */}
      <div className="flex gap-2">
        {(["chart", "fundamentals"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 rounded-full text-sm font-bold transition-all capitalize ${
              activeTab === tab ? pillActive : pillInactive
            }`}
          >
            {tab === "chart" ? "Chart" : "Fundamentals"}
          </button>
        ))}
      </div>

      {/* Fundamentals Tab */}
      {activeTab === "fundamentals" && <FundamentalsClient symbol={symbol} />}

      {/* Chart + TA sections (hidden when Fundamentals tab active) */}
      {activeTab === "chart" && (<>
      <div className="rounded-2xl bg-[var(--card)] shadow-[0_2px_32px_rgba(0,0,0,0.04)] p-6">
        {/* Controls Row — unified button style */}
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          {/* Range buttons */}
          <div className="flex gap-1.5">
            {RANGES.map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                  range === r ? pillActive : pillInactive
                }`}
              >
                {r}
              </button>
            ))}
          </div>
          {/* Interval buttons — SAME style as range */}
          <div className="flex gap-1.5">
            {INTERVALS.map((iv) => (
              <button
                key={iv.key}
                onClick={() => setInterval(iv.key)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                  interval === iv.key ? pillActive : pillInactive
                }`}
              >
                {iv.label}
              </button>
            ))}
          </div>
          {/* Overlay toggles */}
          <div className="flex gap-1.5 flex-wrap">
            <button
              onClick={() => setShowFib(!showFib)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                showFib ? "bg-[#6e5d35] text-white" : pillInactive
              }`}
            >
              Fibonacci
            </button>
            <button
              onClick={() => setShowSR(!showSR)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                showSR ? pillActive : pillInactive
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
            alertLevels={alertLevels}
          />
        ) : (
          <div className="h-[420px] flex flex-col items-center justify-center gap-2">
            <span className="text-[var(--on-surface-variant)]">No chart data available</span>
            {error && (
              <span className="text-xs text-[#a83836] bg-[#fa746f]/10 px-3 py-1 rounded-full">{error}</span>
            )}
          </div>
        )}

        {/* EMA Legend - toggleable */}
        <div className="flex gap-2 mt-3 flex-wrap">
          {EMA_CONFIG.map((ema) => (
            <button
              key={ema.key}
              onClick={() => setShowEMA((prev) => ({ ...prev, [ema.key]: !prev[ema.key] }))}
              className={`text-xs flex items-center gap-1.5 px-2.5 py-1 rounded-full transition-all ${
                showEMA[ema.key]
                  ? "bg-[var(--surface-container-high)] font-bold"
                  : "opacity-40 hover:opacity-70"
              }`}
            >
              <span className="w-3 h-0.5 inline-block rounded" style={{ backgroundColor: ema.color }} />
              {ema.label}
            </button>
          ))}
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
              <div className="relative h-2 rounded-full bg-[var(--surface-container-high)]">
                <div
                  className="absolute h-full rounded-full bg-gradient-to-r from-[#a83836] via-[#f59e0b] to-[#1a6b50]"
                  style={{
                    width: `${Math.min(100, Math.max(0, ((quote?.currentPrice ?? ta.week52Low) - ta.week52Low) / (ta.week52High - ta.week52Low) * 100))}%`
                  }}
                />
                <div
                  className="absolute top-[-3px] w-2 h-[14px] rounded-sm bg-white border border-[var(--on-surface-variant)]"
                  style={{
                    left: `${Math.min(100, Math.max(0, ((quote?.currentPrice ?? ta.week52Low) - ta.week52Low) / (ta.week52High - ta.week52Low) * 100))}%`,
                    transform: "translateX(-50%)",
                  }}
                />
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--on-surface-variant)]">52W High</span>
                <span className="font-bold">${ta.week52High.toFixed(2)}</span>
              </div>
              {quote && (
                <div className="flex justify-between text-sm pt-1 border-t border-[var(--border)]">
                  <span className="text-[var(--on-surface-variant)]">Current</span>
                  <span className="font-bold text-[var(--primary)]">${quote.currentPrice.toFixed(2)}</span>
                </div>
              )}
            </div>
          </div>

          {/* EMA Values */}
          <div className="rounded-2xl bg-[var(--card)] shadow-[0_2px_32px_rgba(0,0,0,0.04)] p-6">
            <h3 className="font-[var(--font-headline)] font-bold text-sm mb-4 text-[var(--on-surface-variant)] uppercase tracking-wider">
              EMA Values
            </h3>
            <div className="space-y-2.5">
              {EMA_CONFIG.map((ema) => {
                const val = ta.currentEMA[ema.key as keyof typeof ta.currentEMA];
                const abovePrice = quote ? val > quote.currentPrice : false;
                return (
                  <div key={ema.key} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: ema.color }} />
                      <span className="text-sm text-[var(--on-surface-variant)]">{ema.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold">${val.toFixed(2)}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${abovePrice ? "bg-[#fa746f]/15 text-[#a83836]" : "bg-[var(--primary-container)] text-[var(--primary)]"}`}>
                        {abovePrice ? "Above" : "Below"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RSI + MACD */}
          <div className="rounded-2xl bg-[var(--card)] shadow-[0_2px_32px_rgba(0,0,0,0.04)] p-6">
            <h3 className="font-[var(--font-headline)] font-bold text-sm mb-4 text-[var(--on-surface-variant)] uppercase tracking-wider">
              Momentum
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-[var(--on-surface-variant)]">RSI (14)</span>
                  <span className={`font-bold ${ta.rsi > 70 ? "text-[#a83836]" : ta.rsi < 30 ? "text-[var(--primary)]" : ""}`}>
                    {ta.rsi.toFixed(1)}
                  </span>
                </div>
                <div className="relative h-2 rounded-full bg-[var(--surface-container-high)]">
                  <div
                    className={`absolute h-full rounded-full ${ta.rsi > 70 ? "bg-[#a83836]" : ta.rsi < 30 ? "bg-[var(--primary)]" : "bg-[#f59e0b]"}`}
                    style={{ width: `${ta.rsi}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-[var(--on-surface-variant)] mt-1">
                  <span>Oversold</span><span>Neutral</span><span>Overbought</span>
                </div>
              </div>
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
              {ta.fibonacci.map((fib) => {
                const isNear = quote && Math.abs(fib.value - quote.currentPrice) / quote.currentPrice < 0.02;
                return (
                  <div key={fib.label} className={`flex justify-between text-sm ${isNear ? "bg-[#6e5d35]/15 -mx-2 px-2 py-0.5 rounded" : ""}`}>
                    <span className="text-[var(--on-surface-variant)]">{fib.label}</span>
                    <span className={`font-bold font-mono ${isNear ? "text-[#6e5d35]" : ""}`}>${fib.value.toFixed(2)}</span>
                  </div>
                );
              })}
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

      {/* Volume Stats */}
      {candles.length > 0 && (
        <div className="rounded-2xl bg-[var(--card)] shadow-[0_2px_32px_rgba(0,0,0,0.04)] p-6">
          <h3 className="font-[var(--font-headline)] font-bold text-sm mb-4 text-[var(--on-surface-variant)] uppercase tracking-wider">
            Volume
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(() => {
              const last = candles[candles.length - 1];
              const vols = candles.map((c) => c.volume).filter(Boolean);
              const avgVol = vols.reduce((a, b) => a + b, 0) / vols.length;
              const maxVol = Math.max(...vols);
              const ratio = last?.volume ? last.volume / avgVol : 0;
              return (
                <>
                  <div>
                    <p className="text-xs text-[var(--on-surface-variant)] mb-1">Latest Volume</p>
                    <p className="font-bold text-lg">{last?.volume ? (last.volume / 1e6).toFixed(2) + "M" : "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--on-surface-variant)] mb-1">Avg Volume</p>
                    <p className="font-bold text-lg">{(avgVol / 1e6).toFixed(2)}M</p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--on-surface-variant)] mb-1">Max Volume</p>
                    <p className="font-bold text-lg">{(maxVol / 1e6).toFixed(2)}M</p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--on-surface-variant)] mb-1">Vol vs Avg</p>
                    <p className={`font-bold text-lg ${ratio > 1.5 ? "text-[var(--primary)]" : ratio < 0.5 ? "text-[#a83836]" : ""}`}>
                      {ratio.toFixed(2)}x
                    </p>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* Analyst Recommendations */}
      {recommendation && (
        <div className="rounded-2xl bg-[var(--card)] shadow-[0_2px_32px_rgba(0,0,0,0.04)] p-6">
          <h3 className="font-[var(--font-headline)] font-bold text-sm mb-4 text-[var(--on-surface-variant)] uppercase tracking-wider">
            Analyst Recommendations
          </h3>
          {(() => {
            const total = recommendation.strongBuy + recommendation.buy + recommendation.hold + recommendation.sell + recommendation.strongSell;
            if (total === 0) return <p className="text-sm text-[var(--on-surface-variant)]">No data available</p>;
            const items = [
              { label: "Strong Buy", count: recommendation.strongBuy, color: "#0d9488", bg: "rgba(13,148,136,0.15)" },
              { label: "Buy", count: recommendation.buy, color: "#1a6b50", bg: "rgba(26,107,80,0.15)" },
              { label: "Hold", count: recommendation.hold, color: "#f59e0b", bg: "rgba(245,158,11,0.15)" },
              { label: "Sell", count: recommendation.sell, color: "#dc2626", bg: "rgba(220,38,38,0.15)" },
              { label: "Strong Sell", count: recommendation.strongSell, color: "#991b1b", bg: "rgba(153,27,27,0.15)" },
            ];
            return (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[var(--on-surface-variant)]">From <span className="font-bold text-[var(--foreground)]">{total}</span> analysts</span>
                  <span className="text-xs text-[var(--on-surface-variant)]">{recommendation.period}</span>
                </div>
                <div className="flex h-8 rounded-full overflow-hidden">
                  {items.filter((i) => i.count > 0).map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center justify-center text-[10px] font-bold text-white transition-all"
                      style={{ width: `${(item.count / total) * 100}%`, backgroundColor: item.color, minWidth: item.count > 0 ? "24px" : "0" }}
                    >
                      {item.count}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {items.map((item) => (
                    <div key={item.label} className="text-center">
                      <div className="text-xl font-bold mb-0.5" style={{ color: item.color }}>
                        {item.count}
                      </div>
                      <div className="text-[10px] text-[var(--on-surface-variant)] leading-tight">{item.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
      )}
      </>)}
    </div>
  );
}
