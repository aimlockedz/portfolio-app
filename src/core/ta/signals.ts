import { TAIndicators } from "./indicators";
import { PriceAction } from "./price-action";

export type SignalType = 'Buy zone' | 'Watch zone' | 'Wait' | 'Sell zone';

export interface TASignalResult {
  signal: SignalType;
  rsi: number;
  fibLevel?: string;
  nearestSupport?: number;
  nearestResistance?: number;
  reason: string;
}

export class TASignals {
  /**
   * Generates a combined signal based on RSI and Fibonacci zones
   */
  static generateSignal(prices: number[]): TASignalResult {
    const currentPrice = prices[prices.length - 1];
    const rsi = TAIndicators.calculateRSI(prices);
    
    // Find high/low for Fibonacci
    const high = Math.max(...prices);
    const low = Math.min(...prices);
    const fibs = PriceAction.calculateFibonacci(high, low);
    
    // Find nearest Fibonacci level
    let nearestFib = "0";
    let minDiff = Infinity;
    for (const [level, val] of Object.entries(fibs)) {
      const diff = Math.abs(currentPrice - val);
      if (diff < minDiff) {
        minDiff = diff;
        nearestFib = level;
      }
    }

    const { support, resistance } = PriceAction.identifyZones(prices);
    
    let signal: SignalType = 'Wait';
    let reason = "Market is in neutral zone.";

    // 1. RSI Rules
    if (rsi < 30) {
      signal = 'Buy zone';
      reason = "RSI is oversold. Looking for reversal.";
    } else if (rsi > 70) {
      signal = 'Sell zone';
      reason = "RSI is overbought. Risk of correction.";
    }

    // 2. Fibonacci Refinement
    if (currentPrice <= fibs["0.618"] && currentPrice >= fibs["0.786"]) {
      if (rsi < 45) {
        signal = 'Buy zone';
        reason = "Price is in Fibonacci golden pocket with low RSI.";
      } else {
        signal = 'Watch zone';
        reason = "In golden pocket, watching for confirmation.";
      }
    }

    // 3. Resistance Check
    const firstRes = resistance[0];
    if (firstRes && Math.abs(currentPrice - firstRes) / firstRes < 0.01) {
      signal = 'Wait';
      reason = "Approaching resistance zone. High risk for new entries.";
    }

    return {
      signal,
      rsi,
      fibLevel: nearestFib,
      nearestSupport: support[0],
      nearestResistance: resistance[0],
      reason
    };
  }
}
