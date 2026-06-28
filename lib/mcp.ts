import "server-only";
import { authorizeMcp, mcpUnauthorized } from "@/lib/mcp-guard";

export interface McpTool {
  name: string;
  description: string;
  /** JSON-schema-ish description of the expected input, for discovery. */
  input: Record<string, string>;
  run: (input: Record<string, unknown>) => Promise<unknown>;
}

/** Build a route handler exposing a set of MCP tools over HTTP. */
export function mcpRoute(namespace: string, tools: McpTool[]) {
  const byName = new Map(tools.map((t) => [t.name, t]));

  async function GET(req: Request): Promise<Response> {
    const auth = authorizeMcp(req);
    if (!auth.ok) return mcpUnauthorized(auth.status, auth.message);
    return Response.json({
      namespace,
      tools: tools.map((t) => ({
        name: t.name,
        description: t.description,
        input: t.input,
      })),
    });
  }

  async function POST(req: Request): Promise<Response> {
    const auth = authorizeMcp(req);
    if (!auth.ok) return mcpUnauthorized(auth.status, auth.message);

    let body: { tool?: string; input?: Record<string, unknown> };
    try {
      body = (await req.json()) as typeof body;
    } catch {
      return Response.json({ error: "JSON invalide." }, { status: 400 });
    }

    const tool = body.tool ? byName.get(body.tool) : undefined;
    if (!tool) {
      return Response.json(
        {
          error: `Outil inconnu : ${body.tool ?? "(aucun)"}`,
          available: tools.map((t) => t.name),
        },
        { status: 400 },
      );
    }

    try {
      const result = await tool.run(body.input ?? {});
      return Response.json({ ok: true, tool: tool.name, result });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erreur d'exécution de l'outil.";
      console.error(`[mcp:${namespace}:${tool.name}]`, err);
      return Response.json({ ok: false, error: message }, { status: 500 });
    }
  }

  return { GET, POST };
}

/** Helpers to read typed fields from a loosely-typed input object. */
export function str(input: Record<string, unknown>, key: string): string | undefined {
  const v = input[key];
  return typeof v === "string" && v.length > 0 ? v : undefined;
}

export function num(input: Record<string, unknown>, key: string): number | undefined {
  const v = input[key];
  return typeof v === "number" && Number.isFinite(v) ? v : undefined;
}

export function requireStr(input: Record<string, unknown>, key: string): string {
  const v = str(input, key);
  if (v === undefined) throw new Error(`Champ requis manquant : ${key}`);
  return v;
}
