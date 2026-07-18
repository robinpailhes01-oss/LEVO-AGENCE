import { isAuthenticated, mcpAuthorized } from "@/lib/auth-guard";
import { supabaseAdmin } from "@/lib/supabase/server";
import type { HermesAnalysis, Lead } from "@/lib/db";

export const runtime = "nodejs";

/** Colonnes = variables Instantly attendues par le gabarit Hermes (cf. spec Robin). */
const HEADERS = [
  "greeting",
  "first_name",
  "company_name",
  "email",
  "subject_line",
  "hook",
  "pitch",
  "closing_question",
  "instagram_url",
  "sector",
  "city",
  "confidence_score",
  "lead_id",
];

/** "Bonjour Julie," si un prénom est connu, sinon "Bonjour," (jamais de virgule/espace bancale). */
function greetingFor(firstName: string | null): string {
  return firstName ? `Bonjour ${firstName},` : "Bonjour,";
}

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
    const firstName = a.contact_first_name || lead.first_name || null; // priorité au prénom trouvé par Hermes sur le site
    lines.push(
      [
        greetingFor(firstName),
        firstName ?? "",
        lead.company ?? "",
        lead.email,
        a.subject_line ?? "",
        a.hook ?? "",
        a.pitch ?? "",
        a.closing_question ?? "",
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
