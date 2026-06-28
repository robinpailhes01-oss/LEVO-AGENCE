import { NextResponse } from "next/server";
import { withHandler, jsonOk, jsonError } from "@/lib/api";
import { isAuthenticated } from "@/lib/auth-guard";
import { supabaseAdmin } from "@/lib/supabase/server";
import { callClaudeJson } from "@/lib/claude";
import { logActivity } from "@/lib/log";
import { LUNA_DRAFT_SYSTEM, lunaSlideFeedbackPrompt } from "@/prompts/luna";
import type { ContentItem, ContentSlide } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

interface Body {
  contentId?: string;
  slideId?: string;
  feedback?: string;
}

export async function POST(req: Request): Promise<NextResponse> {
  return withHandler(async () => {
    if (!(await isAuthenticated())) return jsonError("Non autorisé.", 401);

    const body = (await req.json().catch(() => ({}))) as Body;
    if (!body.contentId || !body.slideId || !body.feedback?.trim()) {
      return jsonError("contentId, slideId et feedback requis.", 400);
    }

    const db = supabaseAdmin();
    const [{ data: itemRow }, { data: slideRow }] = await Promise.all([
      db.from("content_calendar").select("*").eq("id", body.contentId).maybeSingle(),
      db.from("content_slides").select("*").eq("id", body.slideId).maybeSingle(),
    ]);
    if (!itemRow) return jsonError("Contenu introuvable.", 404);
    if (!slideRow) return jsonError("Slide introuvable.", 404);

    const item = itemRow as ContentItem;
    const slide = slideRow as ContentSlide;

    const result = await callClaudeJson<{
      headline: string;
      body: string;
      image_prompt: string;
    }>({
      system: LUNA_DRAFT_SYSTEM,
      prompt: lunaSlideFeedbackPrompt({
        contentTitle: item.title,
        slidePosition: slide.position + 1,
        currentHeadline: slide.headline ?? "",
        currentBody: slide.body ?? "",
        feedback: body.feedback.trim(),
      }),
      maxTokens: 800,
      temperature: 0.8,
    });

    const { data: updated, error } = await db
      .from("content_slides")
      .update({
        headline: result.headline ?? slide.headline,
        body: result.body ?? slide.body,
        image_prompt: result.image_prompt ?? slide.image_prompt,
      })
      .eq("id", slide.id)
      .select("*")
      .maybeSingle();
    if (error) return jsonError(error.message, 500);

    await logActivity({
      agent: "luna",
      action: `a régénéré la slide ${slide.position + 1} de "${item.title}"`,
      summary: body.feedback.trim().slice(0, 120),
      entityType: "content",
      entityId: item.id,
      status: "success",
    });

    return jsonOk(updated as ContentSlide);
  });
}
