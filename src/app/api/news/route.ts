import { MockNewsProvider } from "@/services/news/mock-provider";

export const runtime = "edge";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") || "10");
  const category = searchParams.get("category");

  const provider = new MockNewsProvider();
  let news;

  if (category) {
    news = await provider.getNewsByCategory(category as any, limit);
  } else {
    news = await provider.getLatestNews(limit);
  }

  return new Response(JSON.stringify(news), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
