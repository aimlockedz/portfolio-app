import { TASignals } from "@/core/ta/signals";

export const runtime = "edge";

export async function POST(request: Request) {
  try {
    const { prices } = await request.json() as { prices: number[] };
    
    if (!prices || !Array.isArray(prices) || prices.length < 2) {
      return new Response("Valid price array required", { status: 400 });
    }

    const signal = TASignals.generateSignal(prices);

    return new Response(JSON.stringify(signal), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response("Internal Server Error", { status: 500 });
  }
}
