export type RebalanceAction = 'Add' | 'Trim' | 'Hold';

export interface RebalanceSuggestion {
  symbol: string;
  currentWeight: number;
  targetWeight: number;
  diffPercent: number;
  action: RebalanceAction;
  notes: string;
}

export class RebalanceLogic {
  static calculateSuggestions(
    holdings: { symbol: string; value: number }[],
    targets: { [symbol: string]: number }, // percentage as 0-1
    threshold: number = 0.05 // 5% deviation
  ): RebalanceSuggestion[] {
    const totalValue = holdings.reduce((sum, h) => sum + h.value, 0);
    if (totalValue === 0) return [];

    const suggestions: RebalanceSuggestion[] = [];

    for (const holding of holdings) {
      const targetWeight = targets[holding.symbol] || 0;
      const currentWeight = holding.value / totalValue;
      const diffPercent = currentWeight - targetWeight;

      let action: RebalanceAction = 'Hold';
      let notes = 'Position is within target range.';

      if (Math.abs(diffPercent) > threshold) {
        if (diffPercent > 0) {
          action = 'Trim';
          notes = `Position is ${(diffPercent * 100).toFixed(1)}% over target.`;
        } else {
          action = 'Add';
          notes = `Position is ${(Math.abs(diffPercent) * 100).toFixed(1)}% under target.`;
        }
      }

      suggestions.push({
        symbol: holding.symbol,
        currentWeight,
        targetWeight,
        diffPercent,
        action,
        notes,
      });
    }

    return suggestions;
  }
}
