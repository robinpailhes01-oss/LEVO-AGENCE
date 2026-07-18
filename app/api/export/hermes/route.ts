import { isAuthenticated, mcpAuthorized } from "@/lib/auth-guard";
import { supabaseAdmin } from "@/lib/supabase/server";
import type { HermesAnalysis, Lead } from "@/lib/db";

export const runtime = "nodejs";

/** Colonnes = variables Instantly attendues par le gabarit Hermes (cf. spec Robin). */
const HEADERS = [
  "first_name",
  "company_name",
  "email",
  "subject_line",
  "opening_line",
  "verified_observation",
  "personalized_question",
  "instagram_url",
  "sector",
  "city",
  "opportunity_angle",
  "confidence_score",
  "lead_id",
];

function csvCell(value: unknown): string {
  const s = value === null || value === undefined ? "" : String(value);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function instagramUrl(handle: string | null): string {
  if (!handle) return "";
  if (/^https?:\/\//i.test(handle)) return handle;
  return `https://instagram.com/${handle.replace(/^@/, "")}`;
}

/** Export CSV des brouillons Hermes approuvés (status=approved), prêts pour Instantly. */
export async function GET(req: Request): Promise<Response> {
  if (!mcpAuthorized(req) && !(await isAuthenticated())) {
    return new Response("Non autorisé", { status: 401 });
  }

  const db = supabaseAdmin();
  const { data: analysesData, error } = await db
    .from("hermes_analyses")
    .select("*")
    .eq("status", "approved")
    .order("reviewed_at", { ascending: true });
  if (error) return new Response(`Erreur : ${error.message}`, { status: 500 });

  const analyses = (analysesData ?? []) as HermesAnalysis[];
  if (analyses.length === 0) {
    return new Response(HEADERS.join(","), {
      status: 200,
      headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": 'attachment; filename="hermes-a-envoyer.csv"' },
    });
  }

  const leadIds = [...new Set(analyses.map((a) => a.lead_id))];
  const { data: leadsData } = await db.from("leads").select("*").in("id", leadIds);
  const byId = new Map(((leadsData ?? []) as Lead[]).map((l) => [l.id, l]));

  const lines = [HEADERS.join(",")];
  for (const a of analyses) {
    const lead = byId.get(a.lead_id);
    if (!lead?.email) continue;
    const enrichment = (lead.enrichment_data ?? {}) as Record<string, unknown>;
    const city = typeof enrichment.city === "string" ? enrichment.city : "";
    lines.push(
      [
        lead.first_name ?? "",
        lead.company ?? "",
        lead.email,
        a.subject_line ?? "",
        a.opening_line ?? "",
        a.verified_observation ?? "",
        a.personalized_question ?? "",
        instagramUrl(lead.instagram_handle),
        lead.sector ?? "",
        city,
        a.opportunity_angle ?? "",
        a.confidence_score ?? "",
        lead.id,
      ]
        .map(csvCell)
        .join(","),
    );
  }

  return new Response(lines.join("\n"), {
    status: 200,
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="hermes-a-envoyer.csv"',
    },
  });
}
