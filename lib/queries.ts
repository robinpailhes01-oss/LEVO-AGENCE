import "server-only";
import { supabaseAdmin } from "@/lib/supabase/server";
import type {
  AgentLog,
  Client,
  ContentItem,
  ContentSlide,
  Lead,
  Setting,
  WeeklyReport,
} from "@/lib/types";

/**
 * Safe data-access helpers for Server Components.
 * Each swallows errors (e.g. missing env in preview) and returns a fallback,
 * so the dashboard renders an empty state instead of crashing.
 */

async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    console.error("[queries] read failed:", err);
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

export function getLead(id: string): Promise<Lead | null> {
  return safe(async () => {
    const { data, error } = await supabaseAdmin()
      .from("leads")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return (data as Lead | null) ?? null;
  }, null);
}

export function getContent(): Promise<ContentItem[]> {
  return safe(async () => {
    const { data, error } = await supabaseAdmin()
      .from("content_calendar")
      .select("*")
      .order("updated_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as ContentItem[];
  }, []);
}

export function getContentItem(id: string): Promise<ContentItem | null> {
  return safe(async () => {
    const { data, error } = await supabaseAdmin()
      .from("content_calendar")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return (data as ContentItem | null) ?? null;
  }, null);
}

export function getSlides(contentId: string): Promise<ContentSlide[]> {
  return safe(async () => {
    const { data, error } = await supabaseAdmin()
      .from("content_slides")
      .select("*")
      .eq("content_id", contentId)
      .order("position", { ascending: true });
    if (error) throw error;
    return (data ?? []) as ContentSlide[];
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

export function getSettings(): Promise<Setting[]> {
  return safe(async () => {
    const { data, error } = await supabaseAdmin()
      .from("settings")
      .select("*")
      .order("key", { ascending: true });
    if (error) throw error;
    return (data ?? []) as Setting[];
  }, []);
}

export interface OverviewStats {
  mrr: number;
  activeLeads: number;
  publishedPosts: number;
  avgEngagement: number;
  activeClients: number;
  hotLeads: Lead[];
  toValidate: ContentItem[];
}

export async function getOverviewStats(): Promise<OverviewStats> {
  const [clients, leads, content] = await Promise.all([
    getClients(),
    getLeads(),
    getContent(),
  ]);

  const activeClients = clients.filter((c) => c.status === "active");
  const mrr = activeClients.reduce((sum, c) => sum + (c.monthly_fee ?? 0), 0);
  const activeLeads = leads.filter(
    (l) => !["won", "lost"].includes(l.status),
  ).length;
  const publishedPosts = content.filter((c) => c.status === "published").length;

  const perf = await safe(async () => {
    const { data, error } = await supabaseAdmin()
      .from("content_performance")
      .select("engagement_rate");
    if (error) throw error;
    return (data ?? []) as { engagement_rate: number }[];
  }, []);
  const avgEngagement =
    perf.length > 0
      ? perf.reduce((s, p) => s + (p.engagement_rate ?? 0), 0) / perf.length
      : 0;

  const hotLeads = leads
    .filter((l) => l.score >= 70 && !["won", "lost"].includes(l.status))
    .slice(0, 5);
  const toValidate = content
    .filter((c) => c.status === "drafted" || c.status === "approved")
    .slice(0, 5);

  return {
    mrr,
    activeLeads,
    publishedPosts,
    avgEngagement,
    activeClients: activeClients.length,
    hotLeads,
    toValidate,
  };
}
