import { mcpRoute, str, num, arr, bool, requireStr } from "@/lib/mcp";
import { supabaseAdmin } from "@/lib/supabase/server";
import { startGoogleMapsSearch, getSearchResult, normalizeLeads } from "@/lib/outscraper";

export const runtime = "nodejs";
export const maxDuration = 60;

const { GET, POST } = mcpRoute("scrape", [
  {
    name: "start_scrape",
    description:
      "Lance une recherche Google Maps (Outscraper, async) enrichie email + Instagram/Facebook/LinkedIn. Renvoie un request_id à repasser à fetch_scrape / import_scrape.",
    input: {
      queries: 'array of string (ex: ["menuisier Toulouse", "menuisier Montpellier"])',
      limit_per_query: "number?",
    },
    run: async (input) => {
      const queries = arr(input, "queries");
      if (!queries || queries.length === 0) throw new Error("`queries` (array de string) requis.");
      return startGoogleMapsSearch(queries, { limitPerQuery: num(input, "limit_per_query") });
    },
  },
  {
    name: "fetch_scrape",
    description:
      "Statut d'une recherche Outscraper + aperçu propre des leads (dédoublonnés, Occitanie) SANS importer en base. Sert à valider avant import_scrape.",
    input: { request_id: "string", occitanie_only: "boolean?" },
    run: async (input) => {
      const occitanieOnly = bool(input, "occitanie_only") ?? true;
      const { status, places } = await getSearchResult(requireStr(input, "request_id"));
      if (status !== "Success") return { status, ready: false };
      const { leads, stats } = normalizeLeads(places, { occitanieOnly });
      return { status, ready: true, stats, preview: leads.slice(0, 15) };
    },
  },
  {
    name: "import_scrape",
    description:
      "Récupère une recherche Outscraper terminée, dédoublonne par entreprise (meilleur email), filtre l'Occitanie et importe comme leads tagués sur une niche.",
    input: { request_id: "string", niche_id: "string?", occitanie_only: "boolean?" },
    run: async (input) => {
      const requestId = requireStr(input, "request_id");
      const nicheId = str(input, "niche_id") ?? null;
      const occitanieOnly = bool(input, "occitanie_only") ?? true;
      const { status, places } = await getSearchResult(requestId);
      if (status !== "Success") {
        return { status, imported: 0, message: "Recherche pas encore terminée (relancer import_scrape dans quelques instants)." };
      }

      const { leads, stats } = normalizeLeads(places, { occitanieOnly });
      const db = supabaseAdmin();

      const emails = leads.map((l) => l.email);
      const { data: existing } = await db
        .from("leads")
        .select("email")
        .in("email", emails.length ? emails : ["__none__"]);
      const seen = new Set((existing ?? []).map((r) => (r as { email: string }).email));

      const rows = leads
        .filter((l) => !seen.has(l.email))
        .map((l) => ({
          email: l.email,
          full_name: l.full_name,
          first_name: l.first_name,
          company: l.company,
          sector: l.sector,
          instagram_handle: l.instagram,
          linkedin_url: l.website,
          niche_id: nicheId,
          source: "website" as const,
          status: "new" as const,
          stage: "new" as const,
          assigned_agent: "ORION",
          enrichment_data: {
            phone: l.phone,
            facebook: l.facebook,
            linkedin: l.linkedin,
            city: l.city,
            postal_code: l.postal_code,
            address: l.address,
          },
        }));

      const summary = {
        status,
        rows_raw: places.length,
        businesses: stats.businesses,
        filtered_out_of_occitanie: stats.filtered_geo,
        with_usable_email: stats.with_email,
        skipped_duplicates_in_db: leads.length - rows.length,
        imported: 0,
      };
      if (rows.length === 0) return summary;

      const { data, error } = await db.from("leads").insert(rows).select("id");
      if (error) throw new Error(error.message);
      return { ...summary, imported: (data ?? []).length };
    },
  },
]);

export { GET, POST };
