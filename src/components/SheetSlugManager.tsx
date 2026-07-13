"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

interface SheetSlugManagerProps {
  username: string;
  sheetId: number;
  initialSlug?: string;
}

export default function SheetSlugManager({
  username,
  sheetId,
  initialSlug,
}: SheetSlugManagerProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [slug, setSlug] = useState(initialSlug ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<"auto" | "save" | null>(null);

  const permalink = useMemo(() => {
    if (!slug) return null;
    return `/${username}/${slug}`;
  }, [slug, username]);

  async function save(mode: "auto" | "save") {
    setError(null);
    setMessage(null);
    setLoading(mode);
    try {
      const res = await fetch("/api/import/slug", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          sheetId,
          mode: mode === "auto" ? "auto" : "set",
          slug,
        }),
      });
      const data = (await res.json()) as { error?: string; slug?: string; permalink?: string };
      if (!res.ok) {
        setError(data.error ?? "Failed to save permalink slug");
        return;
      }

      if (data.slug) setSlug(data.slug);
      setMessage(`Permalink saved: ${data.permalink}`);

      if (data.permalink) {
        const params = new URLSearchParams(window.location.search);
        params.delete("from");
        const query = params.toString();
        const nextUrl = query ? `${data.permalink}?${query}` : data.permalink;
        router.replace(nextUrl);
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setLoading(null);
    }
  }

  async function copyPermalink() {
    if (!permalink) return;
    try {
      await navigator.clipboard.writeText(window.location.origin + permalink);
      setMessage(`Copied: ${window.location.origin}${permalink}`);
    } catch {
      setError("Could not copy permalink to clipboard.");
    }
  }

  return (
    <div className="no-print">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-blue-600 hover:underline"
      >
        Permalink
      </button>

      {open && (
        <div className="basis-full w-full mt-3 p-3 rounded-lg border border-blue-200 bg-blue-50">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-xs text-blue-700 hover:underline"
            >
              Close
            </button>
          </div>

          <p className="text-sm font-medium text-blue-900">Permalink slug (owner only)</p>
          <p className="text-xs text-blue-800 mt-1">
            ID route remains valid. Save a slug to enable the pretty URL under your user tag.
          </p>

          <div className="mt-2 flex flex-wrap gap-2 items-center">
            <input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="e.g. szuka-maamid"
              className="px-3 py-1.5 border border-blue-300 rounded bg-white text-sm min-w-56"
            />
            <button
              onClick={() => save("auto")}
              disabled={loading !== null}
              className="px-3 py-1.5 text-sm rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {loading === "auto" ? "Generating..." : "Save automatic slug"}
            </button>
            <button
              onClick={() => save("save")}
              disabled={loading !== null || !slug.trim()}
              className="px-3 py-1.5 text-sm rounded bg-blue-800 text-white hover:bg-blue-900 disabled:opacity-60"
            >
              {loading === "save" ? "Saving..." : "Save custom slug"}
            </button>
            {permalink && (
              <button
                onClick={copyPermalink}
                className="px-3 py-1.5 text-sm rounded bg-white border border-blue-300 text-blue-700 hover:bg-blue-100"
              >
                Copy permalink
              </button>
            )}
          </div>

          {permalink && <p className="text-xs text-blue-700 mt-2">Current permalink: {permalink}</p>}
          {message && <p className="text-xs text-green-700 mt-2">{message}</p>}
          {error && <p className="text-xs text-red-700 mt-2">{error}</p>}
        </div>
      )}
    </div>
  );
}
