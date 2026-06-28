import { NextResponse } from "next/server";
import { withHandler, jsonOk, jsonError } from "@/lib/api";
import { isAuthenticated } from "@/lib/auth-guard";
import { supabaseAdmin } from "@/lib/supabase/server";
import { logActivity } from "@/lib/log";
import type { ContentStatus } from "@/lib/types";

export const runtime = "nodejs";

const VALID: ContentStatus[] = [
  "idea",
  "approved",
  "drafted",
  "validated",
  "published",
];

interface Body {
  contentId?: string;
  status?: string;
}

export async function POST(req: Request): Promise<NextResponse> {
  return withHandler(async () => {
    if (!(await isAuthenticated())) return jsonError("Non autorisé.", 401);

    const body = (await req.json().catch(() => ({}))) as Body;
    if (!body.contentId) return jsonError("contentId requis.", 400);
    if (!body.status || !VALID.includes(body.status as ContentStatus)) {
      return jsonError("Statut invalide.", 400);
    }
    const status = body.status as ContentStatus;

    const patch: Record<string, unknown> = { status };
    if (status === "published") patch.published_at = new Date().toISOString();

    const { data, error } = await supabaseAdmin()
      .from("content_calendar")
      .update(patch)
      .eq("id", body.contentId)
      .select("id, title, status")
      .maybeSingle();
    if (error) return jsonError(error.message, 500);
    if (!data) return jsonError("Contenu introuvable.", 404);

    await logActivity({
      agent: "luna",
      action: `a déplacé "${(data as { title: string }).title}" → ${status}`,
      entityType: "content",
      entityId: body.contentId,
      status: "info",
    });

    return jsonOk(data);
  });
}
