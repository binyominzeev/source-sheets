import fs from "fs";
import path from "path";

const DATA_FILE = path.join(process.cwd(), "data", "imported-sheets.json");

export interface ImportedSheet {
  id: number;
  title: string;
  created: string;
  updated: string;
  importedAt: string;
  slug?: string;
  slugUpdatedAt?: string;
}

/** Map of username → { sheetId → ImportedSheet } */
type StorageData = Record<string, Record<string, ImportedSheet>>;

function readData(): StorageData {
  try {
    const raw = fs.readFileSync(DATA_FILE, "utf-8");
    return JSON.parse(raw) as StorageData;
  } catch {
    return {};
  }
}

// NOTE: These helpers use synchronous file I/O which is suitable for a
// single-process deployment. In a multi-process or serverless environment
// (e.g. multiple Vercel instances), concurrent writes could conflict.
// For those deployments, replace this module with a proper database adapter.
function writeData(data: StorageData): void {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
}

/** Return all imported sheets for a given username. */
export function getImportedSheets(username: string): ImportedSheet[] {
  const data = readData();
  const byId = data[username] ?? {};
  return Object.values(byId);
}

export function getImportedSheet(username: string, sheetId: number): ImportedSheet | null {
  const data = readData();
  return data[username]?.[String(sheetId)] ?? null;
}

export function normalizeSheetSlug(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['"`]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function makeUniqueSlug(existingSlugs: Set<string>, base: string): string {
  if (!existingSlugs.has(base)) return base;
  let idx = 2;
  while (existingSlugs.has(`${base}-${idx}`)) {
    idx += 1;
  }
  return `${base}-${idx}`;
}

export function suggestSheetSlug(username: string, sheetId: number): string | null {
  const data = readData();
  const bucket = data[username] ?? {};
  const existing = bucket[String(sheetId)];
  if (!existing) return null;

  const base = normalizeSheetSlug(existing.title || `sheet-${sheetId}`);
  const fallback = base || `sheet-${sheetId}`;
  const existingSlugs = new Set(
    Object.entries(bucket)
      .filter(([id]) => id !== String(sheetId))
      .map(([, sheet]) => sheet.slug)
      .filter((slug): slug is string => Boolean(slug))
  );
  return makeUniqueSlug(existingSlugs, fallback);
}

export function findImportedSheetBySlug(
  username: string,
  slug: string
): ImportedSheet | null {
  const normalizedSlug = normalizeSheetSlug(slug);
  if (!normalizedSlug) return null;
  const byId = readData()[username] ?? {};
  for (const sheet of Object.values(byId)) {
    if (sheet.slug === normalizedSlug) return sheet;
  }
  return null;
}

export function setImportedSheetSlug(
  username: string,
  sheetId: number,
  slugInput: string
): { ok: true; slug: string } | { ok: false; error: string } {
  const data = readData();
  const key = String(sheetId);
  const existing = data[username]?.[key];
  if (!existing) {
    return { ok: false, error: "Sheet is not imported under this user tag." };
  }

  const normalized = normalizeSheetSlug(slugInput);
  if (!normalized) {
    return { ok: false, error: "Slug cannot be empty after normalization." };
  }

  const byId = data[username] ?? {};
  for (const [otherId, sheet] of Object.entries(byId)) {
    if (otherId !== key && sheet.slug === normalized) {
      return { ok: false, error: "This slug is already used by another imported sheet." };
    }
  }

  data[username][key] = {
    ...existing,
    slug: normalized,
    slugUpdatedAt: new Date().toISOString(),
  };
  writeData(data);
  return { ok: true, slug: normalized };
}

/**
 * Add sheets to the imported store for a username.
 * Returns the IDs that were actually newly stored (deduplicating against existing entries).
 */
export function addImportedSheets(
  username: string,
  sheets: Omit<ImportedSheet, "importedAt">[]
): { added: number[]; duplicates: number[] } {
  const data = readData();
  if (!data[username]) data[username] = {};

  const added: number[] = [];
  const duplicates: number[] = [];

  for (const sheet of sheets) {
    const key = String(sheet.id);
    if (data[username][key]) {
      duplicates.push(sheet.id);
    } else {
      data[username][key] = {
        ...sheet,
        importedAt: new Date().toISOString(),
      };
      added.push(sheet.id);
    }
  }

  writeData(data);
  return { added, duplicates };
}

/** Update fields for an already-imported sheet for a username. */
export function updateImportedSheet(
  username: string,
  sheetId: number,
  updates: Partial<Pick<ImportedSheet, "title" | "created" | "updated">>
): boolean {
  if (Object.keys(updates).length === 0) return false;

  const data = readData();
  const key = String(sheetId);
  const existing = data[username]?.[key];
  if (!existing) return false;

  data[username][key] = {
    ...existing,
    ...updates,
  };
  writeData(data);
  return true;
}

/** Move imported sheets from one username bucket to another, merging by sheet ID. */
export function moveImportedSheets(fromUsername: string, toUsername: string): number {
  const fromKey = fromUsername.trim();
  const toKey = toUsername.trim();
  if (!fromKey || !toKey || fromKey === toKey) return 0;

  const data = readData();
  const source = data[fromKey];
  if (!source) return 0;

  if (!data[toKey]) data[toKey] = {};

  let moved = 0;
  for (const [sheetId, sheet] of Object.entries(source)) {
    if (!data[toKey][sheetId]) {
      data[toKey][sheetId] = sheet;
      moved += 1;
    }
  }

  delete data[fromKey];
  writeData(data);
  return moved;
}
