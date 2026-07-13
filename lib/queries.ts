import "server-only";
import { unstable_noStore as noStore } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import type {
  AgentLog,
  Audit,
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
  // Interdit tout cache (Data Cache Vercel / fetch cache Next) sur les lectures :
  // le dashboard doit TOUJOURS refléter l'état réel de la base, jamais une copie figée.
  noStore();
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

/** Supabase/PostgREST plafonne une lecture à 1000 lignes — on pagine pour tout récupérer. */
export function getLeads(): Promise<Lead[]> {
  return safe(async () => {
    const pageSize = 1000;
    const all: Lead[] = [];
    for (let from = 0; ; from += pageSize) {
      const { data, error } = await supabaseAdmin()
        .from("leads")
        .select("*")
        // tri secondaire par id (unique) → ordre TOTAL déterministe : sans ça,
        // avec des scores tous égaux, la pagination .range() saute des lignes.
        .order("score", { ascending: false })
        .order("id", { ascending: true })
        .range(from, from + pageSize - 1);
      if (error) throw error;
      all.push(...((data ?? []) as Lead[]));
      if (!data || data.length < pageSize) break;
    }
    return all;
  }, []);
}

export interface ReplyWithLead {
  id: string;
  lead_id: string | null;
  from_email: string | null;
  subject: string | null;
  body: string | null;
  received_at: string;
  is_read: boolean;
  company: string | null;
  full_name: string | null;
}

/** Réponses reçues (inbox), les plus récentes d'abord, avec le nom de l'entreprise. */
export function getRecentReplies(limit = 30): Promise<ReplyWithLead[]> {
  return safe(async () => {
    const { data, error } = await supabaseAdmin()
      .from("replies")
      .select("id, lead_id, from_email, subject, body, received_at, is_read, leads(company, full_name)")
      .order("received_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data ?? []).map((r) => {
      const row = r as Record<string, unknown>;
      const lead = (row.leads ?? {}) as { company?: string | null; full_name?: string | null };
      return {
        id: String(row.id),
        lead_id: (row.lead_id as string | null) ?? null,
        from_email: (row.from_email as string | null) ?? null,
        subject: (row.subject as string | null) ?? null,
        body: (row.body as string | null) ?? null,
        received_at: String(row.received_at),
        is_read: Boolean(row.is_read),
        company: lead.company ?? null,
        full_name: lead.full_name ?? null,
      };
    });
  }, []);
}

export function getUnreadReplyCount(): Promise<number> {
  return safe(async () => {
    const { count, error } = await supabaseAdmin()
      .from("replies")
      .select("*", { count: "exact", head: true })
      .eq("is_read", false);
    if (error) throw error;
    return count ?? 0;
  }, 0);
}

/** Dernier audit par lead (lead_id -> Audit le plus récent). */
export function getLatestAuditsByLead(): Promise<Record<string, Audit>> {
  return safe(async () => {
    const { data, error } = await supabaseAdmin()
      .from("lead_audits")
      .select("*")
      .order("submitted_at", { ascending: false });
    if (error) throw error;
    const byLead: Record<string, Audit> = {};
    for (const a of (data ?? []) as Audit[]) {
      if (a.lead_id && !byLead[a.lead_id]) byLead[a.lead_id] = a;
    }
    return byLead;
  }, {});
}

export interface PendingAudit {
  leadId: string;
  company: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  perte: number | null;
  heures: number | null;
  taches: string[];
  horizon: string | null;
  submittedAt: string;
  answers: Record<string, unknown>;
}

/** Audits reçus à traiter, avec leurs réponses — pour la section d'accueil (rendu serveur). */
export function getPendingAudits(): Promise<PendingAudit[]> {
  return safe(async () => {
    const db = supabaseAdmin();
    const { data: leadsData } = await db.from("leads").select("*").eq("stage", "audit_received");
    const list = (leadsData ?? []) as Lead[];
    if (list.length === 0) return [];
    const { data: auditsData } = await db
      .from("lead_audits")
      .select("*")
      .in("lead_id", list.map((l) => l.id))
      .order("submitted_at", { ascending: false });
    const byLead = new Map<string, Record<string, unknown>>();
    for (const a of auditsData ?? []) {
      const row = a as Record<string, unknown>;
      const lid = row.lead_id as string | null;
      if (lid && !byLead.has(lid)) byLead.set(lid, row);
    }
    return list.map((l) => {
      const audit = byLead.get(l.id);
      const ans = ((audit?.answers as Record<string, unknown>) ?? {}) as Record<string, unknown>;
      const enr = (l.enrichment_data ?? {}) as Record<string, unknown>;
      const s = (v: unknown): string | null => (typeof v === "string" && v ? v : null);
      const n = (v: unknown): number | null => (typeof v === "number" ? v : null);
      return {
        leadId: l.id,
        company: s(ans.entreprise) ?? l.company ?? l.full_name ?? "Prospect",
        contactName: [ans.prenom, ans.nom].filter((x) => typeof x === "string" && x).join(" ") || null,
        email: s(ans.email) ?? l.email,
        phone: s(enr.phone) ?? s(ans.telephone),
        perte: n(ans.perte_mensuelle_estimee),
        heures: n(ans.heures_perdues_semaine),
        taches: Array.isArray(ans.taches) ? (ans.taches as string[]) : [],
        horizon: s(ans.horizon),
        submittedAt: (audit?.submitted_at as string) ?? l.created_at,
        answers: ans,
      };
    });
  }, []);
}

/** Nombre d'audits reçus mais pas encore traités (Loom non envoyé) = stage audit_received. */
export function getPendingAuditsCount(): Promise<number> {
  return safe(async () => {
    const { count, error } = await supabaseAdmin()
      .from("leads")
      .select("*", { count: "exact", head: true })
      .eq("stage", "audit_received");
    if (error) throw error;
    return count ?? 0;
  }, 0);
}

/** Leads en « Loom envoyé » depuis 3+ jours sans avancer = à relancer. */
export function getFollowUpCount(): Promise<number> {
  return safe(async () => {
    const threshold = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
    const { count, error } = await supabaseAdmin()
      .from("leads")
      .select("*", { count: "exact", head: true })
      .eq("stage", "loom_sent")
      .lt("last_touch", threshold);
    if (error) throw error;
    return count ?? 0;
  }, 0);
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
