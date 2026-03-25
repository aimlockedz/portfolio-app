import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getDb } from "@/db/db";
import { initializeLucia } from "@/lib/auth";
import { ProfileRepository } from "@/db/repositories/profile";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";

export const runtime = "edge";

export default async function SettingsPage() {
  const db = getDb((globalThis as any).process.env as any);
  const lucia = initializeLucia(db);
  
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(lucia.sessionCookieName)?.value ?? null;
  if (!sessionId) return redirect("/login");

  const { user } = await lucia.validateSession(sessionId);
  if (!user) return redirect("/login");

  const profileRepo = new ProfileRepository(db);
  const profile = await profileRepo.getProfile(user.id);

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-8 flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Settings className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">App Settings</h1>
          <p className="text-muted-foreground mt-1">Configure your portfolio preferences.</p>
        </div>
      </div>

      <form action="/api/settings" method="POST">
        <Card>
          <CardHeader>
            <CardTitle>Investment Preferences</CardTitle>
            <CardDescription>
              These settings affect your allocation planner and dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Preferred Currency</Label>
              <Select name="preferredCurrency" defaultValue={profile?.preferredCurrency || "USD"}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD - US Dollar</SelectItem>
                  <SelectItem value="THB">THB - Thai Baht</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Risk Profile</Label>
              <Select name="riskProfile" defaultValue={profile?.riskProfile || "Balanced"}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Conservative">Conservative</SelectItem>
                  <SelectItem value="Balanced">Balanced</SelectItem>
                  <SelectItem value="Aggressive">Aggressive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Default Allocation Style</Label>
              <Select name="investmentStyle" defaultValue={profile?.investmentStyle || "Growth"}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Growth">Growth</SelectItem>
                  <SelectItem value="Value">Value</SelectItem>
                  <SelectItem value="Dividend">Dividend</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full">Save Settings</Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
