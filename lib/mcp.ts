import "server-only";
import { serverEnv } from "@/lib/env";

/**
 * Mini-framework MCP « Levo ».
 * Chaque route expose un namespace + une liste d'outils sur HTTP :
 *   GET  → découverte (liste des outils + schéma d'entrée)
 *   POST { tool, input } → exécution d'un outil
 * Sécurisé par `Authorization: Bearer LEVO_MCP_SECRET`.
 */

export interface McpTool {
  name: string;
  description: string;
  /** Description type-JSON-schema des entrées, pour la découverte. */
  input: Record<string, string>;
  run: (input: Record<string, unknown>) => Promise<unknown>;
}

function authorize(req: Request): { ok: true } | { ok: false; status: number; message: string } {
  const header = req.headers.get("authorization") ?? "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) return { ok: false, status: 401, message: "Token Bearer manquant" };
  const token = match[1] ?? "";
  let expected: string;
  try {
    expected = serverEnv.mcpSecret;
  } catch {
    return { ok: false, status: 500, message: "LEVO_MCP_SECRET non configuré" };
  }
  if (token.length !== expected.length) {
    return { ok: false, status: 403, message: "Token invalide" };
  }
  let diff = 0;
  for (let i = 0; i < token.length; i++) {
    diff |= token.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  if (diff !== 0) return { ok: false, status: 403, message: "Token invalide" };
  return { ok: true };
}

/** Construit un handler de route exposant un ensemble d'outils MCP. */
export function mcpRoute(namespace: string, tools: McpTool[]) {
  const byName = new Map(tools.map((t) => [t.name, t]));

  async function GET(req: Request): Promise<Response> {
    const auth = authorize(req);
    if (!auth.ok) return json({ error: auth.message }, auth.status);
    return json({
      namespace,
      tools: tools.map((t) => ({
        name: t.name,
        description: t.description,
        input: t.input,
      })),
    });
  }

  async function POST(req: Request): Promise<Response> {
    const auth = authorize(req);
    if (!auth.ok) return json({ error: auth.message }, auth.status);

    let body: { tool?: string; input?: Record<string, unknown> };
    try {
      body = (await req.json()) as typeof body;
    } catch {
      return json({ error: "JSON invalide." }, 400);
    }

    const tool = body.tool ? byName.get(body.tool) : undefined;
    if (!tool) {
      return json(
        { error: `Outil inconnu : ${body.tool ?? "(aucun)"}`, available: tools.map((t) => t.name) },
        400,
      );
    }

    try {
      const result = await tool.run(body.input ?? {});
      return json({ ok: true, tool: tool.name, result });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur d'exécution.";
      console.error(`[mcp:${namespace}:${tool.name}]`, err);
      return json({ ok: false, error: message }, 500);
    }
  }

  return { GET, POST };
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

/* ---- Helpers de lecture typée des entrées ---- */
export function str(input: Record<string, unknown>, key: string): string | undefined {
  const v = input[key];
  return typeof v === "string" && v.length > 0 ? v : undefined;
}
export function num(input: Record<string, unknown>, key: string): number | undefined {
  const v = input[key];
  return typeof v === "number" && Number.isFinite(v) ? v : undefined;
}
export function arr(input: Record<string, unknown>, key: string): string[] | undefined {
  const v = input[key];
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : undefined;
}
export function obj(input: Record<string, unknown>, key: string): Record<string, unknown> | undefined {
  const v = input[key];
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : undefined;
}
export function requireStr(input: Record<string, unknown>, key: string): string {
  const v = str(input, key);
  if (v === undefined) throw new Error(`Champ requis manquant : ${key}`);
  return v;
}
