import fs from "fs";
import path from "path";

const DATA_FILE = path.join(process.cwd(), "data", "imported-sheets.json");

export interface ImportedSheet {
  id: number;
  title: string;
  created: string;
  updated: string;
  importedAt: string;
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
