import { isAuthenticated, mcpAuthorized } from "@/lib/auth-guard";
import { runHermesAnalysis } from "@/lib/hermes";

export const runtime = "nodejs";
export const maxDuration = 60;

/** Déclenche une analyse Hermes pour un lead, depuis le dashboard (bouton "Analyser"). */
export async function POST(req: Request): Promise<Response> {
  if (!mcpAuthorized(req) && !(await isAuthenticated())) {
    return new Response(JSON.stringify({ ok: false, error: "Non autorisé" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }

  let body: { lead_id?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return new Response("JSON invalide", { status: 400 });
  }
  const leadId = (body.lead_id ?? "").trim();
  if (!leadId) {
    return new Response(JSON.stringify({ ok: false, error: "lead_id requis" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  try {
    const analysis = await runHermesAnalysis(leadId);
    return new Response(JSON.stringify({ ok: true, analysis }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur d'analyse.";
    console.error("[hermes:analyze]", err);
    return new Response(JSON.stringify({ ok: false, error: message }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}
