import { cookies } from "next/headers";
import { getDb } from "@/db/db";
import { initializeLucia } from "@/lib/auth";
import { PortfolioRepository } from "@/db/repositories/portfolio";

export const runtime = "edge";

export async function POST(request: Request) {
  const db = getDb();
  const lucia = initializeLucia(db);

  const cookieStore = await cookies();
  const sessionId = cookieStore.get(lucia.sessionCookieName)?.value ?? null;
  if (!sessionId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { user } = await lucia.validateSession(sessionId);
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const formData = await request.formData();
  const symbol = formData.get("symbol") as string;
  const type = formData.get("type") as 'BUY' | 'SELL';
  const quantity = parseFloat(formData.get("quantity") as string);
  const price = Math.round(parseFloat(formData.get("price") as string) * 100); // convert to cents
  const date = new Date(formData.get("date") as string);

  if (!symbol || !type || isNaN(quantity) || isNaN(price)) {
    return new Response("Invalid input", { status: 400 });
  }

  const portfolioRepo = new PortfolioRepository(db);

  try {
    await portfolioRepo.addTransaction(user.id, {
      symbol: symbol.toUpperCase(),
      type,
      quantity,
      price,
      currency: "USD", // Default to USD for now
      fxRate: 1000000, // 1:1
      date,
      brokerFee: 0,
    });

    return new Response(null, { status: 200 });
  } catch (e) {
    console.error(e);
    return new Response("Internal Server Error", { status: 500 });
  }
}
