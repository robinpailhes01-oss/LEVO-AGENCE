import { isAuthenticated } from "@/lib/auth-guard";
import { supabaseAdmin } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/resend";
import { emailSignatureHtml } from "@/lib/brand";
import { serverEnv } from "@/lib/env";
import type { Audit, Lead } from "@/lib/db";

export const runtime = "nodejs";

/** Bearer MCP valide ? (auth alternative pour tests). */
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
 * Envoie une relance douce au prospect (après la démo), depuis le dashboard.
 * Renvoie le lien de la démo, met à jour last_touch (repousse le compteur J+3).
 * Ne change pas le stage.
 */
export async function POST(req: Request, context: { params: Promise<{ id: string }> }): Promise<Response> {
  if (!mcpAuthorized(req) && !(await isAuthenticated())) {
    return new Response(JSON.stringify({ ok: false, error: "Non autorisé" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }

  const { id } = await context.params;
  const db = supabaseAdmin();
  const { data: leadRow } = await db.from("leads").select("*").eq("id", id).maybeSingle();
  if (!leadRow) {
    return new Response(JSON.stringify({ ok: false, error: "Lead introuvable" }), {
      status: 404,
      headers: { "content-type": "application/json" },
    });
  }
  const lead = leadRow as Lead;

  const { data: auditRow } = await db
    .from("lead_audits")
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

  const loomLine = audit?.loom_url
    ? `<p>Au cas où elle serait passée inaperçue, je vous la remets ici : <a href="${audit.loom_url}" style="color:#1A3BFF">voir la démo</a>.</p>`
    : "";

  try {
    await sendEmail({
      to,
      replyTo,
      subject: `Petit rappel — ${entreprise}`,
      html: `<p>Bonjour ${prenom},</p>
<p>Je me permets de revenir vers vous, au cas où mon précédent message serait passé inaperçu — je sais que le temps manque.</p>
${loomLine}
<p>Ma proposition tient toujours, sans aucun engagement. Et si ce n'est pas le moment, dites-le moi simplement, je n'insiste pas.</p>
<p>Belle journée,</p>
${emailSignatureHtml()}`,
    });
  } catch (err) {
    console.error("[relance] envoi échoué", err);
    return new Response(JSON.stringify({ ok: false, error: "Échec de l'envoi de l'email." }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }

  await db
    .from("leads")
    .update({ last_touch: new Date().toISOString(), last_event_at: new Date().toISOString() })
    .eq("id", id);

  return new Response(JSON.stringify({ ok: true, sent_to: to }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}
