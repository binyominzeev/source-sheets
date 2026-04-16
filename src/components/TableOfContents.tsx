"use client";

import { useState } from "react";
import {
  EN_FONT_SIZES,
  HE_FONT_SIZES,
  DEFAULT_EN_FONT_SIZE_INDEX,
  DEFAULT_HE_FONT_SIZE_INDEX,
} from "@/config/fontSizes";

export interface TocEntry {
  id: string;
  label: string;
  level: number; // 1 = section title, 2 = source ref
}

interface TableOfContentsProps {
  sourceEntries: TocEntry[];
  commentEntries?: TocEntry[];
}

function getInitialMode(
  sourceEntries: TocEntry[],
  commentEntries: TocEntry[]
): "sources" | "comments" {
  if (sourceEntries.length > 0) return "sources";
  if (commentEntries.length > 0) return "comments";
  return "sources";
}

export default function TableOfContents({
  sourceEntries,
  commentEntries = [],
}: TableOfContentsProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [enFontSizeIdx, setEnFontSizeIdx] = useState(DEFAULT_EN_FONT_SIZE_INDEX);
  const [heFontSizeIdx, setHeFontSizeIdx] = useState(DEFAULT_HE_FONT_SIZE_INDEX);
  const [mode, setMode] = useState<"sources" | "comments">(
    getInitialMode(sourceEntries, commentEntries)
  );

  function applyFontSizes(enIdx: number, heIdx: number) {
    const enPercent = EN_FONT_SIZES[enIdx];
    const hePercent = HE_FONT_SIZES[heIdx];
    document.documentElement.style.setProperty(
      "--sheet-font-size-en",
      `${enPercent}%`
    );
    // Hebrew zoom is expressed as a ratio relative to the English zoom so that
    // the two controls are visually independent (avoids CSS zoom compounding).
    // Guard against division by zero in case EN_FONT_SIZES is misconfigured.
    const heRatio = enPercent > 0 ? hePercent / enPercent : 1;
    document.documentElement.style.setProperty(
      "--sheet-font-size-he-ratio",
      String(heRatio)
    );
  }

  function changeEnFontSize(e: React.MouseEvent, delta: number) {
    e.stopPropagation();
    const next = Math.max(0, Math.min(EN_FONT_SIZES.length - 1, enFontSizeIdx + delta));
    setEnFontSizeIdx(next);
    applyFontSizes(next, heFontSizeIdx);
  }

  function changeHeFontSize(e: React.MouseEvent, delta: number) {
    e.stopPropagation();
    const next = Math.max(0, Math.min(HE_FONT_SIZES.length - 1, heFontSizeIdx + delta));
    setHeFontSizeIdx(next);
    applyFontSizes(enFontSizeIdx, next);
  }

  const hasSources = sourceEntries.length > 0;
  const hasComments = commentEntries.length > 0;
  const canSwitchModes = hasSources && hasComments;
  const activeEntries = mode === "comments" ? commentEntries : sourceEntries;

  if (!hasSources && !hasComments) return null;

  const fontControls = (
    <div className="flex items-center gap-1.5">
      <span className="text-gray-400 text-xs leading-none">En:</span>
      <button
        onClick={(e) => changeEnFontSize(e, -1)}
        disabled={enFontSizeIdx === 0}
        className="text-gray-500 hover:text-gray-800 disabled:opacity-30 text-xs px-1.5 py-0.5 rounded border border-gray-300 bg-white leading-none"
        aria-label="Decrease English font size"
        title="Decrease English font size"
      >
        A-
      </button>
      <button
        onClick={(e) => changeEnFontSize(e, 1)}
        disabled={enFontSizeIdx === EN_FONT_SIZES.length - 1}
        className="text-gray-500 hover:text-gray-800 disabled:opacity-30 text-sm px-1.5 py-0.5 rounded border border-gray-300 bg-white leading-none"
        aria-label="Increase English font size"
        title="Increase English font size"
      >
        A+
      </button>
      <span className="text-gray-400 text-xs leading-none">He:</span>
      <button
        onClick={(e) => changeHeFontSize(e, -1)}
        disabled={heFontSizeIdx === 0}
        className="text-gray-500 hover:text-gray-800 disabled:opacity-30 text-xs px-1.5 py-0.5 rounded border border-gray-300 bg-white leading-none"
        aria-label="Decrease Hebrew font size"
        title="Decrease Hebrew font size"
      >
        א-
      </button>
      <button
        onClick={(e) => changeHeFontSize(e, 1)}
        disabled={heFontSizeIdx === HE_FONT_SIZES.length - 1}
        className="text-gray-500 hover:text-gray-800 disabled:opacity-30 text-sm px-1.5 py-0.5 rounded border border-gray-300 bg-white leading-none"
        aria-label="Increase Hebrew font size"
        title="Increase Hebrew font size"
      >
        א+
      </button>
    </div>
  );

  const modeSwitcher = canSwitchModes && (
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
          setMode("comments");
        }}
        className={`px-2 py-0.5 rounded text-xs ${
          mode === "comments"
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
            href={`#${entry.id}`}
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
        {/* Header row: toggle + font size controls */}
        <div
          className="flex items-center justify-between bg-gray-50 px-3 py-2 cursor-pointer select-none"
          onClick={() => setMobileOpen((o) => !o)}
          aria-expanded={mobileOpen}
        >
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-700">
              {mobileOpen ? "▾" : "▸"} Contents ({activeEntries.length} items)
            </span>
            {modeSwitcher}
          </div>
          <div className="shrink-0">{fontControls}</div>
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
            {fontControls}
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
