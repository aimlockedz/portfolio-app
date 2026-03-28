"use client";

interface Props {
  symbols: string[];
}

export function PortfolioExtras({ symbols }: Props) {
  if (symbols.length === 0) return null;

  // Correlation Matrix and Dividend Calendar moved to Dashboard
  return null;
}
