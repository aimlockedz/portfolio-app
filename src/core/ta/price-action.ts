export class PriceAction {
  /**
   * Fibonacci Retracement Levels
   */
  static calculateFibonacci(high: number, low: number): { [key: string]: number } {
    const diff = high - low;
    return {
      "0": high,
      "0.236": high - diff * 0.236,
      "0.382": high - diff * 0.382,
      "0.5": high - diff * 0.5,
      "0.618": high - diff * 0.618,
      "0.786": high - diff * 0.786,
      "1": low,
    };
  }

  /**
   * Simple Swing High / Swing Low detection
   */
  static detectSwings(prices: number[], window: number = 5): { highs: number[]; lows: number[] } {
    let highs: number[] = [];
    let lows: number[] = [];

    for (let i = window; i < prices.length - window; i++) {
      const current = prices[i];
      const left = prices.slice(i - window, i);
      const right = prices.slice(i + 1, i + window + 1);

      if (current > Math.max(...left) && current > Math.max(...right)) {
        highs.push(current);
      }
      if (current < Math.min(...left) && current < Math.min(...right)) {
        lows.push(current);
      }
    }

    return { highs, lows };
  }

  /**
   * Identify Support and Resistance Zones based on Swings
   */
  static identifyZones(prices: number[]): { support: number[]; resistance: number[] } {
    const { highs, lows } = this.detectSwings(prices, 5);
    
    // Simple clustering could be added, for now just returning raw points
    // Sort and return top/bottom 3
    return {
      resistance: [...new Set(highs)].sort((a, b) => b - a).slice(0, 3),
      support: [...new Set(lows)].sort((a, b) => a - b).slice(0, 3),
    };
  }
}
