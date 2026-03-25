import { getDb } from "@/db/db";
import { profiles, users } from "@/db/schema";
import { eq } from "drizzle-orm";

export class ProfileRepository {
  constructor(private db: ReturnType<typeof getDb>) {}

  async getProfile(userId: string) {
    const [profile] = await this.db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, userId));
    return profile;
  }

  async updateProfile(userId: string, data: {
    bio?: string;
    preferredCurrency?: string;
    riskProfile?: string;
    investmentStyle?: string;
    theme?: string;
  }) {
    return this.db
      .update(profiles)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(profiles.userId, userId));
  }

  async updateDisplayName(userId: string, displayName: string) {
    return this.db
      .update(users)
      .set({ displayName })
      .where(eq(users.id, userId));
  }
}
