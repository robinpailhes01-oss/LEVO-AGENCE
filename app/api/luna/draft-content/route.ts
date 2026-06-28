import { NextResponse } from "next/server";
import { withHandler, jsonOk, jsonError } from "@/lib/api";
import { isAuthenticated } from "@/lib/auth-guard";
import { supabaseAdmin } from "@/lib/supabase/server";
import { callClaudeJson } from "@/lib/claude";
import { logActivity } from "@/lib/log";
import { LUNA_DRAFT_SYSTEM } from "@/prompts/luna";
import type { ContentItem } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 90;

interface Body {
  contentId?: string;
}

interface SlideDraft {
  headline: string;
  body: string;
  image_prompt: string;
}

interface DraftResult {
  slides: SlideDraft[];
  caption: string;
  hashtags: string[];
}

export async function POST(req: Request): Promise<NextResponse> {
  return withHandler(async () => {
    if (!(await isAuthenticated())) return jsonError("Non autorisé.", 401);

    const body = (await req.json().catch(() => ({}))) as Body;
    if (!body.contentId) return jsonError("contentId requis.", 400);

    const db = supabaseAdmin();
    const { data: item, error: fetchErr } = await db
      .from("content_calendar")
      .select("*")
      .eq("id", body.contentId)
      .maybeSingle();
    if (fetchErr) return jsonError(fetchErr.message, 500);
    if (!item) return jsonError("Contenu introuvable.", 404);

    const content = item as ContentItem;

    const prompt = `Rédige un carrousel complet pour cette idée :
- Titre : ${content.title}
- Hook : ${content.hook ?? "(à créer)"}
- Pilier : ${content.pillar ?? "—"}
- Thème : ${content.topic ?? "—"}

Renvoie un JSON : { "slides": [ { "headline": string, "body": string, "image_prompt": string (en anglais) } ], "caption": string, "hashtags": string[] }.
Vise 8 à 10 slides. La slide 1 est le hook, la dernière est un CTA.`;

    const result = await callClaudeJson<DraftResult>({
      system: LUNA_DRAFT_SYSTEM,
      prompt,
      maxTokens: 3000,
      temperature: 0.8,
    });

    const slides = Array.isArray(result.slides) ? result.slides : [];
    if (slides.length === 0) return jsonError("Aucune slide générée.", 502);

    // Replace existing slides for this content.
    await db.from("content_slides").delete().eq("content_id", content.id);

    const rows = slides.map((s, i) => ({
      content_id: content.id,
      position: i,
      headline: s.headline ?? null,
      body: s.body ?? null,
      image_prompt: s.image_prompt ?? null,
    }));
    const { error: insErr } = await db.from("content_slides").insert(rows);
    if (insErr) return jsonError(insErr.message, 500);

    const { error: updErr } = await db
      .from("content_calendar")
      .update({
        status: content.status === "idea" ? "drafted" : content.status,
        caption: result.caption ?? content.caption,
        hashtags: Array.isArray(result.hashtags)
          ? result.hashtags.map((h) => h.replace(/^#/, ""))
          : content.hashtags,
      })
      .eq("id", content.id);
    if (updErr) return jsonError(updErr.message, 500);

    await logActivity({
      agent: "luna",
      action: `a rédigé le carrousel "${content.title}"`,
      summary: `${rows.length} slides générées`,
      entityType: "content",
      entityId: content.id,
      status: "success",
    });

    return jsonOk({ slides: rows.length });
  });
}
