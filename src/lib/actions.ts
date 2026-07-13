"use server";

import { revalidatePath } from "next/cache";
import { getSheet, stripHtml } from "@/lib/sefaria";
import { getImportedSheet, updateImportedSheet } from "@/lib/storage";
import { getSessionUsertag, normalizeUsertag } from "@/lib/auth";

export async function revalidateUserSheets(username: string): Promise<void> {
  const normalizedUsertag = normalizeUsertag(username);
  const sessionUsertag = await getSessionUsertag();
  if (sessionUsertag !== normalizedUsertag) {
    throw new Error("Unauthorized");
  }
  revalidatePath(`/${normalizedUsertag}`);
}

export async function revalidateSheet(sheetId: string, username?: string): Promise<void> {
  revalidatePath(`/sheets/${sheetId}`);
  if (!username) return;

  const normalizedUsertag = normalizeUsertag(username);
  const sessionUsertag = await getSessionUsertag();
  if (sessionUsertag !== normalizedUsertag) {
    throw new Error("Unauthorized");
  }

  const numericSheetId = Number(sheetId);
  if (Number.isFinite(numericSheetId)) {
    const importedSheet = getImportedSheet(normalizedUsertag, numericSheetId);
    if (importedSheet?.slug) {
      revalidatePath(`/${normalizedUsertag}/${importedSheet.slug}`);
    }
  }

  try {
    const sheet = await getSheet(sheetId);
    const updated = updateImportedSheet(normalizedUsertag, sheet.id, {
      title: stripHtml(sheet.title),
      created: sheet.created,
      updated: sheet.updated,
    });
    if (!updated) {
      console.warn(
        `Imported-sheet metadata sync skipped for sheet ${sheet.id} and username "${normalizedUsertag}".`
      );
    }
  } catch (error) {
    console.error("Failed to sync imported sheet metadata after refresh:", error);
  }
  revalidatePath(`/${normalizedUsertag}`);
}
