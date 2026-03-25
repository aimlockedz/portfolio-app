"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

export function PlannerForm({ watchlistItems }: { watchlistItems: any[] }) {
  const [capital, setCapital] = useState("1000");
  const [style, setStyle] = useState("Balanced");
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  async function handlePlan(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    
    // We will build this API route
    const res = await fetch("/api/allocation/calculate", {
      method: "POST",
      body: JSON.stringify({ capital: parseFloat(capital), style }),
      headers: { "Content-Type": "application/json" },
    });
    
    if (res.ok) {
      const data = await res.json();
      setRecommendations(data.recommendations);
    }
    setLoading(false);
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Planner Configuration</CardTitle>
          <CardDescription>
            Configure your investment style and available capital.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handlePlan}>
          <CardContent className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="capital">Available Capital (USD)</Label>
              <Input 
                id="capital" 
                type="number" 
                value={capital} 
                onChange={(e) => setCapital(e.target.value)} 
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="style">Investment Style</Label>
              <Select value={style} onValueChange={setStyle}>
                <SelectTrigger>
                  <SelectValue placeholder="Select style" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Aggressive">Aggressive Growth</SelectItem>
                  <SelectItem value="Balanced">Balanced</SelectItem>
                  <SelectItem value="Defensive">Defensive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={loading || watchlistItems.length === 0}>
              {loading ? "Calculating..." : "Generate Allocation Plan"}
            </Button>
          </CardFooter>
        </form>
      </Card>

      {recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recommended Allocation</CardTitle>
            <CardDescription>
              Based on your {style} style and watchlist scores.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Symbol</TableHead>
                  <TableHead>Weight</TableHead>
                  <TableHead className="text-right">Score</TableHead>
                  <TableHead className="text-right">Buy Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recommendations.map((rec) => (
                  <TableRow key={rec.symbol}>
                    <TableCell className="font-bold">{rec.symbol}</TableCell>
                    <TableCell className="min-w-[200px]">
                      <div className="flex items-center gap-2">
                        <Progress value={rec.weight * 100} className="h-2" />
                        <span className="text-xs font-medium">{(rec.weight * 100).toFixed(0)}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="outline">{rec.score}/10</Badge>
                    </TableCell>
                    <TableCell className="text-right font-bold text-primary">
                      ${(rec.amount / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
