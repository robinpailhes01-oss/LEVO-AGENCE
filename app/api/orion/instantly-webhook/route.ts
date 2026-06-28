import { NextResponse } from "next/server";
import { withHandler, jsonOk, jsonError } from "@/lib/api";
import { serverEnv } from "@/lib/env";
import { supabaseAdmin } from "@/lib/supabase/server";
import { logActivity } from "@/lib/log";

export const runtime = "nodejs";

/**
 * Inbound webhook for Instantly.ai reply events.
 * Secured with a shared secret in the `token` query param (set in the
 * Instantly webhook URL). On a reply, the matching lead moves to "replied".
 */
interface InstantlyEvent {
  event_type?: string;
  lead_email?: string;
  email?: string;
  reply_text?: string;
}

export async function POST(req: Request): Promise<NextResponse> {
  return withHandler(async () => {
    const url = new URL(req.url);
    const token = url.searchParams.get("token") ?? "";
    if (token !== serverEnv.mcpSecret) {
      return jsonError("Non autorisé.", 401);
    }

    const event = (await req.json().catch(() => ({}))) as InstantlyEvent;
    const email = (event.lead_email ?? event.email ?? "").toLowerCase().trim();
    if (!email) return jsonError("Email du lead manquant.", 400);

    const db = supabaseAdmin();
    const { data: lead } = await db
      .from("leads")
      .select("id, name, status")
      .ilike("email", email)
      .maybeSingle();

    if (!lead) {
      // Not a tracked lead — acknowledge without failing the webhook.
      return jsonOk({ matched: false });
    }

    const isReply = (event.event_type ?? "").toLowerCase().includes("reply");
    if (isReply) {
      await db
        .from("leads")
        .update({
          status: "replied",
          notes: event.reply_text
            ? `Réponse Instantly : ${event.reply_text}`
            : undefined,
        })
        .eq("id", (lead as { id: string }).id);

      await logActivity({
        agent: "orion",
        action: `réponse reçue de ${(lead as { name: string }).name}`,
        summary: event.reply_text?.slice(0, 160),
        entityType: "lead",
        entityId: (lead as { id: string }).id,
        status: "success",
      });
    }

    return jsonOk({ matched: true });
  });
}
