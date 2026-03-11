"use client";

import { useState, useRef } from "react";

interface ImportResult {
  imported: Array<{ id: number; title: string }>;
  duplicates: number[];
  errors: Array<{ input: string; message: string }>;
}

interface ImportSheetsDialogProps {
  username: string;
  onSuccess?: () => void;
}

export default function ImportSheetsDialog({
  username,
  onSuccess,
}: ImportSheetsDialogProps) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function openDialog() {
    setOpen(true);
    setInput("");
    setResult(null);
    setError(null);
  }

  function closeDialog() {
    setOpen(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);

    const lines = input
      .split(/[\n,]+/)
      .map((l) => l.trim())
      .filter(Boolean);

    if (lines.length === 0) {
      setError("Please enter at least one URL or sheet ID.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls: lines, username }),
      });
      const data = (await res.json()) as ImportResult & { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Import failed");
        return;
      }
      setResult(data);
      if (data.imported.length > 0 && onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={openDialog}
        className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        + Import Sheets
      </button>

      {open && (
        /* Backdrop */
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeDialog();
          }}
        >
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg flex flex-col gap-4 p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Import Source Sheets</h2>
              <button
                onClick={closeDialog}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <p className="text-sm text-gray-600">
              Enter one or more Sefaria sheet URLs or numeric sheet IDs — one per line,
              or comma-separated. Private / unlisted sheets are supported as long as you
              have the direct link.
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                rows={5}
                placeholder={
                  "https://voices.sefaria.org/sheets/12345\nhttps://voices.sefaria.org/sheets/67890"
                }
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 resize-y font-mono"
                disabled={loading}
              />

              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
                  {error}
                </p>
              )}

              {result && (
                <div className="text-sm space-y-1">
                  {result.imported.length > 0 && (
                    <p className="text-green-700 bg-green-50 border border-green-200 rounded px-3 py-2">
                      ✓ Imported {result.imported.length} sheet
                      {result.imported.length !== 1 ? "s" : ""}:{" "}
                      {result.imported.map((s) => s.title).join(", ")}
                    </p>
                  )}
                  {result.duplicates.length > 0 && (
                    <p className="text-yellow-700 bg-yellow-50 border border-yellow-200 rounded px-3 py-2">
                      ⚠ {result.duplicates.length} sheet
                      {result.duplicates.length !== 1 ? "s were" : " was"} already in
                      the list (IDs: {result.duplicates.join(", ")}).
                    </p>
                  )}
                  {result.errors.length > 0 && (
                    <div className="text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2 space-y-0.5">
                      {result.errors.map((err, i) => (
                        <p key={i}>
                          ✗ <span className="font-mono text-xs">{err.input}</span>:{" "}
                          {err.message}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={closeDialog}
                  className="px-4 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg"
                >
                  {result ? "Close" : "Cancel"}
                </button>
                {!result && (
                  <button
                    type="submit"
                    disabled={loading || !input.trim()}
                    className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition-colors"
                  >
                    {loading ? "Importing…" : "Import"}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
