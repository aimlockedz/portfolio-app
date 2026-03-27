"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast-provider";

export function DeleteJournalEntryButton({ id }: { id: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { confirm, success: toastSuccess, error: toastError } = useToast();

  async function handleDelete() {
    const ok = await confirm({
      title: "Delete Journal Entry",
      message: "Are you sure you want to delete this journal entry? This cannot be undone.",
      confirmText: "Delete",
      cancelText: "Cancel",
      variant: "danger",
      icon: "trash",
    });
    if (!ok) return;

    setLoading(true);
    const response = await fetch(`/api/journal/${id}`, {
      method: "DELETE",
    });

    if (response.ok) {
      toastSuccess("Deleted", "Journal entry has been deleted.");
      router.refresh();
    } else {
      toastError("Failed", "Could not delete entry.");
      setLoading(false);
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleDelete}
      disabled={loading}
      className="text-destructive hover:text-destructive hover:bg-destructive/10"
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  );
}
