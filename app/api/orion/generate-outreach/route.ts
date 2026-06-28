import { NextResponse } from "next/server";
import { withHandler, jsonOk, jsonError } from "@/lib/api";
import { isAuthenticated } from "@/lib/auth-guard";
import { supabaseAdmin } from "@/lib/supabase/server";
import { callClaudeJson } from "@/lib/claude";
import { logActivity } from "@/lib/log";
import { ORION_OUTREACH_SYSTEM } from "@/prompts/orion";
import type { Lead } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

interface Body {
  leadId?: string;
}

interface Variant {
  label: string;
  subject: string;
  body: string;
  followup: string;
}

export async function POST(req: Request): Promise<NextResponse> {
  return withHandler(async () => {
    if (!(await isAuthenticated())) return jsonError("Non autorisé.", 401);

    const body = (await req.json().catch(() => ({}))) as Body;
    if (!body.leadId) return jsonError("leadId requis.", 400);

    const db = supabaseAdmin();
    const { data: row } = await db
      .from("leads")
      .select("*")
      .eq("id", body.leadId)
      .maybeSingle();
    if (!row) return jsonError("Lead introuvable.", 404);

    const lead = row as Lead;
    const enrichment = lead.enrichment as { angles?: string[] } | null;

    const prompt = `Prospect :
- Nom : ${lead.name}
- Entreprise : ${lead.company ?? "—"}
- Niche : ${lead.niche ?? "—"}
- Localisation : ${lead.location ?? "—"}
- Angles d'accroche connus : ${enrichment?.angles?.join(" | ") ?? "—"}

Produis une séquence d'outreach en TEST A/B.
Renvoie un JSON : { "variants": [ { "label": "A", "subject": string, "body": string, "followup": string }, { "label": "B", "subject": string, "body": string, "followup": string } ] }.`;

    const result = await callClaudeJson<{ variants: Variant[] }>({
      system: ORION_OUTREACH_SYSTEM,
      prompt,
      maxTokens: 1500,
      temperature: 0.8,
    });

    const variants = Array.isArray(result.variants)
      ? result.variants.slice(0, 2)
      : [];
    if (variants.length === 0) return jsonError("Aucune variante générée.", 502);

    await db
      .from("leads")
      .update({ status: lead.status === "enriched" ? "contacted" : lead.status })
      .eq("id", lead.id);

    await logActivity({
      agent: "orion",
      action: `a généré une séquence A/B pour ${lead.name}`,
      entityType: "lead",
      entityId: lead.id,
      status: "success",
    });

    return jsonOk({ variants });
  });
}
