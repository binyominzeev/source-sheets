import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getSheet, stripHtml } from "@/lib/sefaria";
import { addImportedSheets, getImportedSheets } from "@/lib/storage";

/**
 * Parse a Sefaria sheet URL or bare sheet ID and return the numeric sheet ID.
 * Accepts formats like:
 *   https://www.sefaria.org/sheets/12345
 *   https://www.sefaria.org/sheets/12345?lang=bi
 *   12345
 */
function parseSheetId(input: string): number | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Bare numeric ID
  if (/^\d+$/.test(trimmed)) return parseInt(trimmed, 10);

  // URL with /sheets/{id}
  const match = trimmed.match(/\/sheets\/(\d+)/);
  if (match) return parseInt(match[1], 10);

  return null;
}

interface ImportResult {
  imported: Array<{ id: number; title: string; created: string; updated: string }>;
  duplicates: number[];
  errors: Array<{ input: string; message: string }>;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: { urls?: unknown; username?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const username =
    typeof body.username === "string" && body.username.trim()
      ? body.username.trim()
      : null;

  if (!username) {
    return NextResponse.json({ error: "username is required" }, { status: 400 });
  }

  if (!Array.isArray(body.urls) || body.urls.length === 0) {
    return NextResponse.json({ error: "urls array is required" }, { status: 400 });
  }

  // Deduplicate input IDs
  const inputEntries = (body.urls as unknown[])
    .filter((u) => typeof u === "string")
    .map((u) => ({ raw: u as string, id: parseSheetId(u as string) }));

  const uniqueIds = new Map<number, string>();
  const parseErrors: ImportResult["errors"] = [];

  for (const entry of inputEntries) {
    if (entry.id === null) {
      parseErrors.push({ input: entry.raw, message: "Could not parse sheet ID from this input" });
    } else {
      uniqueIds.set(entry.id, entry.raw);
    }
  }

  // Check against already-imported IDs for this user (to avoid re-fetching metadata)
  const alreadyImported = new Set(getImportedSheets(username).map((s) => s.id));

  const result: ImportResult = { imported: [], duplicates: [], errors: [...parseErrors] };

  // Fetch metadata for IDs not yet in storage
  const fetchPromises = Array.from(uniqueIds.entries()).map(async ([id, raw]) => {
    if (alreadyImported.has(id)) {
      result.duplicates.push(id);
      return;
    }
    try {
      const sheet = await getSheet(id);
      result.imported.push({
        id: sheet.id,
        title: stripHtml(sheet.title),
        created: sheet.created,
        updated: sheet.updated,
      });
    } catch (err) {
      result.errors.push({
        input: raw,
        message: err instanceof Error ? err.message : "Failed to fetch sheet",
      });
    }
  });

  await Promise.all(fetchPromises);

  // Persist newly fetched sheets
  if (result.imported.length > 0) {
    const { duplicates: storageDupes } = addImportedSheets(username, result.imported);
    // Move storage-level duplicates (race condition) to the duplicates list
    for (const id of storageDupes) {
      const idx = result.imported.findIndex((s) => s.id === id);
      if (idx !== -1) {
        result.duplicates.push(id);
        result.imported.splice(idx, 1);
      }
    }
    // Revalidate the user's sheet list page so the new sheets appear immediately
    revalidatePath(`/${username}`);
  }

  return NextResponse.json(result);
}
