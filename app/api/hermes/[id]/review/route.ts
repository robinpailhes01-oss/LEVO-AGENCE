import { isAuthenticated, mcpAuthorized } from "@/lib/auth-guard";
import { reviewHermesAnalysis } from "@/lib/hermes";

export const runtime = "nodejs";

/** Approuve / rejette / édite un brouillon Hermes, depuis le dashboard. */
export async function POST(req: Request, context: { params: Promise<{ id: string }> }): Promise<Response> {
  if (!mcpAuthorized(req) && !(await isAuthenticated())) {
    return new Response(JSON.stringify({ ok: false, error: "Non autorisé" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }

  const { id } = await context.params;
  let body: { action?: string; email_body?: string; subject_line?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return new Response("JSON invalide", { status: 400 });
  }
  if (body.action !== "approve" && body.action !== "reject" && body.action !== "edit") {
    return new Response(JSON.stringify({ ok: false, error: "action doit être approve, reject ou edit." }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  try {
    const analysis = await reviewHermesAnalysis(id, body.action, {
      email_body: body.email_body,
      subject_line: body.subject_line,
    });
    return new Response(JSON.stringify({ ok: true, analysis }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur de validation.";
    console.error("[hermes:review]", err);
    return new Response(JSON.stringify({ ok: false, error: message }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}
