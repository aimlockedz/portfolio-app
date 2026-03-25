export type NewsCategory = 'US Market' | 'Macro' | 'Earnings' | 'Tech' | 'High Impact';

export interface NewsArticle {
  id: string;
  headline: string;
  source: string;
  publishedDate: Date;
  summary: string;
  category: NewsCategory;
  url?: string;
}

export interface NewsProvider {
  getLatestNews(limit?: number): Promise<NewsArticle[]>;
  getNewsByCategory(category: NewsCategory, limit?: number): Promise<NewsArticle[]>;
}
