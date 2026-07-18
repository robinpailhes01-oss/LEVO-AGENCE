import { isAuthenticated, mcpAuthorized } from "@/lib/auth-guard";
import { supabaseAdmin } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/resend";
import { emailSignatureHtml } from "@/lib/brand";
import { serverEnv } from "@/lib/env";
import type { Lead, Reply } from "@/lib/db";

export const runtime = "nodejs";

/**
 * Une fois qu'un prospect répond à un mail Hermes, on lui envoie le lien de
 * l'audit — c'est ce qui permet de préparer une démo vraiment personnalisée.
 * Un seul clic depuis la cloche de notifications, jamais d'envoi automatique.
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

  const { data: replyRow } = await db.from("replies").select("*").eq("id", id).maybeSingle();
  if (!replyRow) {
    return new Response(JSON.stringify({ ok: false, error: "Réponse introuvable" }), {
      status: 404,
      headers: { "content-type": "application/json" },
    });
  }
  const reply = replyRow as Reply;
  const to = reply.from_email;
  if (!to) {
    return new Response(JSON.stringify({ ok: false, error: "Pas d'email pour cette réponse." }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  let lead: Lead | null = null;
  if (reply.lead_id) {
    const { data } = await db.from("leads").select("*").eq("id", reply.lead_id).maybeSingle();
    lead = (data as Lead) ?? null;
  }
  // Filet de sécurité : si le webhook Instantly n'a pas su rattacher la réponse
  // à un lead (ex: reply.lead_id jamais renseigné), on retente par email — sans
  // ça le lien d'audit partirait sans ?lead=, donc identique pour tout le monde.
  if (!lead) {
    const { data } = await db.from("leads").select("*").ilike("email", to).maybeSingle();
    lead = (data as Lead) ?? null;
  }
  if (!lead) {
    return new Response(
      JSON.stringify({ ok: false, error: `Aucun lead trouvé pour ${to} — impossible de générer un lien d'audit personnalisé.` }),
      { status: 404, headers: { "content-type": "application/json" } },
    );
  }

  // Priorité au prénom trouvé par Hermes sur le site (souvent plus fiable que lead.first_name).
  let firstName = lead.first_name ?? "";
  const { data: analysis } = await db
    .from("hermes_analyses")
    .select("contact_first_name")
    .eq("lead_id", lead.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const found = (analysis as { contact_first_name: string | null } | null)?.contact_first_name;
  if (found) firstName = found;

  const greeting = firstName ? `Bonjour ${firstName},` : "Bonjour,";
  const auditLink = `${serverEnv.auditSiteUrl}/audit?lead=${lead.id}`;

  try {
    await sendEmail({
      to,
      replyTo: reply.to_inbox ?? undefined,
      subject: "Voici le lien",
      html: `<p>${greeting}</p>
<p>Merci pour votre retour !</p>
<p>Pour vous préparer une démo vraiment personnalisée, j'ai besoin de mieux comprendre votre quotidien — j'ai un audit gratuit et rapide pour ça.</p>
<p>En le remplissant, je pourrai vous créer une courte démo personnalisée, adaptée à votre entreprise :</p>
<p>👉 <a href="${auditLink}" style="color:#1A3BFF">${auditLink}</a></p>
<p>À très vite,</p>
${emailSignatureHtml()}`,
    });
  } catch (err) {
    console.error("[replies:send-audit]", err);
    return new Response(JSON.stringify({ ok: false, error: "Échec de l'envoi de l'email." }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }

  await db.from("replies").update({ is_read: true }).eq("id", id);
  await db.from("leads").update({ last_touch: new Date().toISOString(), last_event_at: new Date().toISOString() }).eq("id", lead.id);

  return new Response(JSON.stringify({ ok: true, sent_to: to, audit_link: auditLink }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}
