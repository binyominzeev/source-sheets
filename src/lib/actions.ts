"use server";

import { revalidatePath } from "next/cache";

export async function revalidateUserSheets(username: string): Promise<void> {
  revalidatePath(`/${username}`);
}
