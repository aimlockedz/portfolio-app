"use client";

import { PortfolioHistoryChart } from "./portfolio-history-chart";
import { CorrelationMatrix } from "./correlation-matrix";
import { DividendCalendar } from "./dividend-calendar";

interface Props {
  symbols: string[];
}

export function PortfolioExtras({ symbols }: Props) {
  if (symbols.length === 0) return null;

  return (
    <div className="space-y-6">
      {/* Portfolio History Chart */}
      <PortfolioHistoryChart />

      {/* Correlation + Dividends side by side */}
      <div className="grid lg:grid-cols-2 gap-4">
        <CorrelationMatrix symbols={symbols} />
        <DividendCalendar symbols={symbols} />
      </div>
    </div>
  );
}
