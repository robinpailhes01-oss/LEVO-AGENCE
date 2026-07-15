import "server-only";
import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySession, authEnabled } from "@/lib/auth";
import { serverEnv } from "@/lib/env";

/** True si la requête a une session valide (ou si l'auth n'est pas activée). */
export async function isAuthenticated(): Promise<boolean> {
  if (!authEnabled()) return true;
  const token = cookies().get(SESSION_COOKIE)?.value;
  return (await verifySession(token)) !== null;
}

/** True si la requête porte un Bearer = LEVO_MCP_SECRET (auth automatisation). */
export function mcpAuthorized(req: Request): boolean {
  const header = req.headers.get("authorization") ?? "";
  const m = header.match(/^Bearer\s+(.+)$/i);
  if (!m) return false;
  let expected: string;
  try {
    expected = serverEnv.mcpSecret;
  } catch {
    return false;
  }
  const token = m[1] ?? "";
  if (token.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < token.length; i++) diff |= token.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}
