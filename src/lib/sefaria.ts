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

/** Strip HTML tags from a string */
export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "");
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
