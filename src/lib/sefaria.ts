const SEFARIA_API = "https://www.sefaria.org";

export interface SefariaProfile {
  id: number;
  slug: string;
  full_name: string;
  profile_pic_url: string;
  bio: string;
}

export interface SheetSummary {
  id: number;
  title: string;
  tags: string[];
  views: number;
  created: string;
  updated: string;
  summary?: string;
  topics?: Array<{ slug: string; title: { en: string; he: string } }>;
}

export interface SheetText {
  en: string | string[];
  he: string | string[];
}

export interface SheetSource {
  node?: number;
  ref?: string;
  heRef?: string;
  text?: SheetText;
  title?: string;
  comment?: string;
  media?: string;
  outsideText?: string;
  outsideBiText?: SheetText;
  originalText?: SheetText;
  addedBy?: number;
}

export interface Sheet {
  id: number;
  title: string;
  summary?: string;
  tags?: string[];
  created: string;
  updated: string;
  views: number;
  sources: SheetSource[];
  topics?: Array<{ slug: string; title: { en: string; he: string } }>;
  ownerName?: string;
  ownerImageUrl?: string;
}

interface SefariaTextVersion {
  language?: string;
  text?: string | string[];
}

export async function getProfile(username: string): Promise<SefariaProfile> {
  const res = await fetch(`${SEFARIA_API}/api/profile/${username}`, {
    next: { revalidate: 3600 },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch profile: ${res.status}`);
  }
  return res.json();
}

export async function getUserSheets(userId: number): Promise<SheetSummary[]> {
  const res = await fetch(
    `${SEFARIA_API}/api/sheets/user/${userId}`,
    { next: { revalidate: 3600 } }
  );
  if (!res.ok) {
    throw new Error(`Failed to fetch sheets: ${res.status}`);
  }
  const data = await res.json();
  // API returns { sheets: [...] }
  return data.sheets ?? data;
}

export async function getSheet(sheetId: string | number): Promise<Sheet> {
  const res = await fetch(
    `${SEFARIA_API}/api/sheets/${sheetId}`,
    { next: { revalidate: 3600 } }
  );
  if (!res.ok) {
    throw new Error(`Failed to fetch sheet: ${res.status}`);
  }
  return res.json();
}

function flattenText(text: string | string[] | undefined): string {
  if (!text) return "";
  return Array.isArray(text) ? text.join("\n") : text;
}

function hasFootnoteMarkup(text: string | string[] | undefined): boolean {
  return /class=["'][^"']*\bfootnote(?:-marker)?\b/.test(flattenText(text));
}

function isTorahTemimahRef(ref: string | undefined): boolean {
  return Boolean(ref?.startsWith("Torah Temimah on Torah,"));
}

async function getTextVersions(ref: string): Promise<SefariaTextVersion[]> {
  const res = await fetch(
    `${SEFARIA_API}/api/v3/texts/${encodeURIComponent(ref)}`,
    { next: { revalidate: 3600 } }
  );
  if (!res.ok) {
    throw new Error(`Failed to fetch text: ${res.status}`);
  }

  const data = await res.json();
  return Array.isArray(data.versions) ? data.versions : [];
}

export async function augmentTorahTemimahSources(
  sources: SheetSource[]
): Promise<SheetSource[]> {
  return Promise.all(
    sources.map(async (source) => {
      if (!isTorahTemimahRef(source.ref) || hasFootnoteMarkup(source.text?.he)) {
        return source;
      }

      try {
        const versions = await getTextVersions(source.ref!);
        const heVersionWithFootnotes = versions.find(
          (version) => version.language === "he" && hasFootnoteMarkup(version.text)
        );

        if (!heVersionWithFootnotes?.text) {
          return source;
        }

        return {
          ...source,
          text: {
            en: source.text?.en ?? "",
            he: heVersionWithFootnotes.text,
          },
        };
      } catch (error) {
        console.error(`Failed to augment Torah Temimah source \"${source.ref}\":`, error);
        return source;
      }
    })
  );
}

/** Strip HTML tags from a string */
export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "");
}

/**
 * Convert bare https:// URLs in an HTML string into clickable <a> links.
 * URLs that are already inside an HTML attribute (e.g. href="...") are left untouched.
 * Trailing punctuation that commonly ends sentences is stripped from matched URLs.
 */
export function autoLinkUrls(html: string): string {
  // Negative lookbehind ensures we don't match URLs already in an attribute value.
  // Trailing sentence punctuation is excluded from the URL.
  return html.replace(
    /(?<!['"=])(https:\/\/[^\s<>"']+)/g,
    (_, url: string) => {
      const trimmed = url.replace(/[.,!?;:)]+$/, "");
      return `<a href="${trimmed}" target="_blank" rel="noopener noreferrer">${trimmed}</a>`;
    }
  );
}

/** Extract a plain-text display ref from a source */
export function getSourceRef(source: SheetSource): string | null {
  if (source.ref) return source.ref;
  return null;
}

/** Get the title text for a section header source */
export function getSourceTitle(source: SheetSource): string | null {
  if (source.title) return stripHtml(source.title);
  return null;
}
