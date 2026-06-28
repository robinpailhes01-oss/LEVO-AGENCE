import "server-only";
import { supabaseAdmin } from "@/lib/supabase/server";
import { serverEnv } from "@/lib/env";

export interface WeeklyData {
  clients: { total: number; active: number; mrr: number };
  leads: {
    total: number;
    newThisWeek: number;
    byStatus: Record<string, number>;
    avgScore: number;
  };
  content: {
    published: number;
    pipeline: number;
    publishedThisWeek: number;
  };
  performance: { avgEngagement: number; samples: number };
}

export interface WeekRange {
  start: string; // ISO date
  end: string; // ISO date
}

export function lastWeekRange(now = new Date()): WeekRange {
  const end = new Date(now);
  const start = new Date(now);
  start.setDate(start.getDate() - 7);
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

/** Aggregate the full dashboard state for a given week. */
export async function aggregateWeek(range: WeekRange): Promise<WeeklyData> {
  const db = supabaseAdmin();
  const sinceIso = new Date(`${range.start}T00:00:00Z`).toISOString();

  const [clientsRes, leadsRes, contentRes, perfRes] = await Promise.all([
    db.from("clients").select("status, monthly_fee"),
    db.from("leads").select("status, score, created_at"),
    db.from("content_calendar").select("status, published_at"),
    db.from("content_performance").select("engagement_rate"),
  ]);

  const clients = (clientsRes.data ?? []) as {
    status: string;
    monthly_fee: number;
  }[];
  const leads = (leadsRes.data ?? []) as {
    status: string;
    score: number;
    created_at: string;
  }[];
  const content = (contentRes.data ?? []) as {
    status: string;
    published_at: string | null;
  }[];
  const perf = (perfRes.data ?? []) as { engagement_rate: number }[];

  const activeClients = clients.filter((c) => c.status === "active");
  const byStatus: Record<string, number> = {};
  for (const l of leads) byStatus[l.status] = (byStatus[l.status] ?? 0) + 1;

  return {
    clients: {
      total: clients.length,
      active: activeClients.length,
      mrr: activeClients.reduce((s, c) => s + (c.monthly_fee ?? 0), 0),
    },
    leads: {
      total: leads.length,
      newThisWeek: leads.filter((l) => l.created_at >= sinceIso).length,
      byStatus,
      avgScore:
        leads.length > 0
          ? Math.round(leads.reduce((s, l) => s + (l.score ?? 0), 0) / leads.length)
          : 0,
    },
    content: {
      published: content.filter((c) => c.status === "published").length,
      pipeline: content.filter((c) => c.status !== "published").length,
      publishedThisWeek: content.filter(
        (c) => c.published_at && c.published_at >= sinceIso,
      ).length,
    },
    performance: {
      avgEngagement:
        perf.length > 0
          ? Number(
              (
                perf.reduce((s, p) => s + (p.engagement_rate ?? 0), 0) /
                perf.length
              ).toFixed(1),
            )
          : 0,
      samples: perf.length,
    },
  };
}

/**
 * Send the report by email via Resend. No-op (returns false) when RESEND_API_KEY
 * or EMAIL_TO are not configured. Never throws.
 */
export async function sendReportEmail(
  subject: string,
  markdown: string,
): Promise<boolean> {
  const apiKey = serverEnv.resendApiKey;
  const to = serverEnv.emailTo;
  if (!apiKey || !to) return false;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        from: "Levo HERMES <onboarding@resend.dev>",
        to: [to],
        subject,
        text: markdown,
      }),
    });
    return res.ok;
  } catch (err) {
    console.error("[sendReportEmail] failed:", err);
    return false;
  }
}
