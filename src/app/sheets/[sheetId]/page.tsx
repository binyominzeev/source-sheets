import { Metadata } from "next";
import Link from "next/link";
import { getSheet, stripHtml } from "@/lib/sefaria";
import TableOfContents, { TocEntry } from "@/components/TableOfContents";
import SheetSourceItem from "@/components/SheetSourceItem";
import PrintButton from "@/components/PrintButton";
import SheetRefreshButton from "@/components/SheetRefreshButton";

interface Props {
  params: Promise<{ sheetId: string }>;
  searchParams: Promise<{ lang?: string; from?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { sheetId } = await params;
  try {
    const sheet = await getSheet(sheetId);
    return {
      title: `${stripHtml(sheet.title)} — Source Sheets`,
      description: sheet.summary ? stripHtml(sheet.summary) : undefined,
    };
  } catch {
    return { title: "Sheet — Source Sheets" };
  }
}

function buildAnchorId(index: number, ref?: string): string {
  if (ref) {
    return `src-${ref.replace(/[\s:,]/g, "-").replace(/[^a-zA-Z0-9-_]/g, "")}-${index}`;
  }
  return `src-${index}`;
}

const DEFAULT_OUTSIDE_TEXT_PREVIEW_LENGTH = 90;
const ELLIPSIS = "…";

function flattenSheetText(text: string | string[] | undefined): string {
  if (!text) return "";
  return Array.isArray(text) ? text.join(" ") : text;
}

function truncateOutsideText(outsideTextHtml: string): string {
  const plain = stripHtml(outsideTextHtml).replace(/\s+/g, " ").trim();
  if (plain.length <= DEFAULT_OUTSIDE_TEXT_PREVIEW_LENGTH) return plain;
  return `${plain.slice(0, DEFAULT_OUTSIDE_TEXT_PREVIEW_LENGTH - ELLIPSIS.length).trimEnd()}${ELLIPSIS}`;
}

function getOutsideTextHtml(source: {
  outsideText?: string;
  outsideBiText?: { en: string | string[]; he: string | string[] };
}): string {
  if (source.outsideText) return source.outsideText;
  if (!source.outsideBiText) return "";
  return `${flattenSheetText(source.outsideBiText.en)} ${flattenSheetText(source.outsideBiText.he)}`;
}

export default async function SheetPage({ params, searchParams }: Props) {
  const { sheetId } = await params;
  const { lang: langParam, from } = await searchParams;

  // Validate lang param: "en", "he", "bi"
  const lang: "en" | "he" | "bi" =
    langParam === "en" || langParam === "he" || langParam === "bi"
      ? langParam
      : "bi";

  let sheet = null;
  let error: string | null = null;

  try {
    sheet = await getSheet(sheetId);
  } catch (err) {
    error = err instanceof Error ? err.message : "Failed to load sheet";
  }

  // Build TOC entries from sources
  const sourceTocEntries: TocEntry[] = [];
  const outsideTextTocEntries: TocEntry[] = [];
  if (sheet) {
    sheet.sources.forEach((source, idx) => {
      const anchorId = buildAnchorId(idx, source.ref);
      if (source.title && !source.ref) {
        sourceTocEntries.push({
          id: anchorId,
          label: stripHtml(source.title).trim() || `Section ${idx + 1}`,
          level: 1,
        });
      } else if (source.ref) {
        sourceTocEntries.push({
          id: anchorId,
          label: source.ref,
          level: 2,
        });
      }

      const outsideTextHtml = getOutsideTextHtml(source);
      if (!outsideTextHtml.trim()) {
        return;
      }

      const label = truncateOutsideText(outsideTextHtml);
      if (label) {
        outsideTextTocEntries.push({
          id: anchorId,
          label,
          level: 2,
        });
      }
    });
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 no-print">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-sm min-w-0">
            <Link href="/" className="text-gray-400 hover:text-gray-600 shrink-0">
              ← Home
            </Link>
            {from && (
              <>
                <span className="text-gray-300">/</span>
                <Link
                  href={`/${from}`}
                  className="text-gray-400 hover:text-gray-600 shrink-0"
                >
                  {from}
                </Link>
              </>
            )}
          </div>

          {/* Language switcher */}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-500 text-xs">Language:</span>
            {(["bi", "en", "he"] as const).map((langOption) => (
              <a
                key={langOption}
                href={`/sheets/${sheetId}?lang=${langOption}${from ? `&from=${from}` : ""}`}
                className={`px-2 py-0.5 rounded text-xs ${
                  lang === langOption
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {langOption === "bi" ? "Both" : langOption === "en" ? "English" : "Hebrew"}
              </a>
            ))}
            <a
              href={`https://www.sefaria.org/sheets/${sheetId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-2 text-xs text-gray-400 hover:text-blue-500"
            >
              View on Sefaria ↗
            </a>
            <SheetRefreshButton sheetId={sheetId} />
            <PrintButton />
          </div>
        </div>
      </header>

      {error ? (
        <div className="max-w-4xl mx-auto px-4 py-12 text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <p className="text-red-700 font-medium">Could not load sheet</p>
            <p className="text-red-500 text-sm mt-1">{error}</p>
          </div>
        </div>
      ) : sheet ? (
        <div className="max-w-6xl mx-auto px-4 py-6">
          {/* Sheet title & meta */}
          <div className="mb-6">
            <h1
              className="text-3xl font-bold text-gray-900 mb-2"
              dangerouslySetInnerHTML={{ __html: sheet.title }}
            />
            {sheet.summary && (
              <p
                className="text-gray-600 text-sm mb-3"
                dangerouslySetInnerHTML={{ __html: sheet.summary }}
              />
            )}
            <div className="flex flex-wrap gap-2 items-center text-xs text-gray-400">
              {sheet.ownerName && <span>By {sheet.ownerName}</span>}
              <span>·</span>
              <span>{sheet.views ?? 0} views</span>
              {sheet.topics?.filter((topic) => topic.title?.en).slice(0, 5).map((topic) => (
                <span
                  key={topic.slug}
                  className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full"
                >
                  {topic.title?.en}
                </span>
              ))}
            </div>
          </div>

          {/*
           * Responsive two-column layout.
           * On mobile/tablet (flex-col): TOC appears first (order-1) then content (order-2).
           * On desktop lg+ (flex-row): content appears first on the left, TOC on the right.
           */}
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Main content */}
            <article className="order-2 lg:order-1 flex-1 min-w-0 sheet-content">
              {sheet.sources.map((source, idx) => (
                <SheetSourceItem
                  key={idx}
                  source={source}
                  lang={lang}
                  anchorId={buildAnchorId(idx, source.ref)}
                />
              ))}
            </article>

            {/* Table of Contents – handles both mobile (top) and desktop (right sidebar) layouts */}
            {(sourceTocEntries.length > 0 || outsideTextTocEntries.length > 0) && (
              <div className="order-1 lg:order-2 no-print">
                <TableOfContents
                  sourceEntries={sourceTocEntries}
                  outsideTextEntries={outsideTextTocEntries}
                />
              </div>
            )}
          </div>
        </div>
      ) : null}

      <footer className="text-center py-6 text-xs text-gray-300 no-print">
        Powered by{" "}
        <a
          href="https://www.sefaria.org"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:underline"
        >
          Sefaria API
        </a>
      </footer>
    </div>
  );
}
