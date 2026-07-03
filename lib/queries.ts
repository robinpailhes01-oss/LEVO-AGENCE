import "server-only";
import { supabaseAdmin } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import type {
  AgentLog,
  Client,
  ContentItem,
  Lead,
  Niche,
  WeeklyReport,
} from "@/lib/db";

/**
 * Lecture des vraies données Supabase pour les Server Components.
 * Chaque helper est protégé : si Supabase n'est pas configuré ou renvoie une
 * erreur, on retombe sur une valeur vide → l'UI montre un état vide propre au
 * lieu de planter (build/preview OK sans clés).
 */

async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  if (!hasSupabase()) return fallback;
  try {
    return await fn();
  } catch (err) {
    console.error("[queries]", err);
    return fallback;
  }
}

export function getClients(): Promise<Client[]> {
  return safe(async () => {
    const { data, error } = await supabaseAdmin()
      .from("clients")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as Client[];
  }, []);
}

export function getLeads(): Promise<Lead[]> {
  return safe(async () => {
    const { data, error } = await supabaseAdmin()
      .from("leads")
      .select("*")
      .order("score", { ascending: false });
    if (error) throw error;
    return (data ?? []) as Lead[];
  }, []);
}

export function getNiches(): Promise<Niche[]> {
  return safe(async () => {
    const { data, error } = await supabaseAdmin()
      .from("niches")
      .select("*")
      .order("created_at", { ascending: true });
    if (error) throw error;
    return (data ?? []) as Niche[];
  }, []);
}

export function getContent(): Promise<ContentItem[]> {
  return safe(async () => {
    const { data, error } = await supabaseAdmin()
      .from("content_calendar")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as ContentItem[];
  }, []);
}

export function getRecentLogs(limit = 12): Promise<AgentLog[]> {
  return safe(async () => {
    const { data, error } = await supabaseAdmin()
      .from("agent_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data ?? []) as AgentLog[];
  }, []);
}

export function getReports(): Promise<WeeklyReport[]> {
  return safe(async () => {
    const { data, error } = await supabaseAdmin()
      .from("weekly_reports")
      .select("*")
      .order("week_start", { ascending: false });
    if (error) throw error;
    return (data ?? []) as WeeklyReport[];
  }, []);
}

export interface Overview {
  mrr: number;
  activeClients: number;
  activeLeads: number;
  publishedPosts: number;
  toValidate: number;
  avgEngagement: number;
  hotLeads: Lead[];
  leadsBySource: { label: string; value: number; color: string }[];
  leadsByStatus: Record<string, number>;
  logs: AgentLog[];
}

const SOURCE_LABELS: Record<string, string> = {
  instagram: "Instagram",
  linkedin: "LinkedIn",
  referral: "Referral",
  website: "Website",
  cold_email: "Cold email",
};
const SOURCE_COLORS = ["#1A3BFF", "#5566FF", "#8B5CF6", "#A9B2C7", "#1D9E75"];

export async function getOverview(): Promise<Overview> {
  const [clients, leads, content, logs, perf] = await Promise.all([
    getClients(),
    getLeads(),
    getContent(),
    getRecentLogs(20),
    safe(async () => {
      const { data, error } = await supabaseAdmin()
        .from("content_performance")
        .select("engagement_rate");
      if (error) throw error;
      return (data ?? []) as { engagement_rate: number | null }[];
    }, []),
  ]);

  const activeClients = clients.filter((c) => c.status === "active");
  const mrr = activeClients.reduce((s, c) => s + (Number(c.mrr) || 0), 0);
  const activeLeads = leads.filter((l) => !["won", "lost"].includes(l.status)).length;
  const publishedPosts = content.filter((c) => c.status === "published").length;
  const toValidate = content.filter((c) =>
    ["drafted", "approved_idea", "ready"].includes(c.status),
  ).length;
  const avgEngagement =
    perf.length > 0
      ? Number((perf.reduce((s, p) => s + (Number(p.engagement_rate) || 0), 0) / perf.length).toFixed(1))
      : 0;

  const bySourceMap: Record<string, number> = {};
  for (const l of leads) if (l.source) bySourceMap[l.source] = (bySourceMap[l.source] ?? 0) + 1;
  const leadsBySource = Object.entries(bySourceMap).map(([src, value], i) => ({
    label: SOURCE_LABELS[src] ?? src,
    value,
    color: SOURCE_COLORS[i % SOURCE_COLORS.length]!,
  }));

  const byStatus: Record<string, number> = {};
  for (const l of leads) byStatus[l.status] = (byStatus[l.status] ?? 0) + 1;

  return {
    mrr,
    activeClients: activeClients.length,
    activeLeads,
    publishedPosts,
    toValidate,
    avgEngagement,
    hotLeads: leads.filter((l) => l.score >= 70 && !["won", "lost"].includes(l.status)).slice(0, 5),
    leadsBySource,
    leadsByStatus: byStatus,
    logs,
  };
}
