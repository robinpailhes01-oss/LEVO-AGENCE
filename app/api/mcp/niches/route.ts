import { mcpRoute, str, arr, requireStr } from "@/lib/mcp";
import { supabaseAdmin } from "@/lib/supabase/server";

export const runtime = "nodejs";

const STATUSES = ["testing", "active", "paused", "archived"];

const { GET, POST } = mcpRoute("niches", [
  {
    name: "list_niches",
    description: "Liste les niches avec, pour chacune, le nombre de leads rattachés.",
    run: async () => {
      const db = supabaseAdmin();
      const { data: niches, error } = await db.from("niches").select("*").order("created_at", { ascending: true });
      if (error) throw new Error(error.message);
      const { data: leads } = await db.from("leads").select("niche_id");
      const counts = new Map<string, number>();
      for (const l of leads ?? []) {
        const id = (l as { niche_id: string | null }).niche_id;
        if (id) counts.set(id, (counts.get(id) ?? 0) + 1);
      }
      return (niches ?? []).map((n) => ({ ...(n as Record<string, unknown>), lead_count: counts.get((n as { id: string }).id) ?? 0 }));
    },
    input: {},
  },
  {
    name: "create_niche",
    description: "Crée une niche (un métier ciblé). pain_point/value_prop servent à personnaliser l'approche ORION.",
    input: { name: "string", pain_point: "string?", value_prop: "string?", target_criteria: "string?" },
    run: async (input) => {
      const { data, error } = await supabaseAdmin().from("niches").insert({
        name: requireStr(input, "name"),
        pain_point: str(input, "pain_point") ?? null,
        value_prop: str(input, "value_prop") ?? null,
        target_criteria: str(input, "target_criteria") ?? null,
        status: "testing",
      }).select("*").single();
      if (error) throw new Error(error.message);
      return data;
    },
  },
  {
    name: "update_niche",
    description: "Met à jour une niche (nom, pain, value prop, statut).",
    input: { id: "string", name: "string?", pain_point: "string?", value_prop: "string?", status: "string?" },
    run: async (input) => {
      const patch: Record<string, unknown> = {};
      for (const k of ["name", "pain_point", "value_prop", "target_criteria"] as const) {
        const v = str(input, k);
        if (v !== undefined) patch[k] = v;
      }
      const status = str(input, "status");
      if (status) {
        if (!STATUSES.includes(status)) throw new Error("Statut invalide.");
        patch.status = status;
      }
      const { data, error } = await supabaseAdmin()
        .from("niches").update(patch).eq("id", requireStr(input, "id")).select("*").single();
      if (error) throw new Error(error.message);
      return data;
    },
  },
  {
    name: "assign_niche",
    description: "Rattache une liste de leads (par id) à une niche.",
    input: { lead_ids: "array of string", niche_id: "string" },
    run: async (input) => {
      const ids = arr(input, "lead_ids");
      if (!ids || ids.length === 0) throw new Error("`lead_ids` (array) requis.");
      const nicheId = requireStr(input, "niche_id");
      const { data, error } = await supabaseAdmin()
        .from("leads").update({ niche_id: nicheId }).in("id", ids).select("id");
      if (error) throw new Error(error.message);
      return { updated: (data ?? []).length };
    },
  },
]);

export { GET, POST };
