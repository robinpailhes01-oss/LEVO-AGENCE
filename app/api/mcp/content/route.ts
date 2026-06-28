import { mcpRoute, str, num, requireStr } from "@/lib/mcp";
import { supabaseAdmin } from "@/lib/supabase/server";
import { logActivity } from "@/lib/log";
import type { ContentStatus } from "@/lib/types";

export const runtime = "nodejs";

const STATUSES: ContentStatus[] = [
  "idea",
  "approved",
  "drafted",
  "validated",
  "published",
];

const { GET, POST } = mcpRoute("content", [
  {
    name: "list_content",
    description: "Liste les contenus, filtrable par statut.",
    input: { status: "string? (idea|approved|drafted|validated|published)" },
    run: async (input) => {
      let q = supabaseAdmin().from("content_calendar").select("*");
      const status = str(input, "status");
      if (status) q = q.eq("status", status);
      const { data, error } = await q.order("updated_at", { ascending: false });
      if (error) throw new Error(error.message);
      return data;
    },
  },
  {
    name: "get_content",
    description: "Récupère un contenu et ses slides.",
    input: { id: "string (uuid)" },
    run: async (input) => {
      const id = requireStr(input, "id");
      const db = supabaseAdmin();
      const [{ data: content }, { data: slides }] = await Promise.all([
        db.from("content_calendar").select("*").eq("id", id).maybeSingle(),
        db.from("content_slides").select("*").eq("content_id", id).order("position"),
      ]);
      if (!content) throw new Error("Contenu introuvable.");
      return { content, slides };
    },
  },
  {
    name: "create_idea",
    description: "Crée une nouvelle idée de contenu (statut idea).",
    input: { title: "string", hook: "string?", pillar: "string?", topic: "string?", format: "string?" },
    run: async (input) => {
      const { data, error } = await supabaseAdmin()
        .from("content_calendar")
        .insert({
          title: requireStr(input, "title"),
          hook: str(input, "hook") ?? null,
          pillar: str(input, "pillar") ?? null,
          topic: str(input, "topic") ?? null,
          format: str(input, "format") ?? "carousel",
          status: "idea",
        })
        .select("*")
        .single();
      if (error) throw new Error(error.message);
      await logActivity({
        agent: "luna",
        action: `a créé l'idée "${data.title}" (MCP)`,
        entityType: "content",
        entityId: data.id,
      });
      return data;
    },
  },
  {
    name: "update_content_status",
    description: "Change le statut d'un contenu dans le pipeline.",
    input: { id: "string", status: "string (idea|approved|drafted|validated|published)" },
    run: async (input) => {
      const id = requireStr(input, "id");
      const status = requireStr(input, "status") as ContentStatus;
      if (!STATUSES.includes(status)) throw new Error("Statut invalide.");
      const patch: Record<string, unknown> = { status };
      if (status === "published") patch.published_at = new Date().toISOString();
      const { data, error } = await supabaseAdmin()
        .from("content_calendar")
        .update(patch)
        .eq("id", id)
        .select("id, title, status")
        .single();
      if (error) throw new Error(error.message);
      return data;
    },
  },
  {
    name: "upsert_performance",
    description: "Enregistre les métriques de performance d'un contenu publié.",
    input: {
      content_id: "string",
      reach: "number?",
      impressions: "number?",
      likes: "number?",
      comments: "number?",
      shares: "number?",
      saves: "number?",
      engagement_rate: "number?",
    },
    run: async (input) => {
      const { data, error } = await supabaseAdmin()
        .from("content_performance")
        .insert({
          content_id: requireStr(input, "content_id"),
          reach: num(input, "reach") ?? 0,
          impressions: num(input, "impressions") ?? 0,
          likes: num(input, "likes") ?? 0,
          comments: num(input, "comments") ?? 0,
          shares: num(input, "shares") ?? 0,
          saves: num(input, "saves") ?? 0,
          engagement_rate: num(input, "engagement_rate") ?? 0,
        })
        .select("*")
        .single();
      if (error) throw new Error(error.message);
      return data;
    },
  },
]);

export { GET, POST };
