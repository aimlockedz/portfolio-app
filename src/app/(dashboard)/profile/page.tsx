import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getDb } from "@/db/db";
import { initializeLucia } from "@/lib/auth";
import { ProfileRepository } from "@/db/repositories/profile";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { User } from "lucide-react";

export const runtime = "edge";

export default async function ProfilePage() {
  const db = getDb((globalThis as any).process.env as any);
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

  const profileRepo = new ProfileRepository(db);
  const profile = await profileRepo.getProfile(user.id);

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-8 flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <User className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Your Profile</h1>
          <p className="text-muted-foreground mt-1">Manage your public information.</p>
        </div>
      </div>

      <form action="/api/profile" method="POST">
        <Card>
          <CardHeader>
            <CardTitle>Profile Details</CardTitle>
            <CardDescription>
              This information will be displayed on your dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input id="displayName" name="displayName" defaultValue={user.displayName} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" value={user.email} disabled />
              <p className="text-xs text-muted-foreground italic">Email cannot be changed.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio">Bio / Investing Philosophy</Label>
              <Textarea id="bio" name="bio" defaultValue={profile?.bio || ""} placeholder="Tell us about your investing style..." rows={4} />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full">Save Changes</Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
