"use server";

import { revalidatePath } from "next/cache";
import { getSheet, stripHtml } from "@/lib/sefaria";
import { updateImportedSheet } from "@/lib/storage";

export async function revalidateUserSheets(username: string): Promise<void> {
  revalidatePath(`/${username}`);
}

export async function revalidateSheet(sheetId: string, username?: string): Promise<void> {
  revalidatePath(`/sheets/${sheetId}`);
  if (!username) return;

  try {
    const sheet = await getSheet(sheetId);
    updateImportedSheet(username, sheet.id, {
      title: stripHtml(sheet.title),
      created: sheet.created,
      updated: sheet.updated,
    });
  } catch (error) {
    console.error("Failed to sync imported sheet metadata after refresh:", error);
  }
  revalidatePath(`/${username}`);
}
