"use client";

import { CorrelationMatrix } from "./correlation-matrix";
import { DividendCalendar } from "./dividend-calendar";
import { PortfolioHistoryChart } from "./portfolio-history-chart";

interface Props {
  symbols: string[];
}

export function PortfolioExtras({ symbols }: Props) {
  if (symbols.length === 0) return null;

  return (
    <div className="space-y-4">
      <PortfolioHistoryChart />
      <div className="grid lg:grid-cols-2 gap-4">
        <CorrelationMatrix symbols={symbols} />
        <DividendCalendar symbols={symbols} />
      </div>
    </div>
  );
}
