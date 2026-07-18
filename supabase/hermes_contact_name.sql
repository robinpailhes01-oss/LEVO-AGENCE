-- Ajoute le prénom du contact/dirigeant trouvé sur le site (si explicitement écrit).
alter table public.hermes_analyses add column if not exists contact_first_name text;
