/**
 * Edge-compatible in-memory sliding window rate limiter.
 * Each tier defines: max requests allowed within the window (in seconds).
 *
 * On Vercel Edge, the middleware instance persists across requests for a period,
 * making in-memory rate limiting partially effective. For full durability,
 * upgrade to @upstash/ratelimit with Upstash Redis.
 */

interface RateLimitEntry {
  timestamps: number[];
}

interface RateLimitTier {
  max: number;
  windowSec: number;
}

export const RATE_LIMIT_TIERS = {
  /** Auth endpoints: 5 requests per 15 minutes per IP */
  auth: { max: 5, windowSec: 15 * 60 } as RateLimitTier,
  /** AI/expensive endpoints: 10 requests per hour per IP */
  ai: { max: 10, windowSec: 60 * 60 } as RateLimitTier,
  /** Write operations: 30 requests per minute per IP */
  write: { max: 30, windowSec: 60 } as RateLimitTier,
  /** Public data reads: 60 requests per minute per IP */
  read: { max: 60, windowSec: 60 } as RateLimitTier,
} as const;

export type TierName = keyof typeof RATE_LIMIT_TIERS;

const stores = new Map<TierName, Map<string, RateLimitEntry>>();

// Initialise a store per tier
for (const tier of Object.keys(RATE_LIMIT_TIERS) as TierName[]) {
  stores.set(tier, new Map());
}

// Periodic cleanup to prevent memory growth (every 60s)
let lastCleanup = Date.now();
const CLEANUP_INTERVAL = 60_000;

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;

  for (const [tierName, store] of stores) {
    const windowMs = RATE_LIMIT_TIERS[tierName].windowSec * 1000;
    for (const [key, entry] of store) {
      entry.timestamps = entry.timestamps.filter((t) => now - t < windowMs);
      if (entry.timestamps.length === 0) store.delete(key);
    }
  }
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetSec: number;
}

export function rateLimit(tier: TierName, key: string): RateLimitResult {
  cleanup();

  const { max, windowSec } = RATE_LIMIT_TIERS[tier];
  const windowMs = windowSec * 1000;
  const now = Date.now();
  const store = stores.get(tier)!;

  let entry = store.get(key);
  if (!entry) {
    entry = { timestamps: [] };
    store.set(key, entry);
  }

  // Remove expired timestamps
  entry.timestamps = entry.timestamps.filter((t) => now - t < windowMs);

  const remaining = Math.max(0, max - entry.timestamps.length);
  const oldest = entry.timestamps[0] ?? now;
  const resetSec = Math.ceil((oldest + windowMs - now) / 1000);

  if (entry.timestamps.length >= max) {
    return { allowed: false, limit: max, remaining: 0, resetSec };
  }

  entry.timestamps.push(now);
  return { allowed: true, limit: max, remaining: remaining - 1, resetSec };
}
