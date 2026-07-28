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

/** Pipeline réel ORION (flow Robin). */
export type LeadStage =
  | "new"
  | "contacted"
  | "opened"
  | "replied"
  | "audit_received"
  | "loom_sent"
  | "follow_up"
  | "won"
  | "lost";

export interface Lead {
  id: string;
  created_at: string;
  full_name: string | null;
  first_name: string | null;
  company: string | null;
  sector: string | null;
  email: string | null;
  linkedin_url: string | null;
  instagram_handle: string | null;
  source: LeadSource | null;
  score: number;
  status: LeadStatus;
  stage: LeadStage;
  niche_id: string | null;
  campaign_id: string | null;
  instantly_lead_id: string | null;
  opens: number;
  last_event_at: string | null;
  last_touch: string | null;
  exported_at: string | null;
  notes: string | null;
  assigned_agent: string | null;
  pain_points: string[] | null;
  enrichment_data: Record<string, unknown> | null;
}

/* ---- Outreach (cold email) ---- */

export interface Niche {
  id: string;
  created_at: string;
  name: string;
  pain_point: string | null;
  value_prop: string | null;
  target_criteria: string | null;
  status: "testing" | "active" | "paused" | "archived";
}

export interface Campaign {
  id: string;
  created_at: string;
  niche_id: string | null;
  name: string;
  instantly_campaign_id: string | null;
  inbox_email: string | null;
  daily_limit: number;
  status: "draft" | "active" | "paused";
  channel: "instantly" | "resend";
}

export type EmailEventType =
  | "sent"
  | "opened"
  | "clicked"
  | "replied"
  | "bounced"
  | "unsubscribed";

export interface EmailEvent {
  id: string;
  created_at: string;
  lead_id: string | null;
  campaign_id: string | null;
  type: EmailEventType;
  occurred_at: string;
  meta: Record<string, unknown> | null;
}

export interface Reply {
  id: string;
  created_at: string;
  lead_id: string | null;
  from_email: string | null;
  to_inbox: string | null;
  subject: string | null;
  body: string | null;
  received_at: string;
  is_read: boolean;
  instantly_message_id: string | null;
}

export interface Audit {
  id: string;
  created_at: string;
  lead_id: string | null;
  niche_id: string | null;
  status: "invited" | "started" | "completed";
  answers: Record<string, unknown> | null;
  submitted_at: string | null;
  loom_url: string | null;
  mockup_notes: string | null;
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
  /** Historique de chat LUNA ayant mené à ce post — {role, content}[]. */
  chat_history: unknown;
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

/** HERMES — brouillon d'analyse + email personnalisé, en attente de validation humaine. */
export interface HermesAnalysis {
  id: string;
  created_at: string;
  lead_id: string;
  status: "draft" | "approved" | "rejected" | "sent";
  website_excerpt: string | null;
  subject_line: string | null;
  hook: string | null;
  confidence_score: number | null;
  contact_first_name: string | null;
  email_body: string | null;
  edited: boolean;
  reviewed_at: string | null;
  sent_at: string | null;
}

/** LUNA — référence visuelle permanente (mémoire de style), injectée dans chaque nouveau brief. */
export interface LunaReference {
  id: string;
  created_at: string;
  note: string;
  image_data: string;
}

export interface WatchedAccount {
  id: string;
  platform: "instagram" | "linkedin" | null;
  handle: string;
  category: string | null;
  active: boolean;
  last_scraped: string | null;
}
