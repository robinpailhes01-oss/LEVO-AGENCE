import { mcpRoute, str, num, arr, requireStr } from "@/lib/mcp";
import { supabaseAdmin } from "@/lib/supabase/server";

export const runtime = "nodejs";

const { GET, POST } = mcpRoute("analytics", [
  {
    name: "get_weekly_stats",
    description: "Statistiques agrégées d'une semaine (à partir de week_start, sur 7 jours).",
    input: { week_start: "string (YYYY-MM-DD)" },
    run: async (input) => {
      const start = requireStr(input, "week_start");
      const startIso = new Date(`${start}T00:00:00Z`).toISOString();
      const endIso = new Date(new Date(startIso).getTime() + 7 * 864e5).toISOString();
      const db = supabaseAdmin();

      const [clients, leads, content, perf] = await Promise.all([
        db.from("clients").select("status, mrr"),
        db.from("leads").select("status, created_at"),
        db.from("content_calendar").select("status, published_at"),
        db.from("content_performance").select("engagement_rate, measured_at"),
      ]);
      if (clients.error) throw new Error(clients.error.message);

      const cl = (clients.data ?? []) as { status: string; mrr: number }[];
      const ld = (leads.data ?? []) as { status: string; created_at: string }[];
      const ct = (content.data ?? []) as { status: string; published_at: string | null }[];
      const pf = (perf.data ?? []) as { engagement_rate: number | null; measured_at: string }[];

      const active = cl.filter((c) => c.status === "active");
      const inWeek = (d: string | null) => !!d && d >= startIso && d < endIso;

      return {
        week_start: start,
        mrr_total: active.reduce((s, c) => s + (Number(c.mrr) || 0), 0),
        active_clients: active.length,
        leads_new: ld.filter((l) => inWeek(l.created_at)).length,
        leads_qualified: ld.filter((l) => ["qualified", "proposal", "won"].includes(l.status)).length,
        posts_published: ct.filter((c) => inWeek(c.published_at)).length,
        avg_engagement:
          pf.length > 0
            ? Number((pf.reduce((s, p) => s + (Number(p.engagement_rate) || 0), 0) / pf.length).toFixed(2))
            : 0,
      };
    },
  },
  {
    name: "get_top_content",
    description: "Contenus les plus performants (par défaut sur les saves).",
    input: { limit: "number?", metric: "string? (saves|reach|likes|engagement_rate)" },
    run: async (input) => {
      const metric = str(input, "metric") ?? "saves";
      const allowed = ["saves", "reach", "likes", "comments", "shares", "engagement_rate"];
      const col = allowed.includes(metric) ? metric : "saves";
      const { data, error } = await supabaseAdmin()
        .from("content_performance")
        .select("content_id, " + col + ", content_calendar(title, status)")
        .order(col, { ascending: false })
        .limit(num(input, "limit") ?? 5);
      if (error) throw new Error(error.message);
      return data;
    },
  },
  {
    name: "get_lead_pipeline",
    description: "Répartition des leads par statut, avec comptages.",
    input: {},
    run: async () => {
      const { data, error } = await supabaseAdmin().from("leads").select("status");
      if (error) throw new Error(error.message);
      const counts: Record<string, number> = {};
      for (const row of (data ?? []) as { status: string }[]) {
        counts[row.status] = (counts[row.status] ?? 0) + 1;
      }
      return counts;
    },
  },
  {
    name: "create_weekly_report",
    description: "Enregistre un rapport hebdomadaire.",
    input: {
      week_start: "string", week_end: "string", report_content: "string",
      recommendations: "string[]?", mrr_total: "number?",
    },
    run: async (input) => {
      const { data, error } = await supabaseAdmin()
        .from("weekly_reports")
        .insert({
          week_start: requireStr(input, "week_start"),
          week_end: requireStr(input, "week_end"),
          report_content: str(input, "report_content") ?? null,
          recommendations: arr(input, "recommendations") ?? null,
          mrr_total: num(input, "mrr_total") ?? null,
          generated_by: "HERMES",
        })
        .select("*").single();
      if (error) throw new Error(error.message);
      return data;
    },
  },
]);

export { GET, POST };
