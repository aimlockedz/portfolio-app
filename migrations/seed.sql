-- Seed Data for StockPortfolio App

-- Note: user_id should be replaced with a real ID after you register your first user
-- This is a template for manual execution via wrangler d1 execute

INSERT INTO stock_scores (id, symbol, growth_score, valuation_score, momentum_score, risk_score, sentiment_score, total_score, updated_at)
VALUES 
('s1', 'AAPL', 7, 6, 8, 4, 8, 7, CURRENT_TIMESTAMP),
('s2', 'NVDA', 10, 4, 10, 7, 9, 8, CURRENT_TIMESTAMP),
('s3', 'TSLA', 8, 3, 7, 8, 6, 6, CURRENT_TIMESTAMP),
('s4', 'MSFT', 8, 6, 8, 3, 8, 7, CURRENT_TIMESTAMP),
('s5', 'GOOGL', 7, 7, 6, 4, 7, 6, CURRENT_TIMESTAMP);

INSERT INTO news_articles (id, headline, source, published_date, summary, category)
VALUES 
('n1', 'Tech Sector Rebounds as Inflation Fear Subsides', 'MarketWatch', CURRENT_TIMESTAMP, 'Growth stocks led the market higher today as latest CPI data suggested a cooling economy.', 'US Market'),
('n2', 'NVIDIA GPU Demand Remains Unprecedented', 'TechCrunch', CURRENT_TIMESTAMP, 'Supply chain checks indicate that AI infrastructure spending is still in the early innings.', 'Tech');
