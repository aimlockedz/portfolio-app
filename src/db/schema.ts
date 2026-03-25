import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

// --- Authentication ---

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  hashedPassword: text("password_hash").notNull(),
  displayName: text("display_name").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  expiresAt: integer("expires_at").notNull(),
});

// --- Profiles & Settings ---

export const profiles = sqliteTable("profiles", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  preferredCurrency: text("preferred_currency").notNull().default("USD"),
  riskProfile: text("risk_profile").notNull().default("Balanced"),
  investmentStyle: text("investment_style").notNull().default("Growth"),
  theme: text("theme").notNull().default("dark"),
  bio: text("bio"),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

// --- Portfolio & Transactions ---

export const portfolioHoldings = sqliteTable("portfolio_holdings", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  symbol: text("symbol").notNull(),
  averageCost: integer("average_cost").notNull(), // stored in cents/smallest unit
  totalQuantity: integer("total_quantity").notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const transactions = sqliteTable("transactions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  symbol: text("symbol").notNull(),
  type: text("type").notNull(), // 'BUY' | 'SELL'
  quantity: integer("quantity").notNull(),
  price: integer("price").notNull(), // stored in cents
  currency: text("currency").notNull().default("USD"),
  fxRate: integer("fx_rate").notNull().default(1000000), // stored as integer (rate * 1,000,000)
  date: integer("date", { mode: "timestamp" }).notNull(),
  brokerFee: integer("broker_fee").notNull().default(0),
  notes: text("notes"),
});

// --- Watchlist ---

export const watchlistItems = sqliteTable("watchlist_items", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  symbol: text("symbol").notNull(),
  convictionLevel: integer("conviction_level").notNull().default(3), // 1-5
  notes: text("notes"),
  addedAt: integer("added_at", { mode: "timestamp" }).notNull(),
});

// --- Journal ---

export const journalEntries = sqliteTable("journal_entries", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  symbol: text("symbol").notNull(),
  thesis: text("thesis"),
  risks: text("risks"),
  expectedUpside: text("expected_upside"),
  reviewDate: integer("review_date", { mode: "timestamp" }),
  decisionHistory: text("decision_history"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

// --- Intelligence & News ---

export const newsArticles = sqliteTable("news_articles", {
  id: text("id").primaryKey(),
  headline: text("headline").notNull(),
  source: text("source").notNull(),
  publishedDate: integer("published_date", { mode: "timestamp" }).notNull(),
  summary: text("summary").notNull(),
  category: text("category").notNull(),
  url: text("url"),
});

export const stockScores = sqliteTable("stock_scores", {
  id: text("id").primaryKey(),
  symbol: text("symbol").notNull().unique(),
  growthScore: integer("growth_score").notNull(),
  valuationScore: integer("valuation_score").notNull(),
  momentumScore: integer("momentum_score").notNull(),
  riskScore: integer("risk_score").notNull(),
  sentimentScore: integer("sentiment_score").notNull(),
  totalScore: integer("total_score").notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});
