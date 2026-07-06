import { supabaseAdmin } from "@/lib/supabase/server";
import { serverEnv } from "@/lib/env";
import { nextStage } from "@/lib/lead-stage";
import { sendEmail } from "@/lib/resend";
import { emailSignatureHtml } from "@/lib/brand";
import type { LeadStage } from "@/lib/db";

export const runtime = "nodejs";

/**
 * Reçoit la soumission d'un audit depuis le site vitrine (levo-plum.vercel.app,
 * projet séparé). Même protection par token partagé que le webhook Instantly.
 *
 * Attendu en body JSON : { lead_id: string, answers: object, loom_url?: string }
 * `lead_id` est celui déjà présent dans le lien envoyé par ORION
 * (`{AUDIT_SITE_URL}/audit?lead=<id>`) — à faire suivre tel quel par le
 * formulaire du site vitrine.
 */

function tokenValid(req: Request): boolean {
  const url = new URL(req.url);
  const token = url.searchParams.get("token") ?? "";
  let expected: string;
  try {
    expected = serverEnv.mcpSecret;
  } catch {
    return false;
  }
  if (token.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < token.length; i++) diff |= token.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}

export async function POST(req: Request): Promise<Response> {
  if (!tokenValid(req)) return new Response("Token invalide", { status: 403 });

  let body: { lead_id?: string; answers?: Record<string, unknown>; loom_url?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return new Response("JSON invalide", { status: 400 });
  }

  console.log("[webhook:audit]", JSON.stringify(body));

  const db = supabaseAdmin();
  const answers = body.answers ?? {};
  const answerEmail = typeof answers.email === "string" ? answers.email.trim().toLowerCase() : null;

  type LeadRow = {
    id: string; stage: LeadStage; niche_id: string | null;
    email: string | null; company: string | null; full_name: string | null;
  };
  const cols = "id, stage, niche_id, email, company, full_name";

  // 1) Lien personnalisé (?lead=<id>) → on rattache à ce lead précis.
  let row: LeadRow | null = null;
  if (body.lead_id) {
    const { data } = await db.from("leads").select(cols).eq("id", body.lead_id).maybeSingle();
    row = (data as LeadRow | null) ?? null;
  }
  // 2) Sinon, si l'email correspond à un lead déjà en base → on le rattache (pas de doublon).
  if (!row && answerEmail) {
    const { data } = await db.from("leads").select(cols).ilike("email", answerEmail).maybeSingle();
    row = (data as LeadRow | null) ?? null;
  }
  // 3) Sinon → nouveau lead créé depuis les réponses de l'audit, directement en "Audit reçu".
  if (!row) {
    if (!answerEmail) {
      return new Response(JSON.stringify({ ok: false, error: "Ni lead_id ni email — audit ignoré." }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }
    const prenom = typeof answers.prenom === "string" ? answers.prenom : null;
    const nom = typeof answers.nom === "string" ? answers.nom : null;
    const entreprise = typeof answers.entreprise === "string" ? answers.entreprise : null;
    const secteur = typeof answers.secteur === "string" ? answers.secteur : null;
    const fullName = [prenom, nom].filter(Boolean).join(" ") || entreprise || answerEmail;
    const { data: created, error: createErr } = await db
      .from("leads")
      .insert({
        email: answerEmail,
        first_name: prenom,
        full_name: fullName,
        company: entreprise,
        sector: secteur,
        source: "website",
        status: "responded",
        stage: "audit_received",
        assigned_agent: "ORION",
        exported_at: new Date().toISOString(), // déjà entrant : ne pas le renvoyer en campagne
      })
      .select(cols)
      .single();
    if (createErr) throw new Error(createErr.message);
    row = created as LeadRow;
  }

  await db.from("audits").insert({
    lead_id: row.id,
    niche_id: row.niche_id,
    status: "completed",
    answers,
    submitted_at: new Date().toISOString(),
    loom_url: body.loom_url ?? null,
  });

  await db
    .from("leads")
    .update({ stage: nextStage(row.stage, "audit_received"), last_event_at: new Date().toISOString() })
    .eq("id", row.id);

  const { data: lastSent } = await db
    .from("email_events")
    .select("meta")
    .eq("lead_id", row.id)
    .eq("type", "sent")
    .order("occurred_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const sendingInbox =
    lastSent && typeof (lastSent as { meta: Record<string, unknown> }).meta?.email_account === "string"
      ? ((lastSent as { meta: Record<string, unknown> }).meta.email_account as string)
      : null;

  await sendAuditEmails(row, answers, sendingInbox);

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

/** Best-effort — un échec d'envoi d'email ne doit jamais faire échouer l'enregistrement de l'audit. */
async function sendAuditEmails(
  lead: { email: string | null; company: string | null; full_name: string | null },
  answers: Record<string, unknown>,
  sendingInbox: string | null,
): Promise<void> {
  const prenom = typeof answers.prenom === "string" ? answers.prenom : null;
  const submitterEmail = typeof answers.email === "string" ? answers.email : lead.email;
  const entreprise = typeof answers.entreprise === "string" ? answers.entreprise : lead.company ?? lead.full_name;
  const heures = typeof answers.heures_perdues_semaine === "number" ? answers.heures_perdues_semaine : null;
  const perte = typeof answers.perte_mensuelle_estimee === "number" ? answers.perte_mensuelle_estimee : null;

  if (submitterEmail) {
    try {
      await sendEmail({
        to: submitterEmail,
        subject: "Votre audit gratuit est bien reçu",
        replyTo: sendingInbox ?? undefined,
        html: `<p>Bonjour ${prenom ?? ""},</p>
<p>Merci d'avoir rempli votre audit gratuit — c'est bien reçu.</p>
<p>Je prépare maintenant votre démo personnalisée à partir de vos réponses, vous aurez de mes nouvelles très vite.</p>
<p>À bientôt,</p>
${emailSignatureHtml()}`,
      });
    } catch (err) {
      console.error("[webhook:audit] email client échoué", err);
    }
  }

  const notifyTo = serverEnv.emailTo;
  if (notifyTo) {
    try {
      await sendEmail({
        to: notifyTo,
        subject: `Nouvel audit reçu — ${entreprise ?? "sans nom"}`,
        html: `<p>Nouvel audit rempli par <strong>${entreprise ?? "—"}</strong>${prenom ? ` (${prenom})` : ""}.</p>
<p>Heures perdues/semaine : ${heures ?? "—"}<br/>Perte estimée/mois : ${perte ?? "—"} €</p>
<p><a href="https://levo-agence.vercel.app/dashboard/orion">Voir dans le dashboard</a></p>`,
      });
    } catch (err) {
      console.error("[webhook:audit] email notif échoué", err);
    }
  }
}
