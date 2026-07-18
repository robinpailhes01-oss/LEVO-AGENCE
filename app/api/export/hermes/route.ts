import { isAuthenticated, mcpAuthorized } from "@/lib/auth-guard";
import { supabaseAdmin } from "@/lib/supabase/server";
import type { HermesAnalysis, Lead } from "@/lib/db";

export const runtime = "nodejs";

/**
 * Colonnes Instantly. Le mail entier part dans une seule variable
 * `email_body` (WYSIWYG : exactement ce que Robin a validé/édité dans le
 * dashboard) → côté Instantly, il suffit de mettre {{email_body}} en corps
 * et {{subject_line}} en objet. Les autres colonnes servent aux champs
 * standards / au suivi.
 */
const HEADERS = [
  "email",
  "first_name",
  "company_name",
  "subject_line",
  "email_body",
  "instagram_url",
  "sector",
  "city",
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
    if (!a.email_body) continue;
    const enrichment = (lead.enrichment_data ?? {}) as Record<string, unknown>;
    const city = typeof enrichment.city === "string" ? enrichment.city : "";
    const firstName = a.contact_first_name || lead.first_name || "";
    lines.push(
      [
        lead.email,
        firstName,
        lead.company ?? "",
        a.subject_line ?? "",
        a.email_body, // corps complet et définitif (salutation déjà résolue)
        instagramUrl(lead.instagram_handle),
        lead.sector ?? "",
        city,
        a.confidence_score ?? "",
        lead.id,
      ]
        .map(csvCell)
        .join(","),
    );
  }

  // Marque les brouillons exportés comme envoyés — ancre `sent_at` pour pouvoir
  // relier les opens/réponses (email_events, déjà alimenté par le webhook Instantly)
  // à l'analyse Hermes précise dont ils proviennent.
  const now = new Date().toISOString();
  await db.from("hermes_analyses").update({ status: "sent", sent_at: now }).in(
    "id",
    analyses.map((a) => a.id),
  );
  // Stampe aussi leads.exported_at — même verrou que l'export classique, pour
  // qu'un lead contacté via Hermes ne puisse plus ressortir dans un export
  // "nouveaux leads" classique (et inversement).
  await db.from("leads").update({ exported_at: now }).in("id", leadIds).is("exported_at", null);

  return new Response(lines.join("\n"), {
    status: 200,
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="hermes-a-envoyer.csv"',
    },
  });
}
