import "server-only";
import { serverEnv } from "@/lib/env";

/** Client Instantly.ai API v2 — stats de campagnes + comptes d'envoi. */

const BASE_URL = "https://api.instantly.ai/api/v2";

function apiKey(): string {
  const key = serverEnv.instantlyApiKey;
  if (!key) throw new Error("INSTANTLY_API_KEY non configuré (Vercel → Settings → Environment Variables).");
  return key;
}

async function instantlyFetch(path: string, params?: URLSearchParams): Promise<unknown> {
  const qs = params && [...params.keys()].length > 0 ? `?${params.toString()}` : "";
  const res = await fetch(`${BASE_URL}${path}${qs}`, {
    method: "GET",
    headers: { Authorization: `Bearer ${apiKey()}` },
  });
  const body = (await res.json()) as unknown;
  if (!res.ok) throw new Error(`Instantly ${res.status} : ${JSON.stringify(body)}`);
  return body;
}

export interface CampaignAnalytics {
  campaign_name: string;
  campaign_id: string;
  campaign_status: number;
  emails_sent_count: number;
  open_count: number;
  open_count_unique: number;
  reply_count: number;
  reply_count_unique: number;
  link_click_count: number;
  bounced_count: number;
  unsubscribed_count: number;
  contacted_count: number;
  leads_count: number;
}

export async function getCampaignsAnalytics(): Promise<CampaignAnalytics[]> {
  const body = await instantlyFetch("/campaigns/analytics");
  return (Array.isArray(body) ? body : []) as CampaignAnalytics[];
}

export interface EmailAccount {
  email: string;
  status: number;
  warmup_status: number;
  stat_warmup_score: number;
  daily_limit: number;
}

export async function listAccounts(): Promise<EmailAccount[]> {
  const params = new URLSearchParams({ limit: "100" });
  const body = await instantlyFetch("/accounts", params);
  const items = (body as { items?: unknown[] })?.items;
  return (Array.isArray(items) ? items : []) as EmailAccount[];
}
