-- LUNA native : historique de chat persisté par post + clé d'auto-amélioration.
alter table public.content_calendar add column if not exists chat_history jsonb default '[]';

insert into public.settings (key, value)
values ('luna_learnings', '""')
on conflict (key) do nothing;
