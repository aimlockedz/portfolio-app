export type AllocationStyle = 'Aggressive' | 'Balanced' | 'Defensive';

export interface StockRecommendation {
  symbol: string;
  weight: number; // percentage (0-1)
  score: number;
  amount: number; // calculated in currency
}

export class AllocationEngine {
  /**
   * Recommends stock allocation based on investment style and available capital.
   * Logic uses a weighted distribution based on stock scores and conviction.
   */
  calculateAllocation(
    capital: number, // in cents
    style: AllocationStyle,
    stocks: { symbol: string; totalScore: number; convictionLevel: number }[],
    cashReservePercent: number = 0.1
  ): StockRecommendation[] {
    if (stocks.length === 0) return [];

    const availableToInvest = capital * (1 - cashReservePercent);
    
    // Sort stocks by totalScore (Investment Intelligence)
    const sortedStocks = [...stocks].sort((a, b) => b.totalScore - a.totalScore);

    // Apply weights based on Style
    // Aggressive: Heavily weight top performers, higher risk
    // Balanced: More even distribution
    // Defensive: Focus on low risk, smaller bets
    
    let totalPower = 0;
    const itemsWithPower = sortedStocks.map(s => {
      let power = s.totalScore * s.convictionLevel;
      
      // Style adjustments
      if (style === 'Aggressive') power = Math.pow(power, 1.5);
      if (style === 'Defensive') power = Math.sqrt(power);
      
      totalPower += power;
      return { ...s, power };
    });

    return itemsWithPower.map(item => {
      const weight = item.power / totalPower;
      return {
        symbol: item.symbol,
        weight: weight,
        score: item.totalScore,
        amount: Math.round(availableToInvest * weight),
      };
    });
  }
}
