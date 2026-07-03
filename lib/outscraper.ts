import "server-only";
import { serverEnv } from "@/lib/env";

/**
 * Client Outscraper — Google Maps Search + enrichment emails/réseaux sociaux
 * ("contacts_n_leads"). Docs : https://docs.outscraper.com/endpoints/google-maps-search
 *
 * ⚠️ Noms de champs réels vérifiés en live (≠ doc) : `email` (un seul),
 * `company_instagram`/`contact_instagram`, `company_facebook`, `company_linkedin`.
 * Outscraper renvoie AUSSI plusieurs lignes par entreprise (1 par email trouvé) :
 * on dédoublonne par `place_id` et on garde le meilleur email.
 */

const BASE_URL = "https://api.outscraper.com";

/** Départements Occitanie — pour filtrer la pollution géo de Google Maps. */
const OCCITANIE_DEPTS = ["09", "11", "12", "30", "31", "32", "34", "46", "48", "65", "66", "81", "82"];

/** Fournisseurs email gratuits — email pro (domaine) préféré s'il existe. */
const FREE_EMAIL_DOMAINS = ["gmail.com", "hotmail.fr", "hotmail.com", "yahoo.fr", "yahoo.com", "outlook.fr", "outlook.com", "orange.fr", "wanadoo.fr", "free.fr", "laposte.net", "sfr.fr"];

/** Emails placeholder / non pertinents fréquents à écarter. */
const JUNK_EMAIL_DOMAINS = ["domaine.fr", "example.com", "sentry.io", "mixdesign.club", "wixpress.com"];

/** Ligne brute Outscraper (champs réels utiles). */
export interface OutscraperPlace {
  place_id?: string;
  cid?: string;
  name?: string;
  full_name?: string;
  first_name?: string;
  email?: string;
  domain?: string;
  website?: string;
  phone?: string;
  company_phone?: string;
  category?: string;
  type?: string;
  city?: string;
  postal_code?: string;
  address?: string;
  company_instagram?: string | null;
  contact_instagram?: string | null;
  company_facebook?: string | null;
  contact_facebook?: string | null;
  company_linkedin?: string | null;
  contact_linkedin?: string | null;
}

/** Lead nettoyé, prêt à insérer en base. */
export interface ScrapedLead {
  email: string;
  full_name: string;
  first_name: string | null;
  company: string | null;
  sector: string | null;
  city: string | null;
  postal_code: string | null;
  instagram: string | null;
  facebook: string | null;
  linkedin: string | null;
  website: string | null;
  phone: string | null;
  address: string | null;
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

/** Lance une recherche Google Maps async, enrichie emails + réseaux sociaux. */
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
  return { request_id: String(body.id ?? ""), status: String(body.status ?? "Pending") };
}

/** Récupère le résultat brut d'une recherche async. */
export async function getSearchResult(requestId: string): Promise<SearchResult> {
  const body = await outscraperFetch(`/requests/${requestId}`, new URLSearchParams());
  const status = String(body.status ?? "Unknown");
  if (status !== "Success") return { status, places: [] };
  const data = Array.isArray(body.data) ? body.data : [];
  const places = data.flat() as OutscraperPlace[];
  return { status, places };
}

function emailDomain(email: string): string {
  const at = email.lastIndexOf("@");
  return at === -1 ? "" : email.slice(at + 1).toLowerCase();
}

function isJunkEmail(email: string): boolean {
  return JUNK_EMAIL_DOMAINS.includes(emailDomain(email));
}

/** Meilleur email d'une entreprise : d'abord celui qui matche le domaine du site,
 * puis un email pro (non gratuit), puis n'importe lequel. Junk écarté. */
function pickBestEmail(emails: string[], siteDomain: string | undefined): string | null {
  const clean = emails.map((e) => e.trim().toLowerCase()).filter((e) => e.length > 0 && !isJunkEmail(e));
  if (clean.length === 0) return null;
  const site = (siteDomain ?? "").toLowerCase().replace(/^www\./, "");
  const matchesSite = site ? clean.find((e) => emailDomain(e).includes(site) || site.includes(emailDomain(e).split(".")[0] ?? "")) : undefined;
  if (matchesSite) return matchesSite;
  const pro = clean.find((e) => !FREE_EMAIL_DOMAINS.includes(emailDomain(e)));
  return pro ?? clean[0] ?? null;
}

function inOccitanie(postal: string | undefined): boolean {
  if (!postal) return false;
  return OCCITANIE_DEPTS.includes(postal.slice(0, 2));
}

/**
 * Transforme les lignes brutes Outscraper en leads propres :
 * dédup par entreprise, meilleur email, filtre Occitanie optionnel.
 */
export function normalizeLeads(
  places: OutscraperPlace[],
  opts?: { occitanieOnly?: boolean },
): { leads: ScrapedLead[]; stats: { businesses: number; with_email: number; filtered_geo: number } } {
  const occitanieOnly = opts?.occitanieOnly ?? true;

  // Regroupe par entreprise (place_id, sinon cid, sinon nom).
  const groups = new Map<string, OutscraperPlace[]>();
  for (const p of places) {
    const key = p.place_id ?? p.cid ?? p.name ?? Math.random().toString();
    const arr = groups.get(key);
    if (arr) arr.push(p);
    else groups.set(key, [p]);
  }

  let filteredGeo = 0;
  const leads: ScrapedLead[] = [];

  for (const rows of groups.values()) {
    const base = rows[0];
    if (!base) continue;
    if (occitanieOnly && !inOccitanie(base.postal_code)) {
      filteredGeo++;
      continue;
    }
    const emails = rows.map((r) => r.email ?? "").filter((e) => e.length > 0);
    const email = pickBestEmail(emails, base.domain ?? base.website);
    if (!email) continue;

    // Le contact person éventuel provient de la ligne dont l'email a été retenu.
    const chosen = rows.find((r) => (r.email ?? "").trim().toLowerCase() === email) ?? base;

    leads.push({
      email,
      full_name: base.name ?? "Sans nom",
      first_name: chosen.first_name ?? null,
      company: base.name ?? null,
      sector: base.category ?? base.type ?? null,
      city: base.city ?? null,
      postal_code: base.postal_code ?? null,
      instagram: base.company_instagram ?? chosen.contact_instagram ?? null,
      facebook: base.company_facebook ?? chosen.contact_facebook ?? null,
      linkedin: base.company_linkedin ?? chosen.contact_linkedin ?? null,
      website: base.website ?? (base.domain ? `https://${base.domain}` : null),
      phone: base.phone ?? base.company_phone ?? null,
      address: base.address ?? null,
    });
  }

  return {
    leads,
    stats: { businesses: groups.size, with_email: leads.length, filtered_geo: filteredGeo },
  };
}
