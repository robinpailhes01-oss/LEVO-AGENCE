import { isAuthenticated, mcpAuthorized } from "@/lib/auth-guard";
import { approveAllDrafts } from "@/lib/hermes";

export const runtime = "nodejs";

/** Approuve tous les brouillons Hermes en attente en une fois (traitement de lot). */
export async function POST(req: Request): Promise<Response> {
  if (!mcpAuthorized(req) && !(await isAuthenticated())) {
    return new Response(JSON.stringify({ ok: false, error: "Non autorisé" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }
  try {
    const approved = await approveAllDrafts();
    return new Response(JSON.stringify({ ok: true, approved }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur.";
    return new Response(JSON.stringify({ ok: false, error: message }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}
