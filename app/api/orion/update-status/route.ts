import { NextResponse } from "next/server";
import { withHandler, jsonOk, jsonError } from "@/lib/api";
import { isAuthenticated } from "@/lib/auth-guard";
import { supabaseAdmin } from "@/lib/supabase/server";
import { logActivity } from "@/lib/log";
import type { LeadStatus } from "@/lib/types";

export const runtime = "nodejs";

const VALID: LeadStatus[] = [
  "new",
  "enriched",
  "contacted",
  "replied",
  "qualified",
  "won",
  "lost",
];

interface Body {
  leadId?: string;
  status?: string;
}

export async function POST(req: Request): Promise<NextResponse> {
  return withHandler(async () => {
    if (!(await isAuthenticated())) return jsonError("Non autorisé.", 401);

    const body = (await req.json().catch(() => ({}))) as Body;
    if (!body.leadId) return jsonError("leadId requis.", 400);
    if (!body.status || !VALID.includes(body.status as LeadStatus)) {
      return jsonError("Statut invalide.", 400);
    }

    const { data, error } = await supabaseAdmin()
      .from("leads")
      .update({ status: body.status })
      .eq("id", body.leadId)
      .select("id, name, status")
      .maybeSingle();
    if (error) return jsonError(error.message, 500);
    if (!data) return jsonError("Lead introuvable.", 404);

    await logActivity({
      agent: "orion",
      action: `a déplacé ${(data as { name: string }).name} → ${body.status}`,
      entityType: "lead",
      entityId: body.leadId,
      status: "info",
    });

    return jsonOk(data);
  });
}
