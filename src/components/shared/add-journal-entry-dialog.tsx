"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";

export function AddJournalEntryDialog() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    
    const response = await fetch("/api/journal", {
      method: "POST",
      body: formData,
    });

    if (response.ok) {
      setOpen(false);
      router.refresh();
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> New Journal Entry
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>New Investment Thesis</DialogTitle>
            <DialogDescription>
              Document your research and reasons for this investment.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="symbol" className="text-right">Symbol</Label>
              <Input id="symbol" name="symbol" placeholder="AAPL" className="col-span-3" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="thesis">Investment Thesis</Label>
              <Textarea id="thesis" name="thesis" placeholder="Why are you buying?" rows={3} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="risks">Risks & Concerns</Label>
              <Textarea id="risks" name="risks" placeholder="What could go wrong?" rows={2} />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="expectedUpside" className="text-right">Upside</Label>
              <Input id="expectedUpside" name="expectedUpside" placeholder="+20%" className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="reviewDate" className="text-right">Review Date</Label>
              <Input id="reviewDate" name="reviewDate" type="date" className="col-span-3" />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">Save Entry</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
