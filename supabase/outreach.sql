-- ============================================================================
-- LEVO — Migration OUTREACH (cold email ORION)
-- Additive : à exécuter APRÈS setup.sql. Ne supprime rien.
-- Pose les bases : niches, campagnes Instantly, events email, réponses (inbox),
-- audits, et enrichit `leads` avec le pipeline réel (stages Robin).
-- ============================================================================

create extension if not exists "pgcrypto";

-- 1) niches : chaque niche testée + son pain point ---------------------------
create table if not exists public.niches (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz default now(),
  name            text not null,
  pain_point      text,          -- le besoin précis qu'on adresse
  value_prop      text,          -- la promesse Levo pour cette niche
  target_criteria text,          -- qui cibler (taille, géo, signaux)
  status          text default 'testing' check (status in ('testing','active','paused','archived'))
);

-- 2) campaigns : lie une niche à une campagne Instantly ----------------------
create table if not exists public.campaigns (
  id                   uuid primary key default gen_random_uuid(),
  created_at           timestamptz default now(),
  niche_id             uuid references public.niches(id) on delete set null,
  name                 text not null,
  instantly_campaign_id text,     -- l'ID de campagne côté Instantly
  inbox_email          text,      -- quelle inbox d'envoi (contact@… / agence)
  daily_limit          integer default 250,
  status               text default 'draft' check (status in ('draft','active','paused'))
);

-- 3) leads : enrichissement (pipeline réel + rattachement niche/campagne) -----
alter table public.leads add column if not exists niche_id uuid references public.niches(id) on delete set null;
alter table public.leads add column if not exists campaign_id uuid references public.campaigns(id) on delete set null;
alter table public.leads add column if not exists stage text default 'new'
  check (stage in ('new','contacted','opened','replied','audit_received','loom_sent','follow_up','won','lost'));
alter table public.leads add column if not exists instantly_lead_id text;
alter table public.leads add column if not exists first_name text;
alter table public.leads add column if not exists opens integer default 0;
alter table public.leads add column if not exists last_event_at timestamptz;
create index if not exists idx_leads_stage on public.leads(stage);
create index if not exists idx_leads_niche on public.leads(niche_id);

-- 4) email_events : chaque event Instantly (→ contactés, taux d'ouverture) ----
create table if not exists public.email_events (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz default now(),
  lead_id     uuid references public.leads(id) on delete cascade,
  campaign_id uuid references public.campaigns(id) on delete set null,
  type        text not null check (type in ('sent','opened','clicked','replied','bounced','unsubscribed')),
  occurred_at timestamptz default now(),
  meta        jsonb
);
create index if not exists idx_events_lead on public.email_events(lead_id);
create index if not exists idx_events_type on public.email_events(type);

-- 5) replies : les réponses reçues (→ inbox type Gmail + notifs) --------------
create table if not exists public.replies (
  id                  uuid primary key default gen_random_uuid(),
  created_at          timestamptz default now(),
  lead_id             uuid references public.leads(id) on delete cascade,
  from_email          text,
  to_inbox            text,
  subject             text,
  body                text,
  received_at         timestamptz default now(),
  is_read             boolean default false,
  instantly_message_id text
);
create index if not exists idx_replies_read on public.replies(is_read);
create index if not exists idx_replies_received on public.replies(received_at desc);

-- 6) audits : le questionnaire d'audit rempli (→ base de la maquette) ---------
create table if not exists public.audits (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz default now(),
  lead_id      uuid references public.leads(id) on delete set null,
  niche_id     uuid references public.niches(id) on delete set null,
  status       text default 'invited' check (status in ('invited','started','completed')),
  answers      jsonb,
  submitted_at timestamptz,
  loom_url     text,
  mockup_notes text
);
create index if not exists idx_audits_status on public.audits(status);

-- RLS : activée partout (accès serveur via service-role) ---------------------
alter table public.niches       enable row level security;
alter table public.campaigns    enable row level security;
alter table public.email_events enable row level security;
alter table public.replies      enable row level security;
alter table public.audits       enable row level security;
