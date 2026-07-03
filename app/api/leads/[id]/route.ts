import { isAuthenticated } from "@/lib/auth-guard";
import { supabaseAdmin } from "@/lib/supabase/server";
import type { LeadStage } from "@/lib/db";

export const runtime = "nodejs";

const STAGES: LeadStage[] = [
  "new", "contacted", "opened", "replied", "audit_received", "loom_sent", "follow_up", "won", "lost",
];

/** Changement de stage manuel depuis le dashboard (fallback quand pas de webhook). */
export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }): Promise<Response> {
  if (!(await isAuthenticated())) return new Response("Non autorisé", { status: 401 });

  const { id } = await context.params;
  let body: { stage?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return new Response("JSON invalide", { status: 400 });
  }
  if (!body.stage || !STAGES.includes(body.stage as LeadStage)) {
    return new Response("Stage invalide", { status: 400 });
  }

  const { data, error } = await supabaseAdmin()
    .from("leads")
    .update({ stage: body.stage, last_touch: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .single();
  if (error) return new Response(error.message, { status: 500 });

  return new Response(JSON.stringify({ ok: true, lead: data }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}
