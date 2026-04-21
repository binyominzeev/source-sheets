"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { revalidateSheet } from "@/lib/actions";

interface SheetRefreshButtonProps {
  sheetId: string;
  from?: string;
}

export default function SheetRefreshButton({ sheetId, from }: SheetRefreshButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleRefresh() {
    startTransition(async () => {
      await revalidateSheet(sheetId, from);
      router.refresh();
    });
  }

  return (
    <button
      onClick={handleRefresh}
      disabled={isPending}
      aria-busy={isPending}
      aria-label={isPending ? "Refreshing sheet…" : "Refresh sheet from Sefaria"}
      className="text-xs text-gray-400 hover:text-gray-600 disabled:opacity-50 flex items-center gap-1"
      title="Reload sheet sources from Sefaria"
    >
      <span className={isPending ? "animate-spin inline-block" : ""}>↻</span>
      {isPending ? "Refreshing…" : "Refresh"}
    </button>
  );
}
