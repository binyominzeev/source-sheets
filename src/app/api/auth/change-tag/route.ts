import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { changeClaimedUsertag, normalizeUsertag, setSessionUsertag } from "@/lib/auth";
import { moveImportedSheets } from "@/lib/storage";

export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: {
    currentUsertag?: unknown;
    newUsertag?: unknown;
    password?: unknown;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const currentUsertag =
    typeof body.currentUsertag === "string" ? normalizeUsertag(body.currentUsertag) : "";
  const newUsertag = typeof body.newUsertag === "string" ? body.newUsertag.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!currentUsertag || !newUsertag || !password) {
    return NextResponse.json(
      { error: "currentUsertag, newUsertag and password are required" },
      { status: 400 }
    );
  }

  try {
    const updated = changeClaimedUsertag({
      currentUsertag,
      newUsertag,
      password,
    });

    moveImportedSheets(currentUsertag, updated.usertag);
    await setSessionUsertag(updated.usertag);

    revalidatePath(`/${currentUsertag}`);
    revalidatePath(`/${updated.usertag}`);

    return NextResponse.json({
      ok: true,
      oldUsertag: currentUsertag,
      newUsertag: updated.usertag,
      sefariaSlug: updated.sefariaSlug,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to change user tag";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
