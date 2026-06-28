import { NextResponse } from "next/server";
import { withHandler, jsonOk, jsonError } from "@/lib/api";
import { isAuthenticated } from "@/lib/auth-guard";
import { supabaseAdmin } from "@/lib/supabase/server";
import { callClaudeJson } from "@/lib/claude";
import { logActivity } from "@/lib/log";
import { LUNA_IDEAS_SYSTEM } from "@/prompts/luna";
import type { ContentFormat, ContentItem } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

interface Body {
  topic?: string;
  count?: number;
  clientId?: string;
}

interface IdeaDraft {
  title: string;
  hook: string;
  pillar: string;
  topic: string;
  format: ContentFormat;
}

export async function POST(req: Request): Promise<NextResponse> {
  return withHandler(async () => {
    if (!(await isAuthenticated())) return jsonError("Non autorisé.", 401);

    const body = (await req.json().catch(() => ({}))) as Body;
    const count = Math.min(Math.max(body.count ?? 4, 1), 8);

    const prompt = `Génère ${count} idées de contenu pour Levo${
      body.topic ? ` sur le thème : "${body.topic}"` : ""
    }.
Renvoie un objet JSON de forme : { "ideas": [ { "title": string, "hook": string, "pillar": string, "topic": string, "format": "carousel"|"reel"|"single"|"story" } ] }.`;

    const result = await callClaudeJson<{ ideas: IdeaDraft[] }>({
      system: LUNA_IDEAS_SYSTEM,
      prompt,
      maxTokens: 1500,
      temperature: 0.9,
    });

    const ideas = Array.isArray(result.ideas) ? result.ideas.slice(0, count) : [];
    if (ideas.length === 0) return jsonError("Aucune idée générée.", 502);

    const rows = ideas.map((idea) => ({
      client_id: body.clientId ?? null,
      title: idea.title?.slice(0, 200) ?? "Idée sans titre",
      hook: idea.hook ?? null,
      topic: idea.topic ?? body.topic ?? null,
      pillar: idea.pillar ?? null,
      format: (["carousel", "reel", "single", "story"] as const).includes(
        idea.format,
      )
        ? idea.format
        : "carousel",
      status: "idea" as const,
    }));

    const { data, error } = await supabaseAdmin()
      .from("content_calendar")
      .insert(rows)
      .select("*");
    if (error) return jsonError(`Insertion échouée : ${error.message}`, 500);

    await logActivity({
      agent: "luna",
      action: `a généré ${rows.length} idées de contenu`,
      summary: body.topic ? `Thème : ${body.topic}` : "Idées variées",
      status: "success",
      metadata: { count: rows.length },
    });

    return jsonOk((data ?? []) as ContentItem[]);
  });
}
