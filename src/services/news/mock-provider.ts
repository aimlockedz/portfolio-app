import { NewsArticle, NewsCategory, NewsProvider } from "./contract";

export class MockNewsProvider implements NewsProvider {
  private articles: NewsArticle[] = [
    {
      id: "news-1",
      headline: "Fed Signals Potential Rate Cut Later This Year",
      source: "Economic Insights",
      publishedDate: new Date(),
      summary: "The Federal Reserve indicated it may consider reducing interest rates as inflation continues to cool toward its 2% target.",
      category: "Macro",
    },
    {
      id: "news-2",
      headline: "NVIDIA Hits New All-Time High on Continued AI Demand",
      source: "Tech Journal",
      publishedDate: new Date(),
      summary: "Shares of the semiconductor giant surged as analysts raised their price targets following strong data center demand.",
      category: "Tech",
    },
    {
      id: "news-3",
      headline: "CPI Data Shows Inflation Cooling Faster Than Expected",
      source: "Global Market Reporter",
      publishedDate: new Date(Date.now() - 3600000), // 1 hour ago
      summary: "Consumer price index rose by only 0.1% last month, providing hope for a soft landing for the US economy.",
      category: "High Impact",
    },
    {
      id: "news-4",
      headline: "Major Tech Earnings Expected to Shape Market Outlook",
      source: "Market Focus",
      publishedDate: new Date(Date.now() - 7200000), // 2 hours ago
      summary: "Microsoft and Google are set to report quarterly results, with investors focusing on cloud and AI segments.",
      category: "Earnings",
    },
    {
      id: "news-5",
      headline: "US Retail Sales Remain Resilient Amid Tight Monetary Policy",
      source: "Consumer Pulse",
      publishedDate: new Date(Date.now() - 10800000), // 3 hours ago
      summary: "American consumers spent more than anticipated, driven by strong wage growth and low unemployment.",
      category: "US Market",
    }
  ];

  async getLatestNews(limit: number = 5): Promise<NewsArticle[]> {
    return this.articles.slice(0, limit);
  }

  async getNewsByCategory(category: NewsCategory, limit: number = 5): Promise<NewsArticle[]> {
    return this.articles.filter(a => a.category === category).slice(0, limit);
  }
}
