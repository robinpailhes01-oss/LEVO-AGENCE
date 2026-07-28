-- Distingue les campagnes envoyées via Instantly (existant) de celles
-- envoyées directement via Resend (nouvelle campagne hébergement/établissements).
alter table public.campaigns add column if not exists channel text not null default 'instantly'
  check (channel in ('instantly', 'resend'));
