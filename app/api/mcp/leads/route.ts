import { mcpRoute, str, num, requireStr } from "@/lib/mcp";
import { supabaseAdmin } from "@/lib/supabase/server";
import { logActivity } from "@/lib/log";
import type { LeadStatus } from "@/lib/types";

export const runtime = "nodejs";

const STATUSES: LeadStatus[] = [
  "new",
  "enriched",
  "contacted",
  "replied",
  "qualified",
  "won",
  "lost",
];

const { GET, POST } = mcpRoute("leads", [
  {
    name: "list_leads",
    description: "Liste les leads, filtrable par statut, triés par score.",
    input: { status: "string?" },
    run: async (input) => {
      let q = supabaseAdmin().from("leads").select("*");
      const status = str(input, "status");
      if (status) q = q.eq("status", status);
      const { data, error } = await q.order("score", { ascending: false });
      if (error) throw new Error(error.message);
      return data;
    },
  },
  {
    name: "get_lead",
    description: "Récupère un lead par son id.",
    input: { id: "string" },
    run: async (input) => {
      const { data, error } = await supabaseAdmin()
        .from("leads")
        .select("*")
        .eq("id", requireStr(input, "id"))
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (!data) throw new Error("Lead introuvable.");
      return data;
    },
  },
  {
    name: "create_lead",
    description: "Ajoute un nouveau lead au pipeline.",
    input: {
      name: "string",
      company: "string?",
      email: "string?",
      niche: "string?",
      location: "string?",
      website: "string?",
      instagram_handle: "string?",
      source: "string?",
    },
    run: async (input) => {
      const { data, error } = await supabaseAdmin()
        .from("leads")
        .insert({
          name: requireStr(input, "name"),
          company: str(input, "company") ?? null,
          email: str(input, "email") ?? null,
          niche: str(input, "niche") ?? null,
          location: str(input, "location") ?? null,
          website: str(input, "website") ?? null,
          instagram_handle: str(input, "instagram_handle") ?? null,
          source: str(input, "source") ?? "mcp",
          status: "new",
        })
        .select("*")
        .single();
      if (error) throw new Error(error.message);
      await logActivity({
        agent: "orion",
        action: `a ajouté le lead ${data.name} (MCP)`,
        entityType: "lead",
        entityId: data.id,
      });
      return data;
    },
  },
  {
    name: "update_lead",
    description: "Met à jour des champs d'un lead (score, notes, enrichment...).",
    input: { id: "string", score: "number?", notes: "string?", status: "string?" },
    run: async (input) => {
      const id = requireStr(input, "id");
      const patch: Record<string, unknown> = {};
      const score = num(input, "score");
      if (score !== undefined) patch.score = Math.min(Math.max(score, 0), 100);
      const notes = str(input, "notes");
      if (notes) patch.notes = notes;
      const status = str(input, "status");
      if (status) {
        if (!STATUSES.includes(status as LeadStatus)) throw new Error("Statut invalide.");
        patch.status = status;
      }
      if (Object.keys(patch).length === 0) throw new Error("Aucun champ à mettre à jour.");
      const { data, error } = await supabaseAdmin()
        .from("leads")
        .update(patch)
        .eq("id", id)
        .select("*")
        .single();
      if (error) throw new Error(error.message);
      return data;
    },
  },
  {
    name: "create_proposal",
    description: "Crée une proposition liée à un lead.",
    input: { lead_id: "string", title: "string", amount: "number?", content: "string?" },
    run: async (input) => {
      const { data, error } = await supabaseAdmin()
        .from("proposals")
        .insert({
          lead_id: requireStr(input, "lead_id"),
          title: requireStr(input, "title"),
          amount: num(input, "amount") ?? 0,
          content: str(input, "content") ?? null,
          status: "draft",
        })
        .select("*")
        .single();
      if (error) throw new Error(error.message);
      return data;
    },
  },
]);

export { GET, POST };
