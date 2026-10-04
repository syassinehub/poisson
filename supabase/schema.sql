-- Schéma Supabase pour le forum et les commentaires.
-- À exécuter dans Supabase > SQL Editor.
--
-- Modèle de sécurité (v1, sans comptes utilisateurs) :
--   - tout le monde peut lire et publier (avec la clé "anon" publique) ;
--   - personne ne peut modifier ni supprimer depuis le site ;
--   - la modération se fait depuis le tableau de bord Supabase (Table Editor).
-- Les contraintes CHECK limitent la taille des messages côté base, même si quelqu'un
-- contourne le formulaire.

create table if not exists public.topics (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  author      text not null check (char_length(trim(author)) between 1 and 40),
  category    text not null check (category in ('presentations','crevettes','poissons','plantes','problemes','echanges')),
  title       text not null check (char_length(trim(title)) between 1 and 120),
  body        text not null check (char_length(trim(body)) between 1 and 4000)
);

create table if not exists public.replies (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  topic_id    bigint not null references public.topics(id) on delete cascade,
  author      text not null check (char_length(trim(author)) between 1 and 40),
  body        text not null check (char_length(trim(body)) between 1 and 4000)
);

create table if not exists public.comments (
  id            bigint generated always as identity primary key,
  created_at    timestamptz not null default now(),
  article_slug  text not null check (article_slug ~ '^[a-z0-9-]{1,100}$'),
  author        text not null check (char_length(trim(author)) between 1 and 40),
  body          text not null check (char_length(trim(body)) between 1 and 4000)
);

create index if not exists replies_topic_idx on public.replies (topic_id, created_at);
create index if not exists comments_slug_idx on public.comments (article_slug, created_at);
create index if not exists topics_created_idx on public.topics (created_at desc);

-- Row Level Security : lecture + insertion publiques, rien d'autre.
alter table public.topics   enable row level security;
alter table public.replies  enable row level security;
alter table public.comments enable row level security;

create policy "lecture publique"  on public.topics   for select to anon, authenticated using (true);
create policy "insertion publique" on public.topics  for insert to anon, authenticated with check (true);
create policy "lecture publique"  on public.replies  for select to anon, authenticated using (true);
create policy "insertion publique" on public.replies for insert to anon, authenticated with check (true);
create policy "lecture publique"  on public.comments for select to anon, authenticated using (true);
create policy "insertion publique" on public.comments for insert to anon, authenticated with check (true);

-- Sujet d'accueil
insert into public.topics (author, category, title, body)
values ('Équipe du blog', 'presentations', 'Bienvenue dans la communauté !',
        'Présentez-vous ici : votre ville, vos bacs, vos espèces préférées. Photos et questions bienvenues.');
