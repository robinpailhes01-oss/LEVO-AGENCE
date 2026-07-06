import { isAuthenticated } from "@/lib/auth-guard";
import { supabaseAdmin } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/resend";
import { emailSignatureHtml } from "@/lib/brand";
import { nextStage } from "@/lib/lead-stage";
import { serverEnv } from "@/lib/env";
import type { Audit, Lead, LeadStage } from "@/lib/db";

export const runtime = "nodejs";

/** Bearer MCP valide ? (auth alternative pour tests/automatisation). */
function mcpAuthorized(req: Request): boolean {
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

/**
 * Envoie la démo personnalisée (lien Loom) au prospect depuis le dashboard,
 * puis fait avancer le lead au stage `loom_sent`. Auth : session dashboard
 * (navigateur de Robin) OU Bearer MCP (tests/automatisation).
 */
export async function POST(req: Request, context: { params: Promise<{ id: string }> }): Promise<Response> {
  if (!mcpAuthorized(req) && !(await isAuthenticated())) {
    return new Response(JSON.stringify({ ok: false, error: "Non autorisé" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }

  const { id } = await context.params;
  let body: { loom_url?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return new Response("JSON invalide", { status: 400 });
  }
  const loomUrl = (body.loom_url ?? "").trim();
  if (!loomUrl || !/^https?:\/\//i.test(loomUrl)) {
    return new Response(JSON.stringify({ ok: false, error: "Lien invalide (doit commencer par http)." }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  const db = supabaseAdmin();
  const { data: leadRow } = await db.from("leads").select("*").eq("id", id).maybeSingle();
  if (!leadRow) {
    return new Response(JSON.stringify({ ok: false, error: "Lead introuvable" }), {
      status: 404,
      headers: { "content-type": "application/json" },
    });
  }
  const lead = leadRow as Lead;

  // Dernier audit du lead → prénom + entreprise + email de contact fournis dans l'audit.
  const { data: auditRow } = await db
    .from("audits")
    .select("*")
    .eq("lead_id", id)
    .order("submitted_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const audit = auditRow as Audit | null;
  const answers = (audit?.answers ?? {}) as Record<string, unknown>;

  const prenom = typeof answers.prenom === "string" ? answers.prenom : lead.first_name ?? "";
  const entreprise =
    typeof answers.entreprise === "string" ? answers.entreprise : lead.company ?? lead.full_name ?? "votre entreprise";
  const to = typeof answers.email === "string" ? answers.email : lead.email;
  if (!to) {
    return new Response(JSON.stringify({ ok: false, error: "Aucun email pour ce lead." }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  // On répond depuis la même boîte qui a envoyé le cold email (reply-to).
  const { data: lastSent } = await db
    .from("email_events")
    .select("meta")
    .eq("lead_id", id)
    .eq("type", "sent")
    .order("occurred_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const replyTo =
    lastSent && typeof (lastSent as { meta: Record<string, unknown> }).meta?.email_account === "string"
      ? ((lastSent as { meta: Record<string, unknown> }).meta.email_account as string)
      : undefined;

  try {
    await sendEmail({
      to,
      replyTo,
      subject: `Votre démo personnalisée — ${entreprise}`,
      html: `<p>Bonjour ${prenom},</p>
<p>Comme promis, j'ai préparé une démo personnalisée pour ${entreprise} à partir de vos réponses.</p>
<p>👉 <a href="${loomUrl}" style="color:#1A3BFF">Voir votre démo</a></p>
<p>Dites-moi ce que vous en pensez — et si vous voulez, on en discute 15 minutes.</p>
${emailSignatureHtml()}`,
    });
  } catch (err) {
    console.error("[loom] envoi échoué", err);
    return new Response(JSON.stringify({ ok: false, error: "Échec de l'envoi de l'email." }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }

  // Trace le loom sur l'audit (si présent) + avance le stage.
  if (audit) {
    await db.from("audits").update({ loom_url: loomUrl }).eq("id", audit.id);
  }
  const newStage = nextStage(lead.stage as LeadStage, "loom_sent");
  await db
    .from("leads")
    .update({ stage: newStage, last_touch: new Date().toISOString(), last_event_at: new Date().toISOString() })
    .eq("id", id);

  return new Response(JSON.stringify({ ok: true, stage: newStage, sent_to: to }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}
