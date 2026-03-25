import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getDb } from "@/db/db";
import { initializeLucia } from "@/lib/auth";
import { WatchlistRepository } from "@/db/repositories/watchlist";
import { PlannerForm } from "@/components/shared/planner-form";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const runtime = "edge";

export default async function PlannerPage() {
  const db = getDb();
  const lucia = initializeLucia(db);
  
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(lucia.sessionCookieName)?.value ?? null;
  if (!sessionId) {
    return redirect("/login");
  }

  const { user } = await lucia.validateSession(sessionId);
  if (!user) {
    return redirect("/login");
  }

  const watchlistRepo = new WatchlistRepository(db);
  const watchlistItems = await watchlistRepo.getItems(user.id);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Smart Allocation Planner</h1>
        <p className="text-muted-foreground mt-2">
          Enter your available capital and investment style to get a personalized stock allocation plan.
        </p>
      </div>

      <PlannerForm watchlistItems={watchlistItems} />
      
      {watchlistItems.length === 0 && (
        <div className="mt-8 p-12 border-2 border-dashed rounded-lg text-center">
          <h3 className="text-lg font-medium">Your watchlist is empty</h3>
          <p className="text-muted-foreground mt-1">Add some stocks to your watchlist first to generate a plan.</p>
          <Link href="/watchlist">
            <Button variant="outline" className="mt-4">
              Go to Watchlist
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
