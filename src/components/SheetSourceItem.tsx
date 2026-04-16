import { SheetSource } from "@/lib/sefaria";

interface SheetSourceItemProps {
  source: SheetSource;
  lang: "en" | "he" | "bi";
  anchorId: string;
  sourceNumber: number;
}

function renderText(text: string | string[] | undefined): string {
  if (!text) return "";
  if (Array.isArray(text)) {
    return text.join("<br/>");
  }
  return text;
}

export default function SheetSourceItem({
  source,
  lang,
  anchorId,
  sourceNumber,
}: SheetSourceItemProps) {
  const sourceNumberLabel = `${sourceNumber}.`;

  // Section title / header
  if (source.title && !source.ref) {
    return (
      <div id={anchorId} className="sheet-source mt-6 mb-2">
        <h3 className="flex items-baseline gap-2 text-xl font-bold text-gray-800 border-b border-gray-200 pb-1">
          <span
            aria-hidden="true"
            className="shrink-0 text-sm font-medium text-gray-400 select-none"
          >
            {sourceNumberLabel}
          </span>
          <span dangerouslySetInnerHTML={{ __html: source.title }} />
        </h3>
      </div>
    );
  }

  // Biblical / Talmudic source with ref
  if (source.ref) {
    const enText = renderText(source.text?.en);
    const heText = renderText(source.text?.he);

    return (
      <div id={anchorId} className="sheet-source my-4 rounded-lg border border-gray-100 overflow-hidden">
        {/* Source reference header */}
        <div className="bg-gray-50 px-4 py-2 border-b border-gray-100 flex items-center justify-between gap-3">
          <div className="flex items-baseline gap-2 min-w-0">
            <span
              aria-hidden="true"
              className="shrink-0 text-sm font-medium text-gray-400 select-none"
            >
              {sourceNumberLabel}
            </span>
            <a
              href={`https://www.sefaria.org/${encodeURIComponent(source.ref)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold text-blue-700 hover:underline"
            >
              {source.ref}
            </a>
          </div>
          {source.heRef && source.heRef !== source.ref && (
            <span className="text-sm text-gray-500 he-text">{source.heRef}</span>
          )}
        </div>

        {/* Text content */}
        <div className="p-4">
          {lang === "bi" && enText && heText ? (
            <div className="bilingual-source">
              <div
                className="sheet-source-text text-sm leading-relaxed text-gray-800"
                dangerouslySetInnerHTML={{ __html: enText }}
              />
              <div
                className="sheet-source-text text-sm leading-relaxed text-gray-800 he-text"
                dangerouslySetInnerHTML={{ __html: heText }}
              />
            </div>
          ) : lang === "he" && heText ? (
            <div
              className="sheet-source-text text-sm leading-relaxed text-gray-800 he-text"
              dangerouslySetInnerHTML={{ __html: heText }}
            />
          ) : enText ? (
            <div
              className="sheet-source-text text-sm leading-relaxed text-gray-800"
              dangerouslySetInnerHTML={{ __html: enText }}
            />
          ) : heText ? (
            <div
              className="sheet-source-text text-sm leading-relaxed text-gray-800 he-text"
              dangerouslySetInnerHTML={{ __html: heText }}
            />
          ) : null}
        </div>
      </div>
    );
  }

  // Outside text (no ref)
  if (source.outsideText) {
    return (
      <div id={anchorId} className="sheet-source my-4 p-4 bg-amber-50 border-l-4 border-amber-300 rounded-r-lg">
        <div className="flex items-start gap-2">
          <span
            aria-hidden="true"
            className="shrink-0 pt-0.5 text-sm font-medium text-gray-400 select-none"
          >
            {sourceNumberLabel}
          </span>
          <div
            className="sheet-source-text min-w-0 text-sm leading-relaxed text-gray-800"
            dangerouslySetInnerHTML={{ __html: source.outsideText }}
          />
        </div>
      </div>
    );
  }

  // Outside bilingual text
  if (source.outsideBiText) {
    const enText = renderText(source.outsideBiText.en);
    const heText = renderText(source.outsideBiText.he);
    return (
      <div id={anchorId} className="sheet-source my-4 p-4 bg-amber-50 border-l-4 border-amber-300 rounded-r-lg">
        <div className="flex items-start gap-2">
          <span
            aria-hidden="true"
            className="shrink-0 pt-0.5 text-sm font-medium text-gray-400 select-none"
          >
            {sourceNumberLabel}
          </span>
          <div className="min-w-0 flex-1">
            {lang === "bi" && enText && heText ? (
              <div className="bilingual-source">
                <div
                  className="sheet-source-text text-sm leading-relaxed text-gray-800"
                  dangerouslySetInnerHTML={{ __html: enText }}
                />
                <div
                  className="sheet-source-text text-sm leading-relaxed text-gray-800 he-text"
                  dangerouslySetInnerHTML={{ __html: heText }}
                />
              </div>
            ) : lang === "he" && heText ? (
              <div
                className="sheet-source-text text-sm leading-relaxed text-gray-800 he-text"
                dangerouslySetInnerHTML={{ __html: heText }}
              />
            ) : enText ? (
              <div
                className="sheet-source-text text-sm leading-relaxed text-gray-800"
                dangerouslySetInnerHTML={{ __html: enText }}
              />
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  // Comment
  if (source.comment) {
    return (
      <div id={anchorId} className="sheet-source my-3 px-4 py-2 text-sm text-gray-700 italic border-l-2 border-gray-200">
        <div className="flex items-start gap-2">
          <span
            aria-hidden="true"
            className="shrink-0 pt-0.5 text-sm font-medium text-gray-400 select-none not-italic"
          >
            {sourceNumberLabel}
          </span>
          <div dangerouslySetInnerHTML={{ __html: source.comment }} />
        </div>
      </div>
    );
  }

  // Media
  if (source.media) {
    const isImage = /\.(png|jpe?g|gif|webp|svg)(\?.*)?$/i.test(source.media);
    const isYoutube =
      source.media.includes("youtube.com") ||
      source.media.includes("youtu.be");
    return (
      <div id={anchorId} className="sheet-source my-4">
        <div className="flex items-start gap-2">
          <span
            aria-hidden="true"
            className="shrink-0 pt-0.5 text-sm font-medium text-gray-400 select-none"
          >
            {sourceNumberLabel}
          </span>
          <div className="min-w-0 flex-1">
            {isImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={source.media}
                alt="Sheet media"
                className="max-w-full rounded"
              />
            ) : isYoutube ? (
              <div className="aspect-video max-w-xl">
                <iframe
                  src={source.media.replace("watch?v=", "embed/")}
                  className="w-full h-full rounded"
                  allowFullScreen
                  title="Sheet video"
                />
              </div>
            ) : (
              <a
                href={source.media}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline text-sm"
              >
                {source.media}
              </a>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
