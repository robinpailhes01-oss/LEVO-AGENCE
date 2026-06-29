import { mcpRoute, str, num, arr, obj, requireStr } from "@/lib/mcp";
import { supabaseAdmin } from "@/lib/supabase/server";
import type { AgentName, ContentStatus, ContentTheme, LogStatus } from "@/lib/db";

export const runtime = "nodejs";

const STATUSES: ContentStatus[] = [
  "idea", "approved_idea", "drafted", "approved_content",
  "generating", "ready", "scheduled", "published",
];
const THEMES: ContentTheme[] = [
  "cas_client", "hook_probleme", "educatif", "solution", "methode",
];
const AGENTS: AgentName[] = ["LUNA", "ORION", "HERMES", "LEA", "VEILLE"];

const { GET, POST } = mcpRoute("content", [
  {
    name: "get_content_calendar",
    description: "Liste les contenus du calendrier, filtrable par statut.",
    input: { status: "string?", limit: "number?" },
    run: async (input) => {
      let q = supabaseAdmin().from("content_calendar").select("*");
      const status = str(input, "status");
      if (status) q = q.eq("status", status);
      const { data, error } = await q
        .order("created_at", { ascending: false })
        .limit(num(input, "limit") ?? 50);
      if (error) throw new Error(error.message);
      return data;
    },
  },
  {
    name: "create_content_idea",
    description: "Crée une idée de contenu (statut idea).",
    input: { title: "string", theme: "string?", hook_slide1: "string?", platform: "string[]?" },
    run: async (input) => {
      const theme = str(input, "theme");
      const { data, error } = await supabaseAdmin()
        .from("content_calendar")
        .insert({
          title: requireStr(input, "title"),
          theme: theme && THEMES.includes(theme as ContentTheme) ? theme : null,
          hook_slide1: str(input, "hook_slide1") ?? null,
          platform: arr(input, "platform") ?? ["instagram", "facebook"],
          status: "idea",
          created_by: "LUNA",
        })
        .select("*")
        .single();
      if (error) throw new Error(error.message);
      return data;
    },
  },
  {
    name: "update_content_status",
    description: "Met à jour le statut/contenu d'un post (slides, prompts, caption).",
    input: {
      id: "string", status: "string?", slides_content: "json?",
      image_prompts: "json?", caption: "string?", hashtags: "string[]?",
    },
    run: async (input) => {
      const id = requireStr(input, "id");
      const patch: Record<string, unknown> = {};
      const status = str(input, "status");
      if (status) {
        if (!STATUSES.includes(status as ContentStatus)) throw new Error("Statut invalide.");
        patch.status = status;
        if (status === "published") patch.published_at = new Date().toISOString();
      }
      if (obj(input, "slides_content")) patch.slides_content = input.slides_content;
      if (obj(input, "image_prompts")) patch.image_prompts = input.image_prompts;
      if (str(input, "caption")) patch.caption = input.caption;
      if (arr(input, "hashtags")) patch.hashtags = input.hashtags;
      if (Object.keys(patch).length === 0) throw new Error("Rien à mettre à jour.");
      const { data, error } = await supabaseAdmin()
        .from("content_calendar").update(patch).eq("id", id).select("*").single();
      if (error) throw new Error(error.message);
      return data;
    },
  },
  {
    name: "get_content_performance",
    description: "Renvoie les métriques de performance d'un contenu.",
    input: { content_id: "string" },
    run: async (input) => {
      const { data, error } = await supabaseAdmin()
        .from("content_performance").select("*")
        .eq("content_id", requireStr(input, "content_id"))
        .order("measured_at", { ascending: false });
      if (error) throw new Error(error.message);
      return data;
    },
  },
  {
    name: "log_agent_action",
    description: "Enregistre une action d'agent dans agent_logs.",
    input: { agent_name: "string", action: "string", input_data: "json?", output_data: "json?", status: "string?" },
    run: async (input) => {
      const agent = requireStr(input, "agent_name") as AgentName;
      if (!AGENTS.includes(agent)) throw new Error("Agent invalide.");
      const status = (str(input, "status") ?? "success") as LogStatus;
      const { data, error } = await supabaseAdmin()
        .from("agent_logs")
        .insert({
          agent_name: agent,
          action: requireStr(input, "action"),
          input_data: obj(input, "input_data") ?? null,
          output_data: obj(input, "output_data") ?? null,
          status,
        })
        .select("*").single();
      if (error) throw new Error(error.message);
      return data;
    },
  },
]);

export { GET, POST };
