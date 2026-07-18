import "server-only";
import { supabaseAdmin } from "@/lib/supabase/server";
import { callClaudeJson } from "@/lib/claude";
import { HERMES_SYSTEM, hermesAnalyzePrompt, assembleHermesEmail, type HermesResult } from "@/prompts/hermes";
import type { Lead, HermesAnalysis } from "@/lib/db";

/**
 * Récupère le texte visible d'un site web (best-effort, sans lib de parsing
 * lourde) pour donner du contexte réel à HERMES. Renvoie null si le site est
 * injoignable/vide — HERMES doit alors se rabattre sur secteur/catégorie.
 *
 * ⚠️ `leads.linkedin_url` contient en réalité l'URL du site web du lead
 * (réutilisation de colonne héritée du scraping Outscraper, cf. lib/outscraper.ts).
 */
export async function fetchWebsiteText(url: string | null): Promise<string | null> {
  if (!url) return null;
  const target = /^https?:\/\//i.test(url) ? url : `https://${url}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(target, {
      signal: controller.signal,
      headers: { "user-agent": "Mozilla/5.0 (compatible; LumaHermesBot/1.0)" },
      redirect: "follow",
    });
    clearTimeout(timeout);
    if (!res.ok) return null;

    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.includes("text/html")) return null;

    const html = await res.text();
    const text = htmlToText(html);
    if (text.length < 40) return null;
    return text.slice(0, 6000);
  } catch {
    return null;
  }
}

/** Analyse un lead et crée un brouillon Hermes (statut draft) — utilisé par le MCP et le dashboard. */
export async function runHermesAnalysis(leadId: string): Promise<HermesAnalysis> {
  const db = supabaseAdmin();
  const { data: row } = await db.from("leads").select("*").eq("id", leadId).maybeSingle();
  if (!row) throw new Error("Lead introuvable.");
  const lead = row as Lead;

  const websiteExcerpt = await fetchWebsiteText(lead.linkedin_url);
  const enrichment = (lead.enrichment_data ?? {}) as Record<string, unknown>;
  const city = typeof enrichment.city === "string" ? enrichment.city : null;

  // Chaque appel est indépendant (le modèle ne "voit" pas les mails déjà
  // générés dans ce lot) — un style d'accroche tiré au hasard évite que tout
  // le lot converge vers la même formulation "sûre".
  const hookSeed = Math.floor(Math.random() * 4);
  const result = await callClaudeJson<HermesResult>({
    system: HERMES_SYSTEM,
    prompt: hermesAnalyzePrompt(
      { full_name: lead.full_name, company: lead.company, sector: lead.sector, city },
      websiteExcerpt,
      hookSeed,
    ),
    maxTokens: 500,
    temperature: 0.8,
  });

  // Prénom : celui trouvé par Hermes sur le site en priorité, sinon lead.first_name.
  const firstName = result.contact_first_name ?? lead.first_name ?? null;
  const emailBody = assembleHermesEmail(result, firstName);

  const { data: inserted, error } = await db
    .from("hermes_analyses")
    .insert({
      lead_id: lead.id,
      status: "draft",
      website_excerpt: websiteExcerpt,
      subject_line: result.subject_line,
      hook: result.hook,
      confidence_score: Math.min(Math.max(Math.round(result.confidence_score ?? 0), 0), 100),
      contact_first_name: result.contact_first_name ?? null,
      email_body: emailBody,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return inserted as HermesAnalysis;
}

/** Valide/rejette/édite un brouillon Hermes — action humaine obligatoire avant tout envoi. */
export async function reviewHermesAnalysis(
  id: string,
  action: "approve" | "reject" | "edit",
  edits?: { email_body?: string; subject_line?: string },
): Promise<HermesAnalysis> {
  const db = supabaseAdmin();
  const patch: Record<string, unknown> = { reviewed_at: new Date().toISOString() };

  if (action === "approve") patch.status = "approved";
  else if (action === "reject") patch.status = "rejected";
  else if (action === "edit") {
    if (edits?.email_body) patch.email_body = edits.email_body;
    if (edits?.subject_line) patch.subject_line = edits.subject_line;
    patch.edited = true;
  }

  const { data, error } = await db.from("hermes_analyses").update(patch).eq("id", id).select("*").single();
  if (error) throw new Error(error.message);
  return data as HermesAnalysis;
}

function htmlToText(html: string): string {
  return html
    .replace(/<(script|style|noscript)[^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|h[1-6]|section|article)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n+/g, "\n")
    .trim();
}
