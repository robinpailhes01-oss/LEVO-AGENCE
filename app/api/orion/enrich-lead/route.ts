import { NextResponse } from "next/server";
import { withHandler, jsonOk, jsonError } from "@/lib/api";
import { isAuthenticated } from "@/lib/auth-guard";
import { supabaseAdmin } from "@/lib/supabase/server";
import { callClaudeJson } from "@/lib/claude";
import { logActivity } from "@/lib/log";
import { ORION_ENRICH_SYSTEM, ORION_SCORING_RUBRIC } from "@/prompts/orion";
import type { Lead } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

interface Body {
  leadId?: string;
}

interface Enrichment {
  niche: string;
  score: number;
  signals: string[];
  angles: string[];
  rationale: string;
}

export async function POST(req: Request): Promise<NextResponse> {
  return withHandler(async () => {
    if (!(await isAuthenticated())) return jsonError("Non autorisé.", 401);

    const body = (await req.json().catch(() => ({}))) as Body;
    if (!body.leadId) return jsonError("leadId requis.", 400);

    const db = supabaseAdmin();
    const { data: row, error: fetchErr } = await db
      .from("leads")
      .select("*")
      .eq("id", body.leadId)
      .maybeSingle();
    if (fetchErr) return jsonError(fetchErr.message, 500);
    if (!row) return jsonError("Lead introuvable.", 404);

    const lead = row as Lead;

    const prompt = `Prospect à enrichir et scorer :
- Nom : ${lead.name}
- Entreprise : ${lead.company ?? "—"}
- Niche déclarée : ${lead.niche ?? "—"}
- Localisation : ${lead.location ?? "—"}
- Site : ${lead.website ?? "—"}
- Instagram : ${lead.instagram_handle ?? "—"}
- Notes : ${lead.notes ?? "—"}

${ORION_SCORING_RUBRIC}

Renvoie un JSON : { "niche": string, "score": number (0-100), "signals": string[], "angles": string[], "rationale": string }.`;

    const result = await callClaudeJson<Enrichment>({
      system: ORION_ENRICH_SYSTEM,
      prompt,
      maxTokens: 1200,
      temperature: 0.5,
    });

    const score = Math.min(Math.max(Math.round(result.score ?? 0), 0), 100);

    const { data: updated, error: updErr } = await db
      .from("leads")
      .update({
        niche: result.niche || lead.niche,
        score,
        status: lead.status === "new" ? "enriched" : lead.status,
        enrichment: {
          niche: result.niche,
          signals: result.signals ?? [],
          angles: result.angles ?? [],
          rationale: result.rationale ?? "",
        },
      })
      .eq("id", lead.id)
      .select("*")
      .single();
    if (updErr) return jsonError(updErr.message, 500);

    await logActivity({
      agent: "orion",
      action: `a enrichi ${lead.name} (score ${score})`,
      summary: result.rationale?.slice(0, 140),
      entityType: "lead",
      entityId: lead.id,
      status: "success",
      metadata: { score },
    });

    return jsonOk(updated as Lead);
  });
}
