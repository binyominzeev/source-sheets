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

export default function TableOfContents({ entries }: TableOfContentsProps) {
  const [collapsed, setCollapsed] = useState(false);

  if (entries.length === 0) return null;

  return (
    <aside
      className="toc-box bg-gray-50 border border-gray-200 rounded text-xs w-52 shrink-0"
      aria-label="Table of Contents"
    >
      <div className="flex items-center justify-between px-2 py-1.5 border-b border-gray-200 bg-gray-100 rounded-t">
        <span className="font-semibold text-gray-700 text-xs">Contents</span>
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="text-gray-400 hover:text-gray-600 text-xs ml-2"
          aria-label={collapsed ? "Expand contents" : "Collapse contents"}
        >
          [{collapsed ? "show" : "hide"}]
        </button>
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
