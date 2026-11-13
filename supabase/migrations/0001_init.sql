-- 0001_init: pinturas y recetas por usuario, con RLS.
-- Ejecutar completo en Supabase → SQL Editor.

create table public.paints (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name        text not null check (char_length(btrim(name)) between 1 and 40),
  hex         text not null check (hex ~ '^#[0-9A-Fa-f]{6}$'),
  created_at  timestamptz not null default now()
);

create table public.recipes (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name        text not null check (char_length(btrim(name)) between 1 and 60),
  target_hex  text not null check (target_hex ~ '^#[0-9A-Fa-f]{6}$'),
  result_hex  text not null check (result_hex ~ '^#[0-9A-Fa-f]{6}$'),
  -- copia de la receta: [{ "name": "rojo", "hex": "#E63946", "parts": 2 }, ...]
  mix         jsonb not null check (jsonb_typeof(mix) = 'array' and jsonb_array_length(mix) between 1 and 12),
  created_at  timestamptz not null default now()
);

create index paints_owner_created_idx  on public.paints  (owner_id, created_at desc);
create index recipes_owner_created_idx on public.recipes (owner_id, created_at desc);

alter table public.paints  enable row level security;
alter table public.recipes enable row level security;

-- Sin sesión (rol anon) no se accede a nada.
revoke all on public.paints  from anon;
revoke all on public.recipes from anon;

create policy "paints_select_own" on public.paints for select to authenticated
  using (owner_id = (select auth.uid()));
create policy "paints_insert_own" on public.paints for insert to authenticated
  with check (owner_id = (select auth.uid()));
create policy "paints_update_own" on public.paints for update to authenticated
  using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy "paints_delete_own" on public.paints for delete to authenticated
  using (owner_id = (select auth.uid()));

create policy "recipes_select_own" on public.recipes for select to authenticated
  using (owner_id = (select auth.uid()));
create policy "recipes_insert_own" on public.recipes for insert to authenticated
  with check (owner_id = (select auth.uid()));
create policy "recipes_update_own" on public.recipes for update to authenticated
  using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy "recipes_delete_own" on public.recipes for delete to authenticated
  using (owner_id = (select auth.uid()));
