/**
 * Types du domaine, alignés sur supabase/schema.sql (MASTER_PLAN §1A).
 * Écrits à la main, stricts — pas de `any`.
 */

export type AgentName = "LUNA" | "ORION" | "HERMES" | "LEA" | "VEILLE";
export type LogStatus = "success" | "error" | "pending" | "skipped";

export type ClientStatus = "active" | "churned" | "prospect";

export type LeadSource =
  | "instagram"
  | "linkedin"
  | "referral"
  | "website"
  | "cold_email";
export type LeadStatus =
  | "new"
  | "contacted"
  | "responded"
  | "qualified"
  | "proposal"
  | "won"
  | "lost";

export type ContentTheme =
  | "cas_client"
  | "hook_probleme"
  | "educatif"
  | "solution"
  | "methode";
export type ContentStatus =
  | "idea"
  | "approved_idea"
  | "drafted"
  | "approved_content"
  | "generating"
  | "ready"
  | "scheduled"
  | "published";

export type ProposalStatus =
  | "draft"
  | "sent"
  | "viewed"
  | "accepted"
  | "rejected";

export interface Client {
  id: string;
  created_at: string;
  name: string;
  company: string;
  sector: string | null;
  email: string | null;
  phone: string | null;
  status: ClientStatus;
  mrr: number;
  agent_name: string | null;
  notes: string | null;
  contract_start: string | null;
  next_review: string | null;
}

export interface Lead {
  id: string;
  created_at: string;
  full_name: string | null;
  company: string | null;
  sector: string | null;
  email: string | null;
  linkedin_url: string | null;
  instagram_handle: string | null;
  source: LeadSource | null;
  score: number;
  status: LeadStatus;
  last_touch: string | null;
  notes: string | null;
  assigned_agent: string | null;
  pain_points: string[] | null;
  enrichment_data: Record<string, unknown> | null;
}

export interface ContentItem {
  id: string;
  created_at: string;
  title: string;
  theme: ContentTheme | null;
  platform: string[];
  status: ContentStatus;
  hook_slide1: string | null;
  slides_content: unknown;
  image_prompts: unknown;
  generated_images: string[] | null;
  caption: string | null;
  hashtags: string[] | null;
  scheduled_at: string | null;
  published_at: string | null;
  created_by: string | null;
  approved_by: string | null;
  client_ref: string | null;
}

export interface ContentPerformance {
  id: string;
  content_id: string | null;
  measured_at: string;
  platform: string | null;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  reach: number;
  impressions: number;
  engagement_rate: number | null;
  profile_visits: number;
  link_clicks: number;
}

export interface AgentLog {
  id: string;
  created_at: string;
  agent_name: AgentName;
  action: string;
  input_data: Record<string, unknown> | null;
  output_data: Record<string, unknown> | null;
  status: LogStatus;
  duration_ms: number | null;
  cost_tokens: number | null;
  error_message: string | null;
}

export interface Proposal {
  id: string;
  created_at: string;
  lead_id: string | null;
  title: string | null;
  content: string | null;
  amount: number | null;
  status: ProposalStatus;
  sent_at: string | null;
  valid_until: string | null;
  services: unknown;
  generated_by: string | null;
}

export interface WeeklyReport {
  id: string;
  created_at: string;
  week_start: string;
  week_end: string;
  mrr_total: number | null;
  mrr_change: number | null;
  leads_new: number;
  leads_qualified: number;
  posts_published: number;
  posts_avg_engagement: number | null;
  top_post_id: string | null;
  report_content: string | null;
  recommendations: string[] | null;
  generated_by: string | null;
}

export interface Setting {
  key: string;
  value: unknown;
  updated_at: string;
}

export interface WatchedAccount {
  id: string;
  platform: "instagram" | "linkedin" | null;
  handle: string;
  category: string | null;
  active: boolean;
  last_scraped: string | null;
}
