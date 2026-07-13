import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getSessionUsertag, normalizeUsertag } from "@/lib/auth";
import {
  getImportedSheet,
  setImportedSheetSlug,
  suggestSheetSlug,
} from "@/lib/storage";

interface Body {
  username?: unknown;
  sheetId?: unknown;
  slug?: unknown;
  mode?: unknown;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const username =
    typeof body.username === "string" ? normalizeUsertag(body.username) : "";
  const mode = typeof body.mode === "string" ? body.mode : "set";
  const sheetId =
    typeof body.sheetId === "number"
      ? body.sheetId
      : typeof body.sheetId === "string" && /^\d+$/.test(body.sheetId)
        ? Number(body.sheetId)
        : NaN;

  if (!username || !Number.isFinite(sheetId)) {
    return NextResponse.json({ error: "username and numeric sheetId are required" }, { status: 400 });
  }

  const sessionUsertag = await getSessionUsertag();
  if (sessionUsertag !== username) {
    return NextResponse.json(
      { error: "Unauthorized: sign in as this user tag first" },
      { status: 403 }
    );
  }

  const imported = getImportedSheet(username, sheetId);
  if (!imported) {
    return NextResponse.json(
      { error: "This sheet is not imported under the selected user tag." },
      { status: 404 }
    );
  }

  const slugCandidate =
    mode === "auto"
      ? suggestSheetSlug(username, sheetId)
      : typeof body.slug === "string"
        ? body.slug
        : "";

  if (!slugCandidate) {
    return NextResponse.json(
      { error: "Could not generate slug. Try providing one manually." },
      { status: 400 }
    );
  }

  const updated = setImportedSheetSlug(username, sheetId, slugCandidate);
  if (!updated.ok) {
    return NextResponse.json({ error: updated.error }, { status: 409 });
  }

  revalidatePath(`/${username}`);
  revalidatePath(`/sheets/${sheetId}`);
  revalidatePath(`/${username}/${updated.slug}`);

  return NextResponse.json({
    ok: true,
    slug: updated.slug,
    permalink: `/${username}/${updated.slug}`,
  });
}
