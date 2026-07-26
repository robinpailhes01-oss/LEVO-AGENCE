-- LUNA — bibliothèque de références visuelles permanentes (mémoire de style).
-- Distincte de settings.luna_learnings (retours texte) : ici, une image + la
-- raison pour laquelle elle compte, injectées automatiquement au début de
-- chaque NOUVELLE conversation de brief pour que LUNA les garde en tête.

create table if not exists public.luna_references (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  note text not null,
  image_data text not null
);

create index if not exists luna_references_created_at_idx on public.luna_references(created_at desc);
