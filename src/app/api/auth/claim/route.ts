import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClaimedUser, normalizeUsertag, setSessionUsertag } from "@/lib/auth";
import { getProfile, stripHtml } from "@/lib/sefaria";
import { moveImportedSheets } from "@/lib/storage";

function normalizeProofText(input: string): string {
  return input.replace(/\s+/g, " ").trim().toLowerCase();
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: {
    usertag?: unknown;
    sefariaSlug?: unknown;
    proofCode?: unknown;
    password?: unknown;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const usertag = typeof body.usertag === "string" ? normalizeUsertag(body.usertag) : "";
  const sefariaSlug = typeof body.sefariaSlug === "string" ? body.sefariaSlug.trim() : "";
  const proofCode = typeof body.proofCode === "string" ? body.proofCode.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!usertag) {
    return NextResponse.json({ error: "usertag is required" }, { status: 400 });
  }
  if (!sefariaSlug) {
    return NextResponse.json({ error: "sefariaSlug is required" }, { status: 400 });
  }
  if (!proofCode) {
    return NextResponse.json({ error: "proofCode is required" }, { status: 400 });
  }
  if (!password) {
    return NextResponse.json({ error: "password is required" }, { status: 400 });
  }

  try {
    const profile = await getProfile(sefariaSlug);
    const bioPlain = normalizeProofText(stripHtml(profile.bio || ""));
    const proofNeedle = normalizeProofText(proofCode);

    if (!proofNeedle || !bioPlain.includes(proofNeedle)) {
      return NextResponse.json(
        {
          error:
            "Verification failed. Add the exact proof code to your Sefaria profile bio, then try again.",
        },
        { status: 403 }
      );
    }

    const created = createClaimedUser({
      usertag,
      sefariaSlug: profile.slug || sefariaSlug,
      sefariaUserId: profile.id,
      password,
      proofCode,
    });

    // Migrate any existing imports from old keys into the claimed usertag bucket.
    moveImportedSheets(sefariaSlug, created.usertag);
    if (profile.slug && profile.slug !== sefariaSlug) {
      moveImportedSheets(profile.slug, created.usertag);
    }

    await setSessionUsertag(created.usertag);
    revalidatePath(`/${created.usertag}`);

    return NextResponse.json({
      ok: true,
      usertag: created.usertag,
      sefariaSlug: created.sefariaSlug,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to claim user tag";
    const status = message.includes("already has a claimed tag") ? 409 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
