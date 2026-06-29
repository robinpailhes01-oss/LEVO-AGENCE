import { mcpRoute, str, num, requireStr } from "@/lib/mcp";
import { supabaseAdmin } from "@/lib/supabase/server";
import type { ClientStatus } from "@/lib/db";

export const runtime = "nodejs";

const STATUSES: ClientStatus[] = ["active", "churned", "prospect"];

const { GET, POST } = mcpRoute("clients", [
  {
    name: "get_clients",
    description: "Liste les clients de l'agence, filtrable par statut.",
    input: { status: "string?" },
    run: async (input) => {
      let q = supabaseAdmin().from("clients").select("*");
      const status = str(input, "status");
      if (status) q = q.eq("status", status);
      const { data, error } = await q.order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return data;
    },
  },
  {
    name: "get_client",
    description: "Détail d'un client par id.",
    input: { id: "string" },
    run: async (input) => {
      const { data, error } = await supabaseAdmin()
        .from("clients").select("*").eq("id", requireStr(input, "id")).maybeSingle();
      if (error) throw new Error(error.message);
      if (!data) throw new Error("Client introuvable.");
      return data;
    },
  },
  {
    name: "create_client",
    description: "Crée un client (onboarding).",
    input: {
      name: "string", company: "string", sector: "string?",
      email: "string?", mrr: "number?", agent_name: "string?",
    },
    run: async (input) => {
      const { data, error } = await supabaseAdmin()
        .from("clients")
        .insert({
          name: requireStr(input, "name"),
          company: requireStr(input, "company"),
          sector: str(input, "sector") ?? null,
          email: str(input, "email") ?? null,
          mrr: num(input, "mrr") ?? 0,
          agent_name: str(input, "agent_name") ?? null,
          status: "active",
        })
        .select("*").single();
      if (error) throw new Error(error.message);
      return data;
    },
  },
  {
    name: "update_client",
    description: "Met à jour un client (statut, MRR, notes, prochaine revue).",
    input: { id: "string", status: "string?", mrr: "number?", notes: "string?", next_review: "string?" },
    run: async (input) => {
      const id = requireStr(input, "id");
      const patch: Record<string, unknown> = {};
      const status = str(input, "status");
      if (status) {
        if (!STATUSES.includes(status as ClientStatus)) throw new Error("Statut invalide.");
        patch.status = status;
      }
      const mrr = num(input, "mrr");
      if (mrr !== undefined) patch.mrr = mrr;
      if (str(input, "notes")) patch.notes = input.notes;
      if (str(input, "next_review")) patch.next_review = input.next_review;
      if (Object.keys(patch).length === 0) throw new Error("Rien à mettre à jour.");
      const { data, error } = await supabaseAdmin()
        .from("clients").update(patch).eq("id", id).select("*").single();
      if (error) throw new Error(error.message);
      return data;
    },
  },
]);

export { GET, POST };
