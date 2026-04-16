"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { SheetSummary, stripHtml } from "@/lib/sefaria";

type SortField = "date" | "name";
type SortDir = "asc" | "desc";

function getCategoryFromTitle(title: string): string {
  const cleanedTitle = stripHtml(title).trim();
  const parts = cleanedTitle.split("/");

  if (parts.length !== 2) return "";

  return parts[0].trim();
}

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function SheetCard({ sheet, username }: { sheet: SheetSummary; username: string }) {
  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:border-blue-400 hover:shadow-sm transition-all">
      <Link href={`/sheets/${sheet.id}?from=${encodeURIComponent(username)}`} className="block">
        <h2
          className="text-lg font-semibold text-blue-700 hover:text-blue-900 mb-1"
          dangerouslySetInnerHTML={{ __html: sheet.title || "Untitled" }}
        />
      </Link>
      {sheet.summary && (
        <p
          className="text-sm text-gray-600 mb-2 line-clamp-2"
          dangerouslySetInnerHTML={{ __html: sheet.summary }}
        />
      )}
      <div className="flex flex-wrap gap-2 items-center mt-2">
        {sheet.topics?.filter((topic) => topic.title?.en).slice(0, 3).map((topic) => (
          <span
            key={topic.slug}
            className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full"
          >
            {topic.title?.en}
          </span>
        ))}
        {sheet.tags?.slice(0, 3).map((tag) => (
          <span
            key={tag}
            className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full"
          >
            {tag}
          </span>
        ))}
      </div>
      <div className="flex gap-4 mt-2 text-xs text-gray-400">
        <span>{formatDate(sheet.updated || sheet.created)}</span>
        <span>{sheet.views ?? 0} views</span>
      </div>
    </div>
  );
}

interface SheetListControlsProps {
  sheets: SheetSummary[];
  username: string;
}

export default function SheetListControls({ sheets, username }: SheetListControlsProps) {
  const [query, setQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const sheet of sheets) {
      const category = getCategoryFromTitle(sheet.title || "");
      if (category) {
        counts.set(category, (counts.get(category) ?? 0) + 1);
      }
    }
    return Array.from(counts.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [sheets]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const result = sheets.filter((s) => {
      const matchesCategory = selectedCategory
        ? getCategoryFromTitle(s.title || "") === selectedCategory
        : true;

      if (!matchesCategory) return false;

      if (!q) return true;

      const title = stripHtml(s.title || "").toLowerCase();
      const summary = stripHtml(s.summary || "").toLowerCase();
      const tags = (s.tags ?? []).join(" ").toLowerCase();
      const topics = (s.topics ?? [])
        .map((t) => t.title?.en ?? "")
        .join(" ")
        .toLowerCase();
      return (
        title.includes(q) ||
        summary.includes(q) ||
        tags.includes(q) ||
        topics.includes(q)
      );
    });

    result.sort((a, b) => {
      let cmp = 0;
      if (sortField === "name") {
        const titleA = stripHtml(a.title || "").toLowerCase();
        const titleB = stripHtml(b.title || "").toLowerCase();
        cmp = titleA.localeCompare(titleB);
      } else {
        // date
        cmp =
          new Date(a.updated || a.created).getTime() -
          new Date(b.updated || b.created).getTime();
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return result;
  }, [sheets, query, sortField, sortDir, selectedCategory]);

  function toggleDir() {
    setSortDir((d) => (d === "asc" ? "desc" : "asc"));
  }

  return (
    <>
      {/* Controls */}
      <div className="flex flex-wrap gap-3 items-center mb-4">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search sheets…"
          className="flex-1 min-w-48 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
          aria-label="Search sheets"
        />
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <span>Sort by:</span>
          <button
            onClick={() => setSortField("date")}
            className={`px-2 py-1 rounded ${
              sortField === "date"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Date
          </button>
          <button
            onClick={() => setSortField("name")}
            className={`px-2 py-1 rounded ${
              sortField === "name"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Name
          </button>
          <button
            onClick={toggleDir}
            className="px-2 py-1 rounded bg-gray-100 text-gray-600 hover:bg-gray-200"
            aria-label={sortDir === "asc" ? "Sort ascending" : "Sort descending"}
          >
            {sortDir === "asc" ? "↑ Asc" : "↓ Desc"}
          </button>
        </div>
      </div>

      {categoryCounts.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between gap-2 mb-2">
            <p className="text-xs text-gray-500">Filter by category</p>
            {selectedCategory && (
              <button
                onClick={() => setSelectedCategory(null)}
                className="text-xs text-blue-600 hover:underline"
              >
                Clear filter
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {categoryCounts.map(([category, count]) => (
              <button
                key={category}
                onClick={() =>
                  setSelectedCategory((current) =>
                    current === category ? null : category
                  )
                }
                className={`text-xs px-2.5 py-1 rounded-full border ${
                  selectedCategory === category
                    ? "bg-blue-600 border-blue-600 text-white"
                    : "bg-white border-gray-200 text-gray-700 hover:border-blue-300 hover:text-blue-700"
                }`}
                aria-pressed={selectedCategory === category}
              >
                {category}
                <span className="ml-1 opacity-70">({count})</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      <p className="text-sm text-gray-500 mb-3">
        {filtered.length} sheet{filtered.length !== 1 ? "s" : ""}
        {query && ` matching "${query}"`}
        {selectedCategory && ` in ${selectedCategory}`}
      </p>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-lg">No sheets found</p>
          {query && (
            <button
              onClick={() => setQuery("")}
              className="mt-2 text-sm text-blue-500 hover:underline"
            >
              Clear search
            </button>
          )}
          {selectedCategory && (
            <button
              onClick={() => setSelectedCategory(null)}
              className="mt-2 ml-3 text-sm text-blue-500 hover:underline"
            >
              Clear category filter
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((sheet) => (
            <SheetCard key={sheet.id} sheet={sheet} username={username} />
          ))}
        </div>
      )}
    </>
  );
}
