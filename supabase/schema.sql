-- ============================================================================
-- LEVO — Schéma Supabase (Étape 1 / Phase 1 du MASTER_PLAN)
-- Reprend EXACTEMENT les tables de MASTER_PLAN.md §1A (+ watched_accounts §D).
-- À exécuter dans le SQL Editor du projet Supabase Levo.
--
-- Modèle d'accès : le dashboard parle à Supabase uniquement côté serveur via la
-- service-role key (qui contourne la RLS). On active la RLS partout SANS policy
-- publique → la clé anon ne peut rien lire/écrire. Données privées.
-- ============================================================================

create extension if not exists "pgcrypto";

-- 1. clients -----------------------------------------------------------------
create table if not exists public.clients (
  id             uuid primary key default gen_random_uuid(),
  created_at     timestamptz default now(),
  name           text not null,
  company        text not null,
  sector         text,
  email          text,
  phone          text,
  status         text default 'active' check (status in ('active','churned','prospect')),
  mrr            numeric(10,2) default 0,
  agent_name     text,
  notes          text,
  contract_start date,
  next_review    date
);

-- 2. leads -------------------------------------------------------------------
create table if not exists public.leads (
  id               uuid primary key default gen_random_uuid(),
  created_at       timestamptz default now(),
  full_name        text,
  company          text,
  sector           text,
  email            text,
  linkedin_url     text,
  instagram_handle text,
  source           text check (source in ('instagram','linkedin','referral','website','cold_email')),
  score            integer default 0 check (score between 0 and 100),
  status           text default 'new' check (status in ('new','contacted','responded','qualified','proposal','won','lost')),
  last_touch       timestamptz,
  notes            text,
  assigned_agent   text default 'ORION',
  pain_points      text[],
  enrichment_data  jsonb
);
create index if not exists idx_leads_status on public.leads(status);
create index if not exists idx_leads_score on public.leads(score desc);

-- 3. content_calendar --------------------------------------------------------
create table if not exists public.content_calendar (
  id               uuid primary key default gen_random_uuid(),
  created_at       timestamptz default now(),
  title            text not null,
  theme            text check (theme in ('cas_client','hook_probleme','educatif','solution','methode')),
  platform         text[] default '{instagram,facebook}',
  status           text default 'idea' check (status in ('idea','approved_idea','drafted','approved_content','generating','ready','scheduled','published')),
  hook_slide1      text,
  slides_content   jsonb,
  image_prompts    jsonb,
  generated_images text[],
  caption          text,
  hashtags         text[],
  scheduled_at     timestamptz,
  published_at     timestamptz,
  created_by       text default 'LUNA',
  approved_by      text,
  client_ref       text
);
create index if not exists idx_content_status on public.content_calendar(status);

-- 4. content_performance -----------------------------------------------------
create table if not exists public.content_performance (
  id              uuid primary key default gen_random_uuid(),
  content_id      uuid references public.content_calendar(id) on delete cascade,
  measured_at     timestamptz default now(),
  platform        text,
  likes           integer default 0,
  comments        integer default 0,
  shares          integer default 0,
  saves           integer default 0,
  reach           integer default 0,
  impressions     integer default 0,
  engagement_rate numeric(5,2),
  profile_visits  integer default 0,
  link_clicks     integer default 0
);
create index if not exists idx_perf_content on public.content_performance(content_id);

-- 5. agent_logs --------------------------------------------------------------
create table if not exists public.agent_logs (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz default now(),
  agent_name    text not null check (agent_name in ('LUNA','ORION','HERMES','LEA','VEILLE')),
  action        text not null,
  input_data    jsonb,
  output_data   jsonb,
  status        text default 'success' check (status in ('success','error','pending','skipped')),
  duration_ms   integer,
  cost_tokens   integer,
  error_message text
);
create index if not exists idx_logs_created on public.agent_logs(created_at desc);

-- 6. proposals ---------------------------------------------------------------
create table if not exists public.proposals (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz default now(),
  lead_id      uuid references public.leads(id) on delete set null,
  title        text,
  content      text,
  amount       numeric(10,2),
  status       text default 'draft' check (status in ('draft','sent','viewed','accepted','rejected')),
  sent_at      timestamptz,
  valid_until  date,
  services     jsonb,
  generated_by text default 'ORION'
);

-- 7. weekly_reports ----------------------------------------------------------
create table if not exists public.weekly_reports (
  id                   uuid primary key default gen_random_uuid(),
  created_at           timestamptz default now(),
  week_start           date not null,
  week_end             date not null,
  mrr_total            numeric(10,2),
  mrr_change           numeric(5,2),
  leads_new            integer default 0,
  leads_qualified      integer default 0,
  posts_published      integer default 0,
  posts_avg_engagement numeric(5,2),
  top_post_id          uuid references public.content_calendar(id) on delete set null,
  report_content       text,
  recommendations      text[],
  generated_by         text default 'HERMES'
);
create index if not exists idx_reports_week on public.weekly_reports(week_start desc);

-- 8. settings ----------------------------------------------------------------
create table if not exists public.settings (
  key        text primary key,
  value      jsonb,
  updated_at timestamptz default now()
);

insert into public.settings (key, value) values
  ('luna_auto_generate', 'false'),
  ('luna_posts_per_week', '3'),
  ('orion_daily_limit', '10'),
  ('hermes_report_day', '"monday"'),
  ('target_mrr', '5000'),
  ('agency_name', '"Levo"'),
  ('agency_location', '"Montpellier"')
on conflict (key) do nothing;

-- 9. watched_accounts (VEILLE) ----------------------------------------------
create table if not exists public.watched_accounts (
  id           uuid primary key default gen_random_uuid(),
  platform     text check (platform in ('instagram','linkedin')),
  handle       text not null,
  category     text,
  active       boolean default true,
  last_scraped timestamptz
);

-- ============================================================================
-- Row Level Security : activée partout, aucune policy anon.
-- Le serveur utilise la service-role key (contourne la RLS).
-- ============================================================================
alter table public.clients             enable row level security;
alter table public.leads               enable row level security;
alter table public.content_calendar    enable row level security;
alter table public.content_performance enable row level security;
alter table public.agent_logs          enable row level security;
alter table public.proposals           enable row level security;
alter table public.weekly_reports      enable row level security;
alter table public.settings            enable row level security;
alter table public.watched_accounts    enable row level security;
