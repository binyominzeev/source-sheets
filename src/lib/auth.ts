import crypto from "crypto";
import fs from "fs";
import path from "path";
import { cookies } from "next/headers";

const AUTH_USERS_FILE = path.join(process.cwd(), "data", "auth-users.json");
const USERTAG_REDIRECTS_FILE = path.join(process.cwd(), "data", "usertag-redirects.json");
const SESSION_COOKIE_NAME = "source_sheets_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 365; // 1 year

export interface AuthUser {
  usertag: string;
  sefariaSlug: string;
  sefariaUserId?: number;
  passwordHash: string;
  passwordSalt: string;
  createdAt: string;
  updatedAt: string;
  lastProofCode: string;
}

type AuthUsersData = Record<string, AuthUser>;
type UsertagRedirectsData = Record<string, string>;

function readAuthUsersData(): AuthUsersData {
  try {
    const raw = fs.readFileSync(AUTH_USERS_FILE, "utf-8");
    return JSON.parse(raw) as AuthUsersData;
  } catch {
    return {};
  }
}

function writeAuthUsersData(data: AuthUsersData): void {
  fs.mkdirSync(path.dirname(AUTH_USERS_FILE), { recursive: true });
  fs.writeFileSync(AUTH_USERS_FILE, JSON.stringify(data, null, 2), "utf-8");
}

function readUsertagRedirects(): UsertagRedirectsData {
  try {
    const raw = fs.readFileSync(USERTAG_REDIRECTS_FILE, "utf-8");
    return JSON.parse(raw) as UsertagRedirectsData;
  } catch {
    return {};
  }
}

function writeUsertagRedirects(data: UsertagRedirectsData): void {
  fs.mkdirSync(path.dirname(USERTAG_REDIRECTS_FILE), { recursive: true });
  fs.writeFileSync(USERTAG_REDIRECTS_FILE, JSON.stringify(data, null, 2), "utf-8");
}

export function normalizeUsertag(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export function getAuthUser(usertag: string): AuthUser | null {
  const data = readAuthUsersData();
  const normalized = normalizeUsertag(usertag);
  return data[normalized] ?? null;
}

export function resolveUsertagRedirect(usertag: string): {
  canonicalUsertag: string;
  redirectedFrom?: string;
} {
  const start = normalizeUsertag(usertag);
  const users = readAuthUsersData();
  const redirects = readUsertagRedirects();

  let current = start;
  let hopCount = 0;
  while (redirects[current] && hopCount < 10) {
    current = normalizeUsertag(redirects[current]);
    hopCount += 1;
  }

  if (current !== start) {
    return { canonicalUsertag: current, redirectedFrom: start };
  }

  // Backward-compatible fallback for already-migrated users before redirect map existed:
  // if someone visits an old tag that equals a claimed user's Sefaria slug,
  // redirect to that user's currently active usertag.
  if (!users[start]) {
    const bySefariaSlug = Object.values(users).find(
      (user) => normalizeSefariaSlug(user.sefariaSlug) === start
    );
    if (bySefariaSlug && bySefariaSlug.usertag !== start) {
      return { canonicalUsertag: bySefariaSlug.usertag, redirectedFrom: start };
    }
  }

  return { canonicalUsertag: start };
}

function normalizeSefariaSlug(slug: string): string {
  return slug.trim().toLowerCase();
}

export function findUsertagBySefariaIdentity(input: {
  sefariaSlug: string;
  sefariaUserId?: number;
}): string | null {
  const data = readAuthUsersData();
  const normalizedSlug = normalizeSefariaSlug(input.sefariaSlug);

  for (const [usertag, user] of Object.entries(data)) {
    if (typeof input.sefariaUserId === "number" && user.sefariaUserId === input.sefariaUserId) {
      return usertag;
    }
    if (normalizeSefariaSlug(user.sefariaSlug) === normalizedSlug) {
      return usertag;
    }
  }

  return null;
}

function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString("hex");
}

function safeEqual(a: string, b: string): boolean {
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);
  if (aBuffer.length !== bBuffer.length) return false;
  return crypto.timingSafeEqual(aBuffer, bBuffer);
}

function getSessionSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("Missing AUTH_SECRET environment variable");
  }
  return secret;
}

function signPayload(payloadBase64: string): string {
  return crypto
    .createHmac("sha256", getSessionSecret())
    .update(payloadBase64)
    .digest("base64url");
}

