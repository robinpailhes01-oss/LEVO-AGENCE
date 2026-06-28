import { NextResponse } from "next/server";
import { withHandler, jsonOk, jsonError } from "@/lib/api";
import { isAuthenticated } from "@/lib/auth-guard";
import { supabaseAdmin } from "@/lib/supabase/server";
import { logActivity } from "@/lib/log";
import type { Lead } from "@/lib/types";

export const runtime = "nodejs";

interface Body {
  name?: string;
  company?: string;
  email?: string;
  phone?: string;
  instagram_handle?: string;
  website?: string;
  niche?: string;
  location?: string;
  source?: string;
}

export async function POST(req: Request): Promise<NextResponse> {
  return withHandler(async () => {
    if (!(await isAuthenticated())) return jsonError("Non autorisé.", 401);

    const body = (await req.json().catch(() => ({}))) as Body;
    if (!body.name?.trim()) return jsonError("Le nom est requis.", 400);

    const { data, error } = await supabaseAdmin()
      .from("leads")
      .insert({
        name: body.name.trim(),
        company: body.company?.trim() || null,
        email: body.email?.trim() || null,
        phone: body.phone?.trim() || null,
        instagram_handle: body.instagram_handle?.trim() || null,
        website: body.website?.trim() || null,
        niche: body.niche?.trim() || null,
        location: body.location?.trim() || null,
        source: body.source?.trim() || "manual",
        status: "new",
      })
      .select("*")
      .single();
    if (error) return jsonError(error.message, 500);

    await logActivity({
      agent: "orion",
      action: `a ajouté le lead ${body.name.trim()}`,
      entityType: "lead",
      entityId: (data as Lead).id,
      status: "success",
    });

    return jsonOk(data as Lead, 201);
  });
}
