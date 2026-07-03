import { mcpRoute, str, num, arr, requireStr } from "@/lib/mcp";
import { supabaseAdmin } from "@/lib/supabase/server";
import { startGoogleMapsSearch, getSearchResult } from "@/lib/outscraper";
import type { LeadSource } from "@/lib/db";

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
    description: "Consulte le statut/résultat brut d'une recherche Outscraper (sans importer en base).",
    input: { request_id: "string" },
    run: async (input) => getSearchResult(requireStr(input, "request_id")),
  },
  {
    name: "import_scrape",
    description:
      "Récupère les résultats d'une recherche Outscraper terminée et les importe comme leads (dédup par email), tagués sur une niche.",
    input: { request_id: "string", niche_id: "string?" },
    run: async (input) => {
      const requestId = requireStr(input, "request_id");
      const nicheId = str(input, "niche_id") ?? null;
      const { status, places } = await getSearchResult(requestId);
      if (status !== "Success") {
        return { status, imported: 0, message: "Recherche pas encore terminée (relancer fetch_scrape/import_scrape dans quelques instants)." };
      }

      const withEmail = places
        .map((p) => ({ ...p, email: (p.email_1 ?? p.email_2 ?? p.email_3 ?? "").trim() }))
        .filter((p) => p.email.length > 0);

      const db = supabaseAdmin();
      const emails = withEmail.map((p) => p.email);
      const { data: existing } = await db
        .from("leads")
        .select("email")
        .in("email", emails.length ? emails : ["__none__"]);
      const seen = new Set((existing ?? []).map((r) => (r as { email: string }).email));

      const rows = withEmail
        .filter((p) => !seen.has(p.email))
        .map((p) => ({
          email: p.email,
          full_name: p.name ?? "Sans nom",
          company: p.name ?? null,
          sector: p.category ?? null,
          instagram_handle: p.instagram ?? null,
          linkedin_url: p.site ?? null,
          niche_id: nicheId,
          source: "website" as LeadSource,
          status: "new" as const,
          stage: "new" as const,
          assigned_agent: "ORION",
          enrichment_data: { phone: p.phone ?? null, facebook: p.facebook ?? null, address: p.full_address ?? null },
        }));

      if (rows.length === 0) {
        return { status, found: places.length, with_email: withEmail.length, imported: 0, skipped_duplicates: withEmail.length };
      }
      const { data, error } = await db.from("leads").insert(rows).select("id");
      if (error) throw new Error(error.message);
      return {
        status,
        found: places.length,
        with_email: withEmail.length,
        imported: (data ?? []).length,
        skipped_duplicates: withEmail.length - rows.length,
      };
    },
  },
]);

export { GET, POST };
