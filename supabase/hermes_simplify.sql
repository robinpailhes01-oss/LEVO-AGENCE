-- Simplification du gabarit Hermes (accroche / pitch toujours présent /
-- question sur les tâches cachées) : nouvelles colonnes, les anciennes
-- (opening_line, verified_observation, casual_pitch, personalized_question,
-- opportunity_angle) restent en base mais ne sont plus alimentées.
alter table public.hermes_analyses add column if not exists hook text;
alter table public.hermes_analyses add column if not exists pitch text;
alter table public.hermes_analyses add column if not exists closing_question text;
