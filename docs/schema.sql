-- ============================================================================
-- LEVO — Supabase schema (Phase 1)
-- 10 tables + Row Level Security. Run in the Supabase SQL editor.
-- Project: yzaypsoonsldhmujuqjw
--
-- Access model: the dashboard talks to Supabase exclusively through the
-- service-role key on the server (RLS is bypassed by the service role).
-- RLS is enabled with NO public policies so the anon key cannot read/write.
-- This keeps the data private while the app stays behind its own auth.
-- ============================================================================

create extension if not exists "pgcrypto";

-- Reusable updated_at trigger -------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- 1. clients ------------------------------------------------------------------
create table if not exists public.clients (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  company          text,
  email            text,
  phone            text,
  niche            text,
  instagram_handle text,
  status           text not null default 'active'
                     check (status in ('active','paused','churned')),
  monthly_fee      numeric not null default 0,
  services         text[] not null default '{}',
  notes            text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create trigger trg_clients_updated before update on public.clients
  for each row execute function public.set_updated_at();

-- 2. leads --------------------------------------------------------------------
create table if not exists public.leads (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  company          text,
  email            text,
  phone            text,
  instagram_handle text,
  website          text,
  niche            text,
  location         text,
  score            integer not null default 0 check (score between 0 and 100),
  status           text not null default 'new'
                     check (status in ('new','enriched','contacted','replied','qualified','won','lost')),
  source           text,
  enrichment       jsonb,
  notes            text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index if not exists idx_leads_status on public.leads(status);
create index if not exists idx_leads_score on public.leads(score desc);
create trigger trg_leads_updated before update on public.leads
  for each row execute function public.set_updated_at();

-- 3. content_calendar ---------------------------------------------------------
create table if not exists public.content_calendar (
  id            uuid primary key default gen_random_uuid(),
  client_id     uuid references public.clients(id) on delete set null,
  title         text not null,
  hook          text,
  topic         text,
  pillar        text,
  format        text not null default 'carousel'
                  check (format in ('carousel','reel','single','story')),
  status        text not null default 'idea'
                  check (status in ('idea','approved','drafted','validated','published')),
  caption       text,
  hashtags      text[] not null default '{}',
  scheduled_for timestamptz,
  published_at  timestamptz,
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists idx_content_status on public.content_calendar(status);
create index if not exists idx_content_client on public.content_calendar(client_id);
create trigger trg_content_updated before update on public.content_calendar
  for each row execute function public.set_updated_at();

-- 4. content_slides -----------------------------------------------------------
create table if not exists public.content_slides (
  id           uuid primary key default gen_random_uuid(),
  content_id   uuid not null references public.content_calendar(id) on delete cascade,
  position     integer not null default 0,
  headline     text,
  body         text,
  image_prompt text,
  image_url    text,
  notes        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists idx_slides_content on public.content_slides(content_id, position);
create trigger trg_slides_updated before update on public.content_slides
  for each row execute function public.set_updated_at();

-- 5. content_performance ------------------------------------------------------
create table if not exists public.content_performance (
  id              uuid primary key default gen_random_uuid(),
  content_id      uuid not null references public.content_calendar(id) on delete cascade,
  reach           integer not null default 0,
  impressions     integer not null default 0,
  likes           integer not null default 0,
  comments        integer not null default 0,
  shares          integer not null default 0,
  saves           integer not null default 0,
  engagement_rate numeric not null default 0,
  measured_at     timestamptz not null default now(),
  created_at      timestamptz not null default now()
);
create index if not exists idx_perf_content on public.content_performance(content_id);

-- 6. agent_logs ---------------------------------------------------------------
create table if not exists public.agent_logs (
  id          uuid primary key default gen_random_uuid(),
  agent       text not null
                check (agent in ('luna','orion','hermes','veille','system')),
  action      text not null,
  summary     text,
  entity_type text,
  entity_id   text,
  status      text not null default 'success'
                check (status in ('success','error','info')),
  metadata    jsonb,
  created_at  timestamptz not null default now()
);
create index if not exists idx_logs_created on public.agent_logs(created_at desc);
create index if not exists idx_logs_agent on public.agent_logs(agent);

-- 7. proposals ----------------------------------------------------------------
create table if not exists public.proposals (
  id          uuid primary key default gen_random_uuid(),
  lead_id     uuid references public.leads(id) on delete set null,
  title       text not null,
  status      text not null default 'draft'
                check (status in ('draft','sent','accepted','rejected')),
  amount      numeric not null default 0,
  currency    text not null default 'EUR',
  content     text,
  sent_at     timestamptz,
  valid_until timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create trigger trg_proposals_updated before update on public.proposals
  for each row execute function public.set_updated_at();

-- 8. weekly_reports -----------------------------------------------------------
create table if not exists public.weekly_reports (
  id         uuid primary key default gen_random_uuid(),
  week_start date not null,
  week_end   date not null,
  summary    text,
  metrics    jsonb,
  content_md text,
  sent_at    timestamptz,
  email_to   text,
  created_at timestamptz not null default now()
);
create index if not exists idx_reports_week on public.weekly_reports(week_start desc);

-- 9. settings -----------------------------------------------------------------
create table if not exists public.settings (
  id          uuid primary key default gen_random_uuid(),
  key         text not null unique,
  value       jsonb,
  description text,
  updated_at  timestamptz not null default now()
);
create trigger trg_settings_updated before update on public.settings
  for each row execute function public.set_updated_at();

-- 10. watched_accounts --------------------------------------------------------
create table if not exists public.watched_accounts (
  id              uuid primary key default gen_random_uuid(),
  platform        text not null default 'instagram',
  handle          text not null,
  display_name    text,
  category        text,
  followers       integer not null default 0,
  last_checked_at timestamptz,
  notes           text,
  active          boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create trigger trg_watched_updated before update on public.watched_accounts
  for each row execute function public.set_updated_at();

-- ============================================================================
-- Row Level Security — enabled on every table, no anon policies.
-- The server uses the service-role key which bypasses RLS.
-- ============================================================================
alter table public.clients             enable row level security;
alter table public.leads               enable row level security;
alter table public.content_calendar    enable row level security;
alter table public.content_slides      enable row level security;
alter table public.content_performance enable row level security;
alter table public.agent_logs          enable row level security;
alter table public.proposals           enable row level security;
alter table public.weekly_reports      enable row level security;
alter table public.settings            enable row level security;
alter table public.watched_accounts    enable row level security;

-- Force RLS even for table owners (defence in depth).
alter table public.clients             force row level security;
alter table public.leads               force row level security;
alter table public.content_calendar    force row level security;
alter table public.content_slides      force row level security;
alter table public.content_performance force row level security;
alter table public.agent_logs          force row level security;
alter table public.proposals           force row level security;
alter table public.weekly_reports      force row level security;
alter table public.settings            force row level security;
alter table public.watched_accounts    force row level security;

-- ============================================================================
-- Seed: baseline settings rows.
-- ============================================================================
insert into public.settings (key, value, description) values
  ('agency', '{"name":"Levo","city":"Montpellier"}', 'Identité agence'),
  ('luna',   '{"posts_per_week":3}', 'Cadence de publication LUNA'),
  ('orion',  '{"weekly_lead_target":25}', 'Objectif leads hebdo ORION')
on conflict (key) do nothing;
