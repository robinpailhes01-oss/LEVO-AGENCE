-- Table des audits PROPRE au CRM Levo, isolée du site vitrine.
-- (Le site vitrine a repris le nom `audits` avec un autre schéma ; on ne le
--  partage plus. Le CRM lit/écrit uniquement `lead_audits`.)
create table if not exists public.lead_audits (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz default now(),
  lead_id      uuid references public.leads(id) on delete cascade,
  niche_id     uuid references public.niches(id) on delete set null,
  status       text default 'completed' check (status in ('invited','started','completed')),
  answers      jsonb,
  submitted_at timestamptz,
  loom_url     text,
  mockup_notes text
);
alter table public.lead_audits enable row level security;
create index if not exists idx_lead_audits_lead on public.lead_audits(lead_id);
