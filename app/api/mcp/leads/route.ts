import { mcpRoute, str, num, arr, obj, requireStr } from "@/lib/mcp";
import { supabaseAdmin } from "@/lib/supabase/server";
import { callClaudeJson } from "@/lib/claude";
import {
  ORION_ENRICH_SYSTEM,
  ORION_EMAIL1_SYSTEM,
  enrichPrompt,
  email1Prompt,
} from "@/prompts/orion";
import type { Lead, LeadSource, LeadStatus } from "@/lib/db";

export const runtime = "nodejs";
export const maxDuration = 60;

const SOURCES: LeadSource[] = ["instagram", "linkedin", "referral", "website", "cold_email"];
const STATUSES: LeadStatus[] = ["new", "contacted", "responded", "qualified", "proposal", "won", "lost"];

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://levo-agence.vercel.app";

const { GET, POST } = mcpRoute("leads", [
  {
    name: "get_leads",
    description: "Liste les leads, filtrable par statut/stage et score minimum.",
    input: { status: "string?", stage: "string?", score_min: "number?", limit: "number?" },
    run: async (input) => {
      let q = supabaseAdmin().from("leads").select("*");
      const status = str(input, "status");
      if (status) q = q.eq("status", status);
      const stage = str(input, "stage");
      if (stage) q = q.eq("stage", stage);
      const scoreMin = num(input, "score_min");
      if (scoreMin !== undefined) q = q.gte("score", scoreMin);
      const { data, error } = await q.order("score", { ascending: false }).limit(num(input, "limit") ?? 100);
      if (error) throw new Error(error.message);
      return data;
    },
  },
  {
    name: "create_lead",
    description: "Ajoute un lead au pipeline.",
    input: { full_name: "string", company: "string?", email: "string?", source: "string?", instagram_handle: "string?", sector: "string?", niche_id: "string?" },
    run: async (input) => {
      const source = str(input, "source");
      const { data, error } = await supabaseAdmin().from("leads").insert({
        full_name: requireStr(input, "full_name"),
        company: str(input, "company") ?? null,
        email: str(input, "email") ?? null,
        sector: str(input, "sector") ?? null,
        instagram_handle: str(input, "instagram_handle") ?? null,
        source: source && SOURCES.includes(source as LeadSource) ? source : null,
        niche_id: str(input, "niche_id") ?? null,
        status: "new",
        stage: "new",
        assigned_agent: "ORION",
      }).select("*").single();
      if (error) throw new Error(error.message);
      return data;
    },
  },
  {
    name: "import_leads",
    description: "Import en masse de leads (Apify / CSV / Instantly). Dédup par email.",
    input: { leads: "array of {full_name, company, sector, email, instagram_handle, website}", niche_id: "string?", source: "string?" },
    run: async (input) => {
      const raw = input.leads;
      if (!Array.isArray(raw) || raw.length === 0) throw new Error("`leads` (array) requis.");
      const nicheId = str(input, "niche_id") ?? null;
      const source = str(input, "source") ?? "website";
      const db = supabaseAdmin();

      const emails = raw
        .map((l) => (l && typeof l === "object" ? (l as Record<string, unknown>).email : null))
        .filter((e): e is string => typeof e === "string");
      const { data: existing } = await db.from("leads").select("email").in("email", emails.length ? emails : ["__none__"]);
      const seen = new Set((existing ?? []).map((r) => (r as { email: string }).email));

      const rows = raw
        .map((l) => (l && typeof l === "object" ? (l as Record<string, unknown>) : {}))
        .filter((l) => !(typeof l.email === "string" && seen.has(l.email)))
        .map((l) => ({
          full_name: typeof l.full_name === "string" ? l.full_name : (typeof l.company === "string" ? l.company : "Sans nom"),
          company: typeof l.company === "string" ? l.company : null,
          sector: typeof l.sector === "string" ? l.sector : null,
          email: typeof l.email === "string" ? l.email : null,
          instagram_handle: typeof l.instagram_handle === "string" ? l.instagram_handle : null,
          linkedin_url: typeof l.website === "string" ? l.website : null,
          niche_id: nicheId,
          source: SOURCES.includes(source as LeadSource) ? source : "website",
          status: "new" as const,
          stage: "new" as const,
          assigned_agent: "ORION",
        }));
      if (rows.length === 0) return { inserted: 0, skipped_duplicates: raw.length };
      const { data, error } = await db.from("leads").insert(rows).select("id");
      if (error) throw new Error(error.message);
      return { inserted: (data ?? []).length, skipped_duplicates: raw.length - rows.length };
    },
  },
  {
    name: "enrich_lead",
    description: "ORION enrichit + score un lead (Claude) selon la niche artisanale.",
    input: { lead_id: "string" },
    run: async (input) => {
      const db = supabaseAdmin();
      const { data: row } = await db.from("leads").select("*").eq("id", requireStr(input, "lead_id")).maybeSingle();
      if (!row) throw new Error("Lead introuvable.");
      const lead = row as Lead;
      const result = await callClaudeJson<{
        niche: string; score: number; pain_points: string[]; angle: string; rationale: string;
      }>({
        system: ORION_ENRICH_SYSTEM,
        prompt: enrichPrompt(lead),
        maxTokens: 1000,
        temperature: 0.5,
      });
      const score = Math.min(Math.max(Math.round(result.score ?? 0), 0), 100);
      const { data: updated, error } = await db.from("leads").update({
        score,
        sector: lead.sector ?? result.niche,
        pain_points: result.pain_points ?? null,
        enrichment_data: { niche: result.niche, angle: result.angle, rationale: result.rationale },
      }).eq("id", lead.id).select("*").single();
      if (error) throw new Error(error.message);
      return updated;
    },
  },
  {
    name: "generate_email1",
    description: "ORION rédige l'Email 1 (offre d'audit) + l'accroche perso pour un lead.",
    input: { lead_id: "string", audit_link: "string?" },
    run: async (input) => {
      const db = supabaseAdmin();
      const { data: row } = await db.from("leads").select("*").eq("id", requireStr(input, "lead_id")).maybeSingle();
      if (!row) throw new Error("Lead introuvable.");
      const lead = row as Lead;
      const auditLink = str(input, "audit_link") ?? `${APP_URL}/audit?lead=${lead.id}`;
      const result = await callClaudeJson<{ subject: string; body: string; icebreaker: string }>({
        system: ORION_EMAIL1_SYSTEM,
        prompt: email1Prompt(lead, auditLink),
        maxTokens: 900,
        temperature: 0.8,
      });
      await db.from("leads").update({
        enrichment_data: { ...(lead.enrichment_data ?? {}), icebreaker: result.icebreaker, email1_subject: result.subject },
      }).eq("id", lead.id);
      return { ...result, audit_link: auditLink };
    },
  },
  {
    name: "update_lead",
    description: "Met à jour un lead (statut, stage, score, notes, enrichment).",
    input: { id: "string", status: "string?", stage: "string?", score: "number?", notes: "string?" },
    run: async (input) => {
      const id = requireStr(input, "id");
      const patch: Record<string, unknown> = {};
      const status = str(input, "status");
      if (status) {
        if (!STATUSES.includes(status as LeadStatus)) throw new Error("Statut invalide.");
        patch.status = status;
      }
      const stage = str(input, "stage");
      if (stage) patch.stage = stage;
      const score = num(input, "score");
      if (score !== undefined) patch.score = Math.min(Math.max(score, 0), 100);
      if (str(input, "notes")) patch.notes = input.notes;
      patch.last_touch = new Date().toISOString();
      const { data, error } = await supabaseAdmin().from("leads").update(patch).eq("id", id).select("*").single();
      if (error) throw new Error(error.message);
      return data;
    },
  },
]);

export { GET, POST };
