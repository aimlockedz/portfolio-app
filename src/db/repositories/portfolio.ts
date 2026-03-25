import { getDb } from "@/db/db";
import { portfolioHoldings, transactions } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { generateId } from "lucia";

export class PortfolioRepository {
  constructor(private db: ReturnType<typeof getDb>) {}

  async getHoldings(userId: string) {
    return this.db
      .select()
      .from(portfolioHoldings)
      .where(eq(portfolioHoldings.userId, userId));
  }

  async getTransactions(userId: string, symbol?: string) {
    const conditions = [eq(transactions.userId, userId)];
    
    if (symbol) {
      conditions.push(eq(transactions.symbol, symbol));
    }

    return this.db
      .select()
      .from(transactions)
      .where(and(...conditions))
      .orderBy(transactions.date);
  }

  async addTransaction(userId: string, data: {
    symbol: string;
    type: 'BUY' | 'SELL';
    quantity: number;
    price: number; // in cents
    currency: string;
    fxRate: number; // rate * 1,000,000
    date: Date;
    brokerFee: number;
    notes?: string;
  }) {
    const transactionId = generateId(15);
    
    return await this.db.transaction(async (tx) => {
      // 1. Insert transaction
      await tx.insert(transactions).values({
        id: transactionId,
        userId,
        ...data,
      });

      // 2. Update or Insert Portfolio Holding
      const [existingHolding] = await tx
        .select()
        .from(portfolioHoldings)
        .where(
          and(
            eq(portfolioHoldings.userId, userId),
            eq(portfolioHoldings.symbol, data.symbol)
          )
        );

      if (existingHolding) {
        let newQuantity = existingHolding.totalQuantity;
        let newAverageCost = existingHolding.averageCost;

        if (data.type === 'BUY') {
          const totalCostBefore = existingHolding.totalQuantity * existingHolding.averageCost;
          const transactionCost = data.quantity * data.price;
          newQuantity += data.quantity;
          newAverageCost = Math.round((totalCostBefore + transactionCost) / newQuantity);
        } else {
          newQuantity -= data.quantity;
          // Selling doesn't change average cost of remaining shares
        }

        if (newQuantity <= 0) {
          await tx.delete(portfolioHoldings).where(eq(portfolioHoldings.id, existingHolding.id));
        } else {
          await tx
            .update(portfolioHoldings)
            .set({
              totalQuantity: newQuantity,
              averageCost: newAverageCost,
              updatedAt: new Date(),
            })
            .where(eq(portfolioHoldings.id, existingHolding.id));
        }
      } else if (data.type === 'BUY') {
        await tx.insert(portfolioHoldings).values({
          id: generateId(15),
          userId,
          symbol: data.symbol,
          averageCost: data.price,
          totalQuantity: data.quantity,
          updatedAt: new Date(),
        });
      }
      
      return transactionId;
    });
  }
}
