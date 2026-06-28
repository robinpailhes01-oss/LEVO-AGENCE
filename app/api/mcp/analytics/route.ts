import { mcpRoute, str, requireStr } from "@/lib/mcp";
import { supabaseAdmin } from "@/lib/supabase/server";
import { logActivity } from "@/lib/log";
import { aggregateWeek, lastWeekRange } from "@/lib/hermes";
import type { AgentName, LogStatus } from "@/lib/types";

export const runtime = "nodejs";

const AGENTS: AgentName[] = ["luna", "orion", "hermes", "veille", "system"];

const { GET, POST } = mcpRoute("analytics", [
  {
    name: "weekly_aggregate",
    description: "Agrège les données du dashboard sur les 7 derniers jours.",
    input: {},
    run: async () => {
      const range = lastWeekRange();
      const data = await aggregateWeek(range);
      return { range, data };
    },
  },
  {
    name: "list_reports",
    description: "Liste les rapports hebdomadaires enregistrés.",
    input: {},
    run: async () => {
      const { data, error } = await supabaseAdmin()
        .from("weekly_reports")
        .select("id, week_start, week_end, summary, sent_at")
        .order("week_start", { ascending: false });
      if (error) throw new Error(error.message);
      return data;
    },
  },
  {
    name: "get_report",
    description: "Récupère un rapport complet par id.",
    input: { id: "string" },
    run: async (input) => {
      const { data, error } = await supabaseAdmin()
        .from("weekly_reports")
        .select("*")
        .eq("id", requireStr(input, "id"))
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (!data) throw new Error("Rapport introuvable.");
      return data;
    },
  },
  {
    name: "recent_logs",
    description: "Renvoie les dernières activités des agents.",
    input: { agent: "string?", limit: "number?" },
    run: async (input) => {
      let q = supabaseAdmin().from("agent_logs").select("*");
      const agent = str(input, "agent");
      if (agent) q = q.eq("agent", agent);
      const { data, error } = await q
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw new Error(error.message);
      return data;
    },
  },
  {
    name: "log_event",
    description: "Enregistre un évènement d'agent dans le journal d'activité.",
    input: { agent: "string", action: "string", summary: "string?", status: "string?" },
    run: async (input) => {
      const agent = requireStr(input, "agent") as AgentName;
      if (!AGENTS.includes(agent)) throw new Error("Agent invalide.");
      const status = (str(input, "status") ?? "info") as LogStatus;
      await logActivity({
        agent,
        action: requireStr(input, "action"),
        summary: str(input, "summary"),
        status: (["success", "error", "info"] as LogStatus[]).includes(status)
          ? status
          : "info",
      });
      return { logged: true };
    },
  },
]);

export { GET, POST };
