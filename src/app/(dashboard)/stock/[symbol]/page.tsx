import { StockDetailClient } from "@/components/shared/stock-detail-client";

export const dynamic = "force-dynamic";

export default async function StockDetailPage({
  params,
}: {
  params: Promise<{ symbol: string }>;
}) {
  const { symbol } = await params;
  return <StockDetailClient symbol={symbol.toUpperCase()} />;
}
