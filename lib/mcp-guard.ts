import "server-only";
import { serverEnv } from "@/lib/env";

/**
 * Bearer-token guard for the MCP routes.
 * Every /api/mcp/* request must carry `Authorization: Bearer <LEVO_MCP_SECRET>`.
 */
export function authorizeMcp(req: Request): { ok: true } | { ok: false; status: number; message: string } {
  const header = req.headers.get("authorization") ?? "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    return { ok: false, status: 401, message: "Missing bearer token" };
  }
  const token = match[1] ?? "";
  const expected = serverEnv.mcpSecret;
  if (token.length !== expected.length) {
    return { ok: false, status: 403, message: "Invalid token" };
  }
  let diff = 0;
  for (let i = 0; i < token.length; i++) {
    diff |= token.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  if (diff !== 0) {
    return { ok: false, status: 403, message: "Invalid token" };
  }
  return { ok: true };
}

export function mcpUnauthorized(status: number, message: string): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "content-type": "application/json" },
  });
}
