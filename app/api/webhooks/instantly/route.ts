import { supabaseAdmin } from "@/lib/supabase/server";
import { serverEnv } from "@/lib/env";
import { nextStage } from "@/lib/lead-stage";
import type { EmailEventType, LeadStage } from "@/lib/db";

export const runtime = "nodejs";

/**
 * Webhook Instantly.ai (v2) — événements campagne branchés ici pour tenir le
 * dashboard "en live" : ouverture/clic/réponse mettent à jour `stage` du lead
 * et alimentent `email_events` / `replies` (voir supabase/outreach.sql).
 *
 * Sécurité : Instantly ne signe pas ses webhooks. On protège via un token
 * partagé en query (?token=LEVO_MCP_SECRET) mis dans l'URL du webhook côté
 * Instantly — pas de nouvelle clé à gérer.
 *
 * Champs vérifiés dans la doc (developer.instantly.ai/webhook-events) :
 * timestamp, event_type, campaign_id, campaign_name, lead_email,
 * email_account, reply_subject, reply_text.
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

const EVENT_MAP: Record<string, EmailEventType | undefined> = {
  email_sent: "sent",
  email_opened: "opened",
  link_clicked: "clicked",
  reply_received: "replied",
  email_bounced: "bounced",
  lead_unsubscribed: "unsubscribed",
};

export async function POST(req: Request): Promise<Response> {
  if (!tokenValid(req)) return new Response("Token invalide", { status: 403 });

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return new Response("JSON invalide", { status: 400 });
  }

  // Toujours loggé — utile pour ajuster le mapping face à la vraie forme du payload.
  console.log("[webhook:instantly]", JSON.stringify(body));

  const eventType = String(body.event_type ?? "");
  const leadEmail = typeof body.lead_email === "string" ? body.lead_email : undefined;
  const occurredAt = typeof body.timestamp === "string" ? body.timestamp : new Date().toISOString();
  const mappedType = EVENT_MAP[eventType];

  const db = supabaseAdmin();

  let leadId: string | null = null;
  let currentStage: LeadStage = "new";
  if (leadEmail) {
    const { data: lead } = await db.from("leads").select("id, stage").eq("email", leadEmail).maybeSingle();
    if (lead) {
      leadId = (lead as { id: string }).id;
      currentStage = (lead as { stage: LeadStage }).stage;
    }
  }

  if (mappedType) {
    await db.from("email_events").insert({
      lead_id: leadId,
      type: mappedType,
      occurred_at: occurredAt,
      meta: body,
    });
  }

  if (leadId) {
    const patch: Record<string, unknown> = { last_event_at: occurredAt };

    if (eventType === "email_sent") patch.stage = nextStage(currentStage, "contacted");
    if (eventType === "email_opened") patch.stage = nextStage(currentStage, "opened");
    if (eventType === "lead_unsubscribed") patch.stage = nextStage(currentStage, "lost");

    if (eventType === "email_opened") {
      const { data: leadRow } = await db.from("leads").select("opens").eq("id", leadId).maybeSingle();
      patch.opens = ((leadRow as { opens: number } | null)?.opens ?? 0) + 1;
    }

    if (eventType === "reply_received") {
      patch.stage = nextStage(currentStage, "replied");
      await db.from("replies").insert({
        lead_id: leadId,
        from_email: leadEmail ?? null,
        to_inbox: typeof body.email_account === "string" ? body.email_account : null,
        subject: typeof body.reply_subject === "string" ? body.reply_subject : null,
        body: typeof body.reply_text === "string" ? body.reply_text : null,
        received_at: occurredAt,
        is_read: false,
      });
    }

    await db.from("leads").update(patch).eq("id", leadId);
  }

  return new Response(JSON.stringify({ ok: true, matched_lead: !!leadId }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}
