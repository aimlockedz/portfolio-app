# StockPortfolio - Cloudflare Native Investment App

A premium, edge-optimized personal investment control tower built for the Cloudflare Free Plan.

## 🚀 Deployment Instructions (Cloudflare)

### 1. Prerequisites
- Vercel+Turso
- [Node.js installed](https://nodejs.org)

### 2. Setup Database (D1)
Run these commands in your terminal:
```bash
# Create the database
npx wrangler d1 create portfolio-db

# Apply migrations to the remote database
npx wrangler d1 migrations apply portfolio-db --remote

# Optional: Seed initial stock scores
npx wrangler d1 execute portfolio-db --file=./migrations/seed.sql --remote
```

### 3. Deploy to Cloudflare Pages
```bash
# Build the project
npm run build

# Deploy
npx wrangler pages deploy .next
```

## 🛠 local Development
```bash
# Apply migrations locally
npx wrangler d1 migrations apply portfolio-db --local

# Start dev server
npm run dev
```

## ✨ Key Features
- **Smart Allocation:** Recommends buys based on your risk profile.
- **Technical Analysis:** Auto-calculates Fibonacci zones and RSI signals.
- **Investment Journal:** Track your thesis and reflections.
- **Portfolio Tracking:** Average cost and real-time allocation views.
- **Market News:** Daily US macro and tech intelligence feed.

## 🔒 Security
- All routes run on **Cloudflare Workers (Edge)**.
- Secure session handling via **Lucia Auth**.
- Password hashing using **BcryptJS** (JS-only, edge-compatible).
