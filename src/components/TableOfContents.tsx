"use client";

import { useState } from "react";

export interface TocEntry {
  id: string;
  label: string;
  level: number; // 1 = section title, 2 = source ref
  /** When set, the TOC entry links to this external URL instead of the page anchor. */
  href?: string;
}

interface TableOfContentsProps {
  sourceEntries: TocEntry[];
  outsideTextEntries?: TocEntry[];
}

export default function TableOfContents({
  sourceEntries,
  outsideTextEntries = [],
}: TableOfContentsProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mode, setMode] = useState<"sources" | "outsideText">("sources");

  const hasSources = sourceEntries.length > 0;
  const hasOutsideText = outsideTextEntries.length > 0;
  const activeEntries = mode === "outsideText" ? outsideTextEntries : sourceEntries;

  if (!hasSources && !hasOutsideText) return null;

  const modeSwitcher = (
    <div className="flex items-center gap-1">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setMode("sources");
        }}
        className={`px-2 py-0.5 rounded text-xs ${
          mode === "sources"
            ? "bg-blue-600 text-white"
            : "bg-white border border-gray-300 text-gray-600 hover:bg-gray-50"
        }`}
      >
        Sources
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setMode("outsideText");
        }}
        className={`px-2 py-0.5 rounded text-xs ${
          mode === "outsideText"
            ? "bg-blue-600 text-white"
            : "bg-white border border-gray-300 text-gray-600 hover:bg-gray-50"
        }`}
      >
        Comments
      </button>
    </div>
  );

  const entryList = (
    <ol className="list-none">
      {activeEntries.map((entry, idx) => (
        <li key={entry.id}>
          <a
            href={entry.href ?? `#${entry.id}`}
            {...(entry.href
              ? { target: "_blank", rel: "noopener noreferrer" }
              : {})}
            className={
              entry.level === 1
                ? "block px-2 py-0.5 text-blue-700 hover:text-blue-900 hover:bg-blue-50 font-medium"
                : "block pl-4 pr-2 py-0.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
            }
          >
            <span className="text-gray-400 mr-1">{idx + 1}.</span>
            {entry.label}
          </a>
        </li>
      ))}
    </ol>
  );

  return (
    <>
      {/* ── Mobile / tablet layout (hidden on lg+) ────────────────────── */}
      <div className="lg:hidden border border-gray-200 rounded-lg overflow-hidden text-xs">
        {/* Header row: toggle + TOC mode switch */}
        <div
          className="bg-gray-50 px-3 py-2 cursor-pointer select-none"
          onClick={() => setMobileOpen((o) => !o)}
          aria-expanded={mobileOpen}
        >
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-700">
              {mobileOpen ? "▾" : "▸"} Contents ({activeEntries.length} items)
            </span>
            {modeSwitcher}
          </div>
        </div>

        {mobileOpen && (
          <nav className="py-1 bg-white">
            {entryList}
          </nav>
        )}
      </div>

      {/* ── Desktop layout (hidden below lg) ─────────────────────────── */}
      <aside
        className="hidden lg:block toc-box bg-gray-50 border border-gray-200 rounded text-xs w-52 shrink-0"
        aria-label="Table of Contents"
      >
        <div className="flex items-center justify-between px-2 py-1.5 border-b border-gray-200 bg-gray-100 rounded-t">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-700 text-xs">Contents</span>
            {modeSwitcher}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCollapsed((c) => !c)}
              className="text-gray-400 hover:text-gray-600 text-xs ml-1"
              aria-label={collapsed ? "Expand contents" : "Collapse contents"}
            >
              [{collapsed ? "show" : "hide"}]
            </button>
          </div>
        </div>

        {!collapsed && (
          <nav className="py-1">
            {entryList}
          </nav>
        )}
      </aside>
    </>
  );
}
