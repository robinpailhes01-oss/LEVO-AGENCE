import { supabaseAdmin } from "@/lib/supabase/server";
import { serverEnv } from "@/lib/env";
import { nextStage } from "@/lib/lead-stage";
import { sendEmail } from "@/lib/resend";
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

  if (!body.lead_id) {
    return new Response(JSON.stringify({ ok: false, error: "`lead_id` requis" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  const db = supabaseAdmin();
  const { data: lead } = await db
    .from("leads")
    .select("id, stage, niche_id, email, company, full_name")
    .eq("id", body.lead_id)
    .maybeSingle();
  if (!lead) {
    return new Response(JSON.stringify({ ok: false, error: "Lead introuvable" }), {
      status: 404,
      headers: { "content-type": "application/json" },
    });
  }
  const row = lead as {
    id: string; stage: LeadStage; niche_id: string | null;
    email: string | null; company: string | null; full_name: string | null;
  };
  const answers = body.answers ?? {};

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

  await sendAuditEmails(row, answers);

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

/** Best-effort — un échec d'envoi d'email ne doit jamais faire échouer l'enregistrement de l'audit. */
async function sendAuditEmails(
  lead: { email: string | null; company: string | null; full_name: string | null },
  answers: Record<string, unknown>,
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
        html: `<p>Bonjour ${prenom ?? ""},</p>
<p>Merci d'avoir rempli votre audit gratuit — c'est bien reçu.</p>
<p>Robin prépare maintenant votre démo personnalisée à partir de vos réponses, vous aurez de ses nouvelles très vite.</p>
<p>À bientôt,<br/>L'équipe Levo</p>`,
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
