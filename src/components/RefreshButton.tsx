"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { revalidateUserSheets } from "@/lib/actions";

interface RefreshButtonProps {
  username: string;
}

export default function RefreshButton({ username }: RefreshButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleRefresh() {
    startTransition(async () => {
      await revalidateUserSheets(username);
      router.refresh();
    });
  }

  return (
    <button
      onClick={handleRefresh}
      disabled={isPending}
      aria-busy={isPending}
      aria-label={isPending ? "Refreshing sheet list…" : "Refresh sheet list from Sefaria"}
      className="text-xs text-gray-400 hover:text-gray-600 disabled:opacity-50 flex items-center gap-1"
      title="Reload sheet list from Sefaria"
    >
      <span className={isPending ? "animate-spin inline-block" : ""}>↻</span>
      {isPending ? "Refreshing…" : "Refresh"}
    </button>
  );
}