function makeSessionToken(usertag: string): string {
  const payload = {
    usertag,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  };
  const payloadBase64 = Buffer.from(JSON.stringify(payload), "utf-8").toString("base64url");
  const signature = signPayload(payloadBase64);
  return `${payloadBase64}.${signature}`;
}

function verifySessionToken(token: string): string | null {
  const [payloadBase64, signature] = token.split(".");
  if (!payloadBase64 || !signature) return null;

  const expectedSignature = signPayload(payloadBase64);
  if (!safeEqual(signature, expectedSignature)) return null;

  try {
    const payload = JSON.parse(Buffer.from(payloadBase64, "base64url").toString("utf-8")) as {
      usertag?: string;
      exp?: number;
    };

    if (!payload.usertag || typeof payload.exp !== "number") return null;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;

    return normalizeUsertag(payload.usertag);
  } catch {
    return null;
  }
}

export async function getSessionUsertag(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  const usertag = verifySessionToken(token);
  if (!usertag) return null;

  const user = getAuthUser(usertag);
  return user ? usertag : null;
}

export async function setSessionUsertag(usertag: string): Promise<void> {
  const normalized = normalizeUsertag(usertag);
  const token = makeSessionToken(normalized);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export function verifyPassword(user: AuthUser, password: string): boolean {
  const computed = hashPassword(password, user.passwordSalt);
  return safeEqual(computed, user.passwordHash);
}

export function createClaimedUser(input: {
  usertag: string;
  sefariaSlug: string;
  sefariaUserId?: number;
  password: string;
  proofCode: string;
}): AuthUser {
  const usertag = normalizeUsertag(input.usertag);
  if (!usertag || usertag.length < 3 || usertag.length > 40) {
    throw new Error("User tag must be 3-40 chars and URL-safe.");
  }
  if (input.password.length < 8) {
    throw new Error("Password must be at least 8 characters.");
  }

  const data = readAuthUsersData();
  if (data[usertag]) {
    throw new Error("This user tag is already claimed.");
  }

  const existingUsertag = findUsertagBySefariaIdentity({
    sefariaSlug: input.sefariaSlug,
    sefariaUserId: input.sefariaUserId,
  });
  if (existingUsertag) {
    throw new Error(
      `This Sefaria profile already has a claimed tag (${existingUsertag}). Use tag change instead.`
    );
  }

  const salt = crypto.randomBytes(16).toString("hex");
  const now = new Date().toISOString();
  const user: AuthUser = {
    usertag,
    sefariaSlug: input.sefariaSlug.trim(),
    sefariaUserId: input.sefariaUserId,
    passwordSalt: salt,
    passwordHash: hashPassword(input.password, salt),
    createdAt: now,
    updatedAt: now,
    lastProofCode: input.proofCode.trim(),
  };

  data[usertag] = user;
  writeAuthUsersData(data);
  return user;
}

export function resolveSefariaSlug(publicUsertag: string): string {
  const user = getAuthUser(publicUsertag);
  return user?.sefariaSlug ?? publicUsertag;
}

export function changeClaimedUsertag(input: {
  currentUsertag: string;
  newUsertag: string;
  password: string;
}): AuthUser {
  const currentUsertag = normalizeUsertag(input.currentUsertag);
  const newUsertag = normalizeUsertag(input.newUsertag);
  if (!currentUsertag) {
    throw new Error("Current user tag is required.");
  }
  if (!newUsertag || newUsertag.length < 3 || newUsertag.length > 40) {
    throw new Error("New user tag must be 3-40 chars and URL-safe.");
  }
  if (currentUsertag === newUsertag) {
    throw new Error("You are already using this user tag.");
  }

  const data = readAuthUsersData();
  const current = data[currentUsertag];
  if (!current) {
    throw new Error("Current user tag was not found.");
  }
  if (data[newUsertag]) {
    throw new Error("This new user tag is already claimed.");
  }
  if (!verifyPassword(current, input.password)) {
    throw new Error("Invalid credentials.");
  }

  const updated: AuthUser = {
    ...current,
    usertag: newUsertag,
    updatedAt: new Date().toISOString(),
  };

  delete data[currentUsertag];
  data[newUsertag] = updated;
  writeAuthUsersData(data);

  // Keep old usertags working by redirecting them to the newest claimed tag.
  const redirects = readUsertagRedirects();
  redirects[currentUsertag] = newUsertag;
  for (const [from, to] of Object.entries(redirects)) {
    if (to === currentUsertag) {
      redirects[from] = newUsertag;
    }
  }
  writeUsertagRedirects(redirects);

  return updated;
}
