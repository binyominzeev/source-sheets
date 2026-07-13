import Link from "next/link";
import { augmentTorahTemimahSources, getSheet, stripHtml } from "@/lib/sefaria";
import { getSessionUsertag } from "@/lib/auth";
import { getImportedSheet } from "@/lib/storage";
import TableOfContents, { TocEntry } from "@/components/TableOfContents";
import SheetSourceItem from "@/components/SheetSourceItem";
import PrintButton from "@/components/PrintButton";
import SheetRefreshButton from "@/components/SheetRefreshButton";
import SheetSlugManager from "@/components/SheetSlugManager";

interface SheetPageViewProps {
  sheetId: string;
  fromUsertag?: string;
  langParam?: string;
  permalinkPath?: string | null;
  languageBasePath?: string;
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

function prepareOutsideTextLabel(outsideTextHtml: string): string | null {
  const plain = stripHtml(outsideTextHtml).replace(/\s+/g, " ").trim();
  if (!plain) return null;
  if (plain.length <= DEFAULT_OUTSIDE_TEXT_PREVIEW_LENGTH) return plain;
  return `${plain.slice(0, DEFAULT_OUTSIDE_TEXT_PREVIEW_LENGTH - ELLIPSIS.length).trimEnd()}${ELLIPSIS}`;
}

function extractPlainUrl(outsideTextHtml: string): string | undefined {
  const plain = stripHtml(outsideTextHtml).replace(/\s+/g, " ").trim();
  const match = plain.match(/^(https:\/\/[^\s<>"']+?)[.,!?;:)]*$/);
  return match ? match[1] : undefined;
}

function getOutsideTextHtml(source: {
  outsideText?: string;
  outsideBiText?: { en: string | string[]; he: string | string[] };
}): string {
  if (source.outsideText) return source.outsideText;
  if (!source.outsideBiText) return "";
  return [flattenSheetText(source.outsideBiText.en), flattenSheetText(source.outsideBiText.he)]
    .filter(Boolean)
    .join(" ");
}

export default async function SheetPageView({
  sheetId,
  fromUsertag,
  langParam,
  permalinkPath,
  languageBasePath,
}: SheetPageViewProps) {
  const sessionUsertag = await getSessionUsertag();
  const isOwner = Boolean(fromUsertag && sessionUsertag === fromUsertag);
  const numericSheetId = Number(sheetId);
  const importedSheet =
    fromUsertag && Number.isFinite(numericSheetId)
      ? getImportedSheet(fromUsertag, numericSheetId)
      : null;
  const resolvedPermalinkPath =
    permalinkPath ??
    (fromUsertag && importedSheet?.slug ? `/${fromUsertag}/${importedSheet.slug}` : null);
  const resolvedLanguageBasePath = languageBasePath ?? `/sheets/${sheetId}`;

  const lang: "en" | "he" | "bi" =
    langParam === "en" || langParam === "he" || langParam === "bi" ? langParam : "bi";

  let sheet = null;
  let error: string | null = null;

  try {
    const loadedSheet = await getSheet(sheetId);
    sheet = {
      ...loadedSheet,
      sources: await augmentTorahTemimahSources(loadedSheet.sources),
    };
  } catch (err) {
    error = err instanceof Error ? err.message : "Failed to load sheet";
  }

  const sourceTocEntries: TocEntry[] = [];
  const outsideTextTocEntries: TocEntry[] = [];
  const sourceNumberByAnchorId = new Map<string, number>();
  if (sheet) {
    let sourceNumber = 0;
    sheet.sources.forEach((source, idx) => {
      const anchorId = buildAnchorId(idx, source.ref);
      if (source.title && !source.ref) {
        sourceNumber += 1;
        sourceTocEntries.push({
          id: anchorId,
          label: stripHtml(source.title).trim() || `Section ${idx + 1}`,
          level: 1,
        });
        sourceNumberByAnchorId.set(anchorId, sourceNumber);
      } else if (source.ref) {
        sourceNumber += 1;
        sourceTocEntries.push({
          id: anchorId,
          label: source.ref,
          level: 2,
        });
        sourceNumberByAnchorId.set(anchorId, sourceNumber);
      }

      const outsideTextHtml = getOutsideTextHtml(source);
      const label = prepareOutsideTextLabel(outsideTextHtml);
      if (label) {
        const externalHref = extractPlainUrl(outsideTextHtml);
        outsideTextTocEntries.push({
          id: anchorId,
          label,
          level: 2,
          href: externalHref,
        });
      }
    });
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 no-print">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-sm min-w-0">
            <Link href="/" className="text-gray-400 hover:text-gray-600 shrink-0">
              ← Home
            </Link>
            {fromUsertag && (
              <>
                <span className="text-gray-300">/</span>
                <Link href={`/${fromUsertag}`} className="text-gray-400 hover:text-gray-600 shrink-0">
                  {fromUsertag}
                </Link>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-500 text-xs">Language:</span>
            {(["bi", "en", "he"] as const).map((langOption) => (
              <a
                key={langOption}
                href={`${resolvedLanguageBasePath}?lang=${langOption}${
                  resolvedLanguageBasePath.startsWith("/sheets/") && fromUsertag
                    ? `&from=${fromUsertag}`
                    : ""
                }`}
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
            {resolvedPermalinkPath && (
              <a href={resolvedPermalinkPath} className="text-xs text-blue-600 hover:underline">
                Permalink
              </a>
            )}
            {(!fromUsertag || isOwner) && (
              <SheetRefreshButton sheetId={sheetId} from={fromUsertag} />
            )}
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
              {isOwner && fromUsertag && Number.isFinite(numericSheetId) && (
                <SheetSlugManager
                  username={fromUsertag}
                  sheetId={numericSheetId}
                  initialSlug={importedSheet?.slug}
                />
              )}
              {sheet.topics?.filter((topic) => topic.title?.en).slice(0, 5).map((topic) => (
                <span key={topic.slug} className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                  {topic.title?.en}
                </span>
              ))}
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-6">
            <article className="order-2 lg:order-1 flex-1 min-w-0 sheet-content">
              {sheet.sources.map((source, idx) => {
                const anchorId = buildAnchorId(idx, source.ref);

                return (
                  <SheetSourceItem
                    key={idx}
                    source={source}
                    lang={lang}
                    anchorId={anchorId}
                    sourceNumber={sourceNumberByAnchorId.get(anchorId)}
                  />
                );
              })}
            </article>

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
