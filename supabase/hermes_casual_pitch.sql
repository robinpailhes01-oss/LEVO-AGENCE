-- Remplace le paragraphe marketing statique par une phrase générée, courte
-- et décontractée sur ce que fait Luma (jamais la même formulation deux fois).
alter table public.hermes_analyses add column if not exists casual_pitch text;
