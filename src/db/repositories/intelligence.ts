import { getDb } from "@/db/db";
import { stockScores } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { generateId } from "lucia";

export class IntelligenceRepository {
  constructor(private db: ReturnType<typeof getDb>) {}

  async getScores(symbols: string[]) {
    if (symbols.length === 0) return [];
    
    return this.db
      .select()
      .from(stockScores)
      .where(inArray(stockScores.symbol, symbols));
  }

  async setScore(data: {
    symbol: string;
    growthScore: number;
    valuationScore: number;
    momentumScore: number;
    riskScore: number;
    sentimentScore: number;
  }) {
    const totalScore = Math.round(
      (data.growthScore +
        data.valuationScore +
        data.momentumScore +
        data.riskScore +
        data.sentimentScore) /
        5
    );

    const [existing] = await this.db
      .select()
      .from(stockScores)
      .where(eq(stockScores.symbol, data.symbol));

    if (existing) {
      return this.db
        .update(stockScores)
        .set({
          ...data,
          totalScore,
          updatedAt: new Date(),
        })
        .where(eq(stockScores.id, existing.id));
    } else {
      return this.db.insert(stockScores).values({
        id: generateId(15),
        ...data,
        totalScore,
        updatedAt: new Date(),
      });
    }
  }
}
