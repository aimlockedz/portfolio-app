import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getDb } from "@/db/db";
import { initializeLucia } from "@/lib/auth";
import { JournalRepository } from "@/db/repositories/journal";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AddJournalEntryDialog } from "@/components/shared/add-journal-entry-dialog";
import { Trash2, Calendar, TrendingUp, AlertTriangle } from "lucide-react";
import { DeleteJournalEntryButton } from "@/components/shared/delete-journal-entry-button";



export default async function JournalPage() {
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

  const journalRepo = new JournalRepository(db);
  const entries = await journalRepo.getEntries(user.id);

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Investment Journal</h1>
          <p className="text-muted-foreground mt-1">Record your decisions, theses, and risks.</p>
        </div>
        <AddJournalEntryDialog />
      </div>

      <div className="grid gap-6">
        {entries.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <h3 className="text-lg font-medium text-muted-foreground">No journal entries yet.</h3>
            <p className="text-sm text-muted-foreground">Start by documenting your first investment thesis.</p>
          </div>
        ) : (
          entries.map((entry) => (
            <Card key={entry.id}>
              <CardHeader className="flex flex-row items-start justify-between space-y-0">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-2xl font-bold">{entry.symbol}</CardTitle>
                    <Badge variant="outline">Journal Entry</Badge>
                  </div>
                  <CardDescription className="flex items-center gap-2">
                    <Calendar className="h-3 w-3" />
                    Created: {entry.createdAt.toLocaleDateString()}
                  </CardDescription>
                </div>
                <DeleteJournalEntryButton id={entry.id} />
              </CardHeader>
              <CardContent className="grid gap-6 md:grid-cols-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 font-semibold text-sm">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    Investment Thesis
                  </div>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{entry.thesis || "No thesis documented."}</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 font-semibold text-sm">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                    Risks & Concerns
                  </div>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{entry.risks || "No risks documented."}</p>
                </div>
                <div className="space-y-4">
                  <div>
                    <div className="font-semibold text-sm mb-1">Expected Upside</div>
                    <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20 border-green-500/20">
                      {entry.expectedUpside || "Not defined"}
                    </Badge>
                  </div>
                  {entry.reviewDate && (
                    <div>
                      <div className="font-semibold text-sm mb-1">Next Review</div>
                      <p className="text-sm text-muted-foreground">{entry.reviewDate.toLocaleDateString()}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
