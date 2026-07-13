import { NextResponse } from "next/server";
import { getAuthUser, getSessionUsertag } from "@/lib/auth";

export async function GET(): Promise<NextResponse> {
  const usertag = await getSessionUsertag();
  if (!usertag) {
    return NextResponse.json({ loggedIn: false });
  }

  const user = getAuthUser(usertag);
  return NextResponse.json({
    loggedIn: true,
    usertag,
    sefariaSlug: user?.sefariaSlug ?? null,
  });
}
