import { getDb } from "@/db/db";
import { journalEntries } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { generateId } from "lucia";

export class JournalRepository {
  constructor(private db: ReturnType<typeof getDb>) {}

  async getEntries(userId: string) {
    return this.db
      .select()
      .from(journalEntries)
      .where(eq(journalEntries.userId, userId))
      .orderBy(journalEntries.createdAt);
  }

  async addEntry(userId: string, data: {
    symbol: string;
    thesis?: string;
    risks?: string;
    expectedUpside?: string;
    reviewDate?: Date;
  }) {
    return this.db.insert(journalEntries).values({
      id: generateId(15),
      userId,
      symbol: data.symbol.toUpperCase(),
      thesis: data.thesis,
      risks: data.risks,
      expectedUpside: data.expectedUpside,
      reviewDate: data.reviewDate,
      createdAt: new Date(),
    });
  }

  async deleteEntry(userId: string, id: string) {
    return this.db
      .delete(journalEntries)
      .where(
        and(
          eq(journalEntries.id, id),
          eq(journalEntries.userId, userId)
        )
      );
  }
}
