-- HERMES — analyse de lead + email personnalisé, en attente de validation humaine.
-- Table séparée de `leads` : ne modifie rien du pipeline ORION existant (stage/status),
-- juste une file de brouillons Hermes rattachés à un lead.

create table if not exists public.hermes_analyses (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  status text not null default 'draft' check (status in ('draft', 'approved', 'rejected', 'sent')),

  -- Contexte utilisé pour l'analyse (traçabilité / debug).
  website_excerpt text,

  -- Sortie Hermes (mêmes noms que les variables Instantly).
  subject_line text,
  opening_line text,
  verified_observation text,
  personalized_question text,
  opportunity_angle text,
  confidence_score int,

  -- Email assemblé (éditable avant validation).
  email_body text,
  edited boolean not null default false,

  reviewed_at timestamptz,
  sent_at timestamptz
);

create index if not exists hermes_analyses_lead_id_idx on public.hermes_analyses(lead_id);
create index if not exists hermes_analyses_status_idx on public.hermes_analyses(status);
