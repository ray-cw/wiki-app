import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export type Role = "gm" | "player";

const COOKIE_NAME = "wiki_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

function secret() {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 32) {
    throw new Error("SESSION_SECRET must be set to at least 32 characters");
  }
  return value;
}

function sign(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

function safeEqual(a: string, b: string) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}

/** Returns the role whose password matches, or null. */
export function roleForPassword(password: string): Role | null {
  const gm = process.env.GM_PASSWORD;
  const player = process.env.PLAYER_PASSWORD;
  if (gm && safeEqual(password, gm)) return "gm";
  if (player && safeEqual(password, player)) return "player";
  return null;
}

export async function createSession(role: Role) {
  const expires = Math.floor(Date.now() / 1000) + MAX_AGE_SECONDS;
  const payload = `${role}.${expires}`;
  (await cookies()).set(COOKIE_NAME, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function destroySession() {
  (await cookies()).delete(COOKIE_NAME);
}

export async function getRole(): Promise<Role | null> {
  const value = (await cookies()).get(COOKIE_NAME)?.value;
  if (!value) return null;

  const [role, expires, signature] = value.split(".");
  if (!role || !expires || !signature) return null;
  if (!safeEqual(signature, sign(`${role}.${expires}`))) return null;
  if (Number(expires) < Date.now() / 1000) return null;
  return role === "gm" || role === "player" ? role : null;
}
