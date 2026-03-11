"use client";

import { useState } from "react";

export interface TocEntry {
  id: string;
  label: string;
  level: number; // 1 = section title, 2 = source ref
}

interface TableOfContentsProps {
  entries: TocEntry[];
}

const FONT_SIZES = [75, 85, 100, 115, 130];
const DEFAULT_FONT_SIZE_INDEX = 2; // index into FONT_SIZES for 100%

export default function TableOfContents({ entries }: TableOfContentsProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [fontSizeIdx, setFontSizeIdx] = useState(DEFAULT_FONT_SIZE_INDEX);

  function changeFontSize(delta: number) {
    const next = Math.max(0, Math.min(FONT_SIZES.length - 1, fontSizeIdx + delta));
    setFontSizeIdx(next);
    document.documentElement.style.setProperty(
      "--sheet-font-size",
      `${FONT_SIZES[next]}%`
    );
  }

  if (entries.length === 0) return null;

  return (
    <aside
      className="toc-box bg-gray-50 border border-gray-200 rounded text-xs w-52 shrink-0"
      aria-label="Table of Contents"
    >
      <div className="flex items-center justify-between px-2 py-1.5 border-b border-gray-200 bg-gray-100 rounded-t">
        <span className="font-semibold text-gray-700 text-xs">Contents</span>
        <div className="flex items-center gap-1">
          {/* Font size controls */}
          <button
            onClick={() => changeFontSize(-1)}
            disabled={fontSizeIdx === 0}
            className="text-gray-500 hover:text-gray-800 disabled:opacity-50 text-xs px-1 leading-none"
            aria-label="Decrease font size"
            title="Decrease font size"
          >
            A-
          </button>
          <button
            onClick={() => changeFontSize(1)}
            disabled={fontSizeIdx === FONT_SIZES.length - 1}
            className="text-gray-500 hover:text-gray-800 disabled:opacity-50 text-sm px-1 leading-none"
            aria-label="Increase font size"
            title="Increase font size"
          >
            A+
          </button>
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
          <ol className="list-none">
            {entries.map((entry, idx) => (
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
        </nav>
      )}
    </aside>
  );
}
