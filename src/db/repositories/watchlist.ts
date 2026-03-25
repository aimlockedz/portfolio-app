import { getDb } from "@/db/db";
import { watchlistItems } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { generateId } from "lucia";

export class WatchlistRepository {
  constructor(private db: ReturnType<typeof getDb>) {}

  async getItems(userId: string) {
    return this.db
      .select()
      .from(watchlistItems)
      .where(eq(watchlistItems.userId, userId))
      .orderBy(watchlistItems.addedAt);
  }

  async addItem(userId: string, data: {
    symbol: string;
    convictionLevel: number;
    notes?: string;
  }) {
    return this.db.insert(watchlistItems).values({
      id: generateId(15),
      userId,
      symbol: data.symbol.toUpperCase(),
      convictionLevel: data.convictionLevel,
      notes: data.notes,
      addedAt: new Date(),
    });
  }

  async removeItem(userId: string, itemId: string) {
    return this.db
      .delete(watchlistItems)
      .where(
        and(
          eq(watchlistItems.id, itemId),
          eq(watchlistItems.userId, userId)
        )
      );
  }
}
