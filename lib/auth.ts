/**
 * Auth session légère : un cookie HMAC signé.
 * Compatible Edge (Web Crypto) → marche en middleware ET en route handler.
 * Pas de store externe : le payload du cookie est auto-porté et signé.
 */
import { serverEnv } from "@/lib/env";

export const SESSION_COOKIE = "levo_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 jours

const encoder = new TextEncoder();

/**
 * True si l'auth est configurée. Nécessite AUTH_SECRET **et** DASHBOARD_PASSWORD :
 * si un seul est présent, on reste en mode démo (pas de verrouillage accidentel).
 */
export function authEnabled(): boolean {
  return !!process.env.AUTH_SECRET && !!process.env.DASHBOARD_PASSWORD;
}

function buf(input: string | Uint8Array): Uint8Array<ArrayBuffer> {
  const src = typeof input === "string" ? encoder.encode(input) : input;
  const out = new Uint8Array(src.byteLength);
  out.set(src);
  return out;
}
function base64url(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function fromBase64url(str: string): Uint8Array {
  const pad = str.length % 4 === 0 ? "" : "=".repeat(4 - (str.length % 4));
  const bin = atob(str.replace(/-/g, "+").replace(/_/g, "/") + pad);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
async function hmacKey(): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    buf(serverEnv.authSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

interface SessionPayload {
  iat: number;
  exp: number;
  sub: string;
}

export async function createSession(subject = "robin"): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const payload: SessionPayload = { iat: now, exp: now + SESSION_TTL_SECONDS, sub: subject };
  const body = base64url(encoder.encode(JSON.stringify(payload)));
  const key = await hmacKey();
  const sig = await crypto.subtle.sign("HMAC", key, buf(body));
  return `${body}.${base64url(new Uint8Array(sig))}`;
}

export async function verifySession(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [body, sig] = parts as [string, string];
  try {
    const key = await hmacKey();
    const valid = await crypto.subtle.verify("HMAC", key, buf(fromBase64url(sig)), buf(body));
    if (!valid) return null;
    const payload = JSON.parse(new TextDecoder().decode(fromBase64url(body))) as SessionPayload;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export function passwordMatches(input: string): boolean {
  const expected = serverEnv.dashboardPassword;
  if (input.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < input.length; i++) diff |= input.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}

export const sessionCookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_TTL_SECONDS,
};
