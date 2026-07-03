import "server-only";
import { serverEnv } from "@/lib/env";

/**
 * Client Outscraper — Google Maps Search + enrichment emails/réseaux sociaux
 * ("contacts_n_leads"). Docs : https://docs.outscraper.com/endpoints/google-maps-search
 */

const BASE_URL = "https://api.outscraper.com";

export interface OutscraperPlace {
  name?: string;
  full_address?: string;
  site?: string;
  phone?: string;
  category?: string;
  email_1?: string;
  email_2?: string;
  email_3?: string;
  instagram?: string;
  facebook?: string;
  linkedin?: string;
}

export interface StartSearchResult {
  request_id: string;
  status: string;
}

export interface SearchResult {
  status: string;
  places: OutscraperPlace[];
}

function apiKey(): string {
  const key = serverEnv.outscraperApiKey;
  if (!key) throw new Error("OUTSCRAPER_API_KEY non configuré (Vercel → Settings → Environment Variables).");
  return key;
}

async function outscraperFetch(path: string, params: URLSearchParams): Promise<Record<string, unknown>> {
  const res = await fetch(`${BASE_URL}${path}?${params.toString()}`, {
    method: "GET",
    headers: { "X-API-KEY": apiKey() },
  });
  const body = (await res.json()) as Record<string, unknown>;
  if (!res.ok) throw new Error(`Outscraper ${res.status} : ${JSON.stringify(body)}`);
  return body;
}

/** Lance une recherche Google Maps async, enrichie emails + réseaux sociaux (Instagram inclus). */
export async function startGoogleMapsSearch(
  queries: string[],
  opts?: { limitPerQuery?: number },
): Promise<StartSearchResult> {
  const params = new URLSearchParams();
  queries.forEach((q) => params.append("query", q));
  params.set("limit", String(opts?.limitPerQuery ?? 30));
  params.set("language", "fr");
  params.set("region", "FR");
  params.set("async", "true");
  params.set("dropDuplicates", "true");
  params.set("enrichment", "contacts_n_leads");

  const body = await outscraperFetch("/google-maps-search", params);
  return {
    request_id: String(body.id ?? ""),
    status: String(body.status ?? "Pending"),
  };
}

/** Récupère le résultat d'une recherche async lancée via startGoogleMapsSearch. */
export async function getSearchResult(requestId: string): Promise<SearchResult> {
  const body = await outscraperFetch(`/requests/${requestId}`, new URLSearchParams());
  const status = String(body.status ?? "Unknown");
  if (status !== "Success") return { status, places: [] };
  const data = Array.isArray(body.data) ? body.data : [];
  const places = data.flat() as OutscraperPlace[];
  return { status, places };
}
