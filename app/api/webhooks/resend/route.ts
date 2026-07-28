import { supabaseAdmin } from "@/lib/supabase/server";
import { serverEnv } from "@/lib/env";
import { nextStage } from "@/lib/lead-stage";
import type { EmailEventType, LeadStage } from "@/lib/db";

export const runtime = "nodejs";

/**
 * Webhook Resend — même rôle que /api/webhooks/instantly, pour la campagne
 * hébergement/établissements envoyée directement via Resend (pas Instantly).
 * Resend ne détecte pas les réponses (ce n'est pas une boîte de réception
 * gérée comme Instantly) — "replied" reste marqué à la main dans le
 * dashboard, comme le reste du pipeline ORION. Ce webhook couvre donc
 * sent/opened/clicked/bounced/complained uniquement.
 *
 * Sécurité : comme Instantly, token partagé en query (?token=LEVO_MCP_SECRET)
 * posé dans l'URL du webhook côté Resend.
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
  "email.sent": "sent",
  "email.opened": "opened",
  "email.clicked": "clicked",
  "email.bounced": "bounced",
  "email.complained": "unsubscribed",
};

export async function POST(req: Request): Promise<Response> {
  if (!tokenValid(req)) return new Response("Token invalide", { status: 403 });

  let body: { type?: string; data?: Record<string, unknown> };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return new Response("JSON invalide", { status: 400 });
  }

  console.log("[webhook:resend]", JSON.stringify(body));

  const eventType = body.type ?? "";
  const mappedType = EVENT_MAP[eventType];
  const data = body.data ?? {};
  const to = Array.isArray(data.to) ? (data.to as string[])[0] : undefined;
  const occurredAt = typeof data.created_at === "string" ? data.created_at : new Date().toISOString();

  const db = supabaseAdmin();

  let leadId: string | null = null;
  let currentStage: LeadStage = "new";
  if (to) {
    const { data: lead } = await db.from("leads").select("id, stage").eq("email", to).maybeSingle();
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
    if (eventType === "email.sent") patch.stage = nextStage(currentStage, "contacted");
    if (eventType === "email.opened") {
      patch.stage = nextStage(currentStage, "opened");
      const { data: leadRow } = await db.from("leads").select("opens").eq("id", leadId).maybeSingle();
      patch.opens = ((leadRow as { opens: number } | null)?.opens ?? 0) + 1;
    }
    if (eventType === "email.complained") patch.stage = nextStage(currentStage, "lost");

    await db.from("leads").update(patch).eq("id", leadId);
  }

  return new Response(JSON.stringify({ ok: true, matched_lead: !!leadId }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}
