"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast-provider";

export function DeleteWatchlistItemButton({ itemId }: { itemId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { confirm, success: toastSuccess, error: toastError } = useToast();

  async function handleDelete() {
    const ok = await confirm({
      title: "Remove from Watchlist",
      message: "Are you sure you want to remove this item from your watchlist?",
      confirmText: "Remove",
      cancelText: "Keep",
      variant: "danger",
      icon: "trash",
    });
    if (!ok) return;

    setLoading(true);
    const response = await fetch(`/api/watchlist/${itemId}`, {
      method: "DELETE",
    });

    if (response.ok) {
      toastSuccess("Removed", "Item removed from watchlist.");
      router.refresh();
    } else {
      toastError("Failed", "Could not remove item.");
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
