-- Suivi de l'export CSV vers Instantly : un lead exporté ne ressort plus
-- dans les téléchargements suivants (sauf export "tout" explicite).
alter table public.leads add column if not exists exported_at timestamptz;
create index if not exists idx_leads_exported_at on public.leads(exported_at);
