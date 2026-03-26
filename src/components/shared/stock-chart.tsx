"use client";

import { useEffect, useRef } from "react";
import {
  createChart,
  ColorType,
  LineStyle,
  CandlestickSeries,
  LineSeries,
  HistogramSeries,
} from "lightweight-charts";

interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface EMALine {
  period: number;
  color: string;
  data: { time: number; value: number }[];
}

interface SRLevel {
  value: number;
  type: "support" | "resistance";
}

interface StockChartProps {
  candles: Candle[];
  emaLines?: EMALine[];
  srLevels?: SRLevel[];
  fibLevels?: { label: string; value: number }[];
  height?: number;
}

export function StockChart({
  candles,
  emaLines = [],
  srLevels = [],
  fibLevels = [],
  height = 420,
}: StockChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || candles.length === 0) return;

    const isDark = document.documentElement.classList.contains("dark");

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: isDark ? "#9e9d99" : "#5e605b",
        fontFamily: "Be Vietnam Pro, sans-serif",
      },
      grid: {
        vertLines: { color: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)" },
        horzLines: { color: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)" },
      },
      crosshair: {
        vertLine: { labelBackgroundColor: "#1a6b50" },
        horzLine: { labelBackgroundColor: "#1a6b50" },
      },
      rightPriceScale: { borderVisible: false },
      timeScale: { borderVisible: false, timeVisible: false },
    });

    // Candlestick series (v5 API)
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#1a6b50",
      downColor: "#a83836",
      borderUpColor: "#1a6b50",
      borderDownColor: "#a83836",
      wickUpColor: "#1a6b50",
      wickDownColor: "#a83836",
    });

    candleSeries.setData(
      candles.map((c) => ({
        time: c.time as any,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      }))
    );

    // EMA overlay lines
    emaLines.forEach((ema) => {
      const lineSeries = chart.addSeries(LineSeries, {
        color: ema.color,
        lineWidth: 1,
        priceLineVisible: false,
        lastValueVisible: false,
        crosshairMarkerVisible: false,
      });
      lineSeries.setData(ema.data as any);
    });

    // Support/Resistance price lines
    srLevels.forEach((level) => {
      candleSeries.createPriceLine({
        price: level.value,
        color: level.type === "support" ? "#1a6b50" : "#a83836",
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: true,
        title: level.type === "support" ? "S" : "R",
      });
    });

    // Fibonacci levels
    fibLevels.forEach((fib) => {
      candleSeries.createPriceLine({
        price: fib.value,
        color: "#6e5d35",
        lineWidth: 1,
        lineStyle: LineStyle.Dotted,
        axisLabelVisible: true,
        title: `Fib ${fib.label}`,
      });
    });

    // Volume
    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: "volume" },
      priceScaleId: "volume",
    });

    chart.priceScale("volume").applyOptions({
      scaleMargins: { top: 0.85, bottom: 0 },
    });

    volumeSeries.setData(
      candles.map((c) => ({
        time: c.time as any,
        value: c.volume,
        color: c.close >= c.open ? "rgba(26,107,80,0.15)" : "rgba(168,56,54,0.15)",
      }))
    );

    chart.timeScale().fitContent();

    const resizeObserver = new ResizeObserver(() => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth });
      }
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
    };
  }, [candles, emaLines, srLevels, fibLevels, height]);

  return <div ref={containerRef} className="w-full" />;
}
