import { NextRequest, NextResponse } from "next/server";
import {
  getAuthUser,
  normalizeUsertag,
  setSessionUsertag,
  verifyPassword,
} from "@/lib/auth";

export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: { usertag?: unknown; password?: unknown };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const usertag = typeof body.usertag === "string" ? normalizeUsertag(body.usertag) : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!usertag || !password) {
    return NextResponse.json({ error: "usertag and password are required" }, { status: 400 });
  }

  const user = getAuthUser(usertag);
  if (!user || !verifyPassword(user, password)) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  try {
    await setSessionUsertag(usertag);
    return NextResponse.json({ ok: true, usertag });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create session";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
