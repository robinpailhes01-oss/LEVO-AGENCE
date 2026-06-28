import { mcpRoute, str, num, requireStr } from "@/lib/mcp";
import { supabaseAdmin } from "@/lib/supabase/server";
import { logActivity } from "@/lib/log";
import type { ClientStatus } from "@/lib/types";

export const runtime = "nodejs";

const STATUSES: ClientStatus[] = ["active", "paused", "churned"];

const { GET, POST } = mcpRoute("clients", [
  {
    name: "list_clients",
    description: "Liste tous les clients de l'agence.",
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
    description: "Récupère un client par id.",
    input: { id: "string" },
    run: async (input) => {
      const { data, error } = await supabaseAdmin()
        .from("clients")
        .select("*")
        .eq("id", requireStr(input, "id"))
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (!data) throw new Error("Client introuvable.");
      return data;
    },
  },
  {
    name: "create_client",
    description: "Ajoute un nouveau client.",
    input: {
      name: "string",
      company: "string?",
      email: "string?",
      niche: "string?",
      monthly_fee: "number?",
      instagram_handle: "string?",
    },
    run: async (input) => {
      const { data, error } = await supabaseAdmin()
        .from("clients")
        .insert({
          name: requireStr(input, "name"),
          company: str(input, "company") ?? null,
          email: str(input, "email") ?? null,
          niche: str(input, "niche") ?? null,
          monthly_fee: num(input, "monthly_fee") ?? 0,
          instagram_handle: str(input, "instagram_handle") ?? null,
          status: "active",
        })
        .select("*")
        .single();
      if (error) throw new Error(error.message);
      await logActivity({
        agent: "system",
        action: `nouveau client : ${data.name} (MCP)`,
        entityType: "client",
        entityId: data.id,
      });
      return data;
    },
  },
  {
    name: "update_client",
    description: "Met à jour un client (statut, tarif mensuel, notes...).",
    input: { id: "string", status: "string?", monthly_fee: "number?", notes: "string?" },
    run: async (input) => {
      const id = requireStr(input, "id");
      const patch: Record<string, unknown> = {};
      const status = str(input, "status");
      if (status) {
        if (!STATUSES.includes(status as ClientStatus)) throw new Error("Statut invalide.");
        patch.status = status;
      }
      const fee = num(input, "monthly_fee");
      if (fee !== undefined) patch.monthly_fee = fee;
      const notes = str(input, "notes");
      if (notes) patch.notes = notes;
      if (Object.keys(patch).length === 0) throw new Error("Aucun champ à mettre à jour.");
      const { data, error } = await supabaseAdmin()
        .from("clients")
        .update(patch)
        .eq("id", id)
        .select("*")
        .single();
      if (error) throw new Error(error.message);
      return data;
    },
  },
]);

export { GET, POST };
