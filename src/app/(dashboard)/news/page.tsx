import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MockNewsProvider } from "@/services/news/mock-provider";
import { Newspaper } from "lucide-react";



export default async function NewsPage() {
  const provider = new MockNewsProvider();
  const news = await provider.getLatestNews(10);

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Newspaper className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Market Intelligence News</h1>
          <p className="text-muted-foreground mt-1">
            Latest updates on US markets, macroeconomics, and tech trends.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {news.map((article) => (
          <Card key={article.id} className="hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="flex justify-between items-start gap-4 mb-2">
                <Badge variant="outline">{article.category}</Badge>
                <span className="text-xs text-muted-foreground">
                  {new Date(article.publishedDate).toLocaleDateString()}
                </span>
              </div>
              <CardTitle className="text-xl leading-tight">{article.headline}</CardTitle>
              <CardDescription>{article.source}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm line-clamp-3">
                {article.summary}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
