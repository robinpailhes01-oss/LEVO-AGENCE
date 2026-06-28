/**
 * Domain types mirroring the Supabase schema (see docs/schema.sql).
 * Kept hand-written and strict — no `any`.
 */

export type AgentName = "luna" | "orion" | "hermes" | "veille" | "system";

export type LogStatus = "success" | "error" | "info";

export type ClientStatus = "active" | "paused" | "churned";

export type LeadStatus =
  | "new"
  | "enriched"
  | "contacted"
  | "replied"
  | "qualified"
  | "won"
  | "lost";

export type ContentStatus =
  | "idea"
  | "approved"
  | "drafted"
  | "validated"
  | "published";

export type ContentFormat = "carousel" | "reel" | "single" | "story";

export type ProposalStatus = "draft" | "sent" | "accepted" | "rejected";

export interface Client {
  id: string;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  niche: string | null;
  instagram_handle: string | null;
  status: ClientStatus;
  monthly_fee: number;
  services: string[];
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Lead {
  id: string;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  instagram_handle: string | null;
  website: string | null;
  niche: string | null;
  location: string | null;
  score: number;
  status: LeadStatus;
  source: string | null;
  enrichment: Record<string, unknown> | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContentItem {
  id: string;
  client_id: string | null;
  title: string;
  hook: string | null;
  topic: string | null;
  pillar: string | null;
  format: ContentFormat;
  status: ContentStatus;
  caption: string | null;
  hashtags: string[];
  scheduled_for: string | null;
  published_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContentSlide {
  id: string;
  content_id: string;
  position: number;
  headline: string | null;
  body: string | null;
  image_prompt: string | null;
  image_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContentPerformance {
  id: string;
  content_id: string;
  reach: number;
  impressions: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  engagement_rate: number;
  measured_at: string;
  created_at: string;
}

export interface AgentLog {
  id: string;
  agent: AgentName;
  action: string;
  summary: string | null;
  entity_type: string | null;
  entity_id: string | null;
  status: LogStatus;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface Proposal {
  id: string;
  lead_id: string | null;
  title: string;
  status: ProposalStatus;
  amount: number;
  currency: string;
  content: string | null;
  sent_at: string | null;
  valid_until: string | null;
  created_at: string;
  updated_at: string;
}

export interface WeeklyReport {
  id: string;
  week_start: string;
  week_end: string;
  summary: string | null;
  metrics: Record<string, unknown> | null;
  content_md: string | null;
  sent_at: string | null;
  email_to: string | null;
  created_at: string;
}

export interface Setting {
  id: string;
  key: string;
  value: Record<string, unknown> | null;
  description: string | null;
  updated_at: string;
}

export interface WatchedAccount {
  id: string;
  platform: string;
  handle: string;
  display_name: string | null;
  category: string | null;
  followers: number;
  last_checked_at: string | null;
  notes: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

/** Agent metadata used across the UI. */
export interface AgentMeta {
  key: Exclude<AgentName, "system">;
  name: string;
  role: string;
  color: string;
  avatar: string;
}

export const AGENTS: Record<Exclude<AgentName, "system">, AgentMeta> = {
  luna: {
    key: "luna",
    name: "LUNA",
    role: "Contenu & Carrousels",
    color: "#1A3BFF",
    avatar: "/avatars/luna.png",
  },
  orion: {
    key: "orion",
    name: "ORION",
    role: "Prospection & Leads",
    color: "#1D9E75",
    avatar: "/avatars/orion.png",
  },
  hermes: {
    key: "hermes",
    name: "HERMES",
    role: "Analytics & Rapports",
    color: "#BA7517",
    avatar: "/avatars/hermes.png",
  },
  veille: {
    key: "veille",
    name: "VEILLE",
    role: "Veille concurrentielle",
    color: "#7B2FBE",
    avatar: "/avatars/veille.png",
  },
};
