import { mcpRoute, str, num, obj, requireStr } from "@/lib/mcp";
import { supabaseAdmin } from "@/lib/supabase/server";
import type { LeadSource, LeadStatus } from "@/lib/db";

export const runtime = "nodejs";

const SOURCES: LeadSource[] = ["instagram", "linkedin", "referral", "website", "cold_email"];
const STATUSES: LeadStatus[] = ["new", "contacted", "responded", "qualified", "proposal", "won", "lost"];

const { GET, POST } = mcpRoute("leads", [
  {
    name: "get_leads",
    description: "Liste les leads, filtrable par statut et score minimum.",
    input: { status: "string?", score_min: "number?", limit: "number?" },
    run: async (input) => {
      let q = supabaseAdmin().from("leads").select("*");
      const status = str(input, "status");
      if (status) q = q.eq("status", status);
      const scoreMin = num(input, "score_min");
      if (scoreMin !== undefined) q = q.gte("score", scoreMin);
      const { data, error } = await q
        .order("score", { ascending: false })
        .limit(num(input, "limit") ?? 100);
      if (error) throw new Error(error.message);
      return data;
    },
  },
  {
    name: "create_lead",
    description: "Ajoute un lead au pipeline.",
    input: {
      full_name: "string", company: "string?", email: "string?",
      source: "string?", linkedin_url: "string?", instagram_handle: "string?", sector: "string?",
    },
    run: async (input) => {
      const source = str(input, "source");
      const { data, error } = await supabaseAdmin()
        .from("leads")
        .insert({
          full_name: requireStr(input, "full_name"),
          company: str(input, "company") ?? null,
          email: str(input, "email") ?? null,
          sector: str(input, "sector") ?? null,
          source: source && SOURCES.includes(source as LeadSource) ? source : null,
          linkedin_url: str(input, "linkedin_url") ?? null,
          instagram_handle: str(input, "instagram_handle") ?? null,
          status: "new",
          assigned_agent: "ORION",
        })
        .select("*").single();
      if (error) throw new Error(error.message);
      return data;
    },
  },
  {
    name: "update_lead",
    description: "Met à jour un lead (statut, score, notes, données d'enrichissement).",
    input: { id: "string", status: "string?", score: "number?", notes: "string?", enrichment_data: "json?" },
    run: async (input) => {
      const id = requireStr(input, "id");
      const patch: Record<string, unknown> = {};
      const status = str(input, "status");
      if (status) {
        if (!STATUSES.includes(status as LeadStatus)) throw new Error("Statut invalide.");
        patch.status = status;
      }
      const score = num(input, "score");
      if (score !== undefined) patch.score = Math.min(Math.max(Math.round(score), 0), 100);
      if (str(input, "notes")) patch.notes = input.notes;
      if (obj(input, "enrichment_data")) patch.enrichment_data = input.enrichment_data;
      patch.last_touch = new Date().toISOString();
      const { data, error } = await supabaseAdmin()
        .from("leads").update(patch).eq("id", id).select("*").single();
      if (error) throw new Error(error.message);
      return data;
    },
  },
  {
    name: "create_proposal",
    description: "Crée une proposition commerciale liée à un lead.",
    input: { lead_id: "string", title: "string", amount: "number?", services: "json?", content: "string?" },
    run: async (input) => {
      const { data, error } = await supabaseAdmin()
        .from("proposals")
        .insert({
          lead_id: requireStr(input, "lead_id"),
          title: requireStr(input, "title"),
          amount: num(input, "amount") ?? null,
          services: obj(input, "services") ?? null,
          content: str(input, "content") ?? null,
          status: "draft",
          generated_by: "ORION",
        })
        .select("*").single();
      if (error) throw new Error(error.message);
      return data;
    },
  },
]);

export { GET, POST };
