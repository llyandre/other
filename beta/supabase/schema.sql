-- Wikaru Supabase schema
-- Safe to run repeatedly from Supabase Dashboard > SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.wikaru_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text,
  created_at timestamptz not null default now()
);

alter table public.wikaru_admins enable row level security;
revoke all on table public.wikaru_admins from public, anon, authenticated;

create or replace function public.is_wikaru_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.wikaru_admins
    where user_id = auth.uid()
  );
$$;

revoke all on function public.is_wikaru_admin() from public;
grant execute on function public.is_wikaru_admin() to authenticated;

create table if not exists public.wikaru_quiz_results (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  local_id text not null check (char_length(local_id) between 1 and 180),
  username text not null check (char_length(username) between 1 and 100),
  group_name text not null default '-' check (char_length(group_name) between 1 and 100),
  participant_key text generated always as (
    lower(btrim(group_name)) || '::' || lower(btrim(username))
  ) stored,
  selected_language text not null default 'id' check (selected_language in ('id', 'ja')),
  selected_book text,
  selected_material_category text,
  selected_chapter text,
  quiz_direction text,
  shuffle_mode text,
  fiction_filter boolean,
  selected_chapter_filters jsonb not null default '[]'::jsonb,
  selected_section_filters jsonb not null default '[]'::jsonb,
  selected_type_filters jsonb not null default '[]'::jsonb,
  total_questions integer not null default 0 check (total_questions >= 0),
  correct_count integer not null default 0 check (correct_count >= 0),
  wrong_count integer not null default 0 check (wrong_count >= 0),
  score_percent numeric(5,2) not null default 0 check (score_percent between 0 and 100),
  kkm_status text,
  total_duration integer not null default 0 check (total_duration >= 0),
  finished_at timestamptz not null default now(),
  details jsonb not null default '[]'::jsonb,
  learning_context jsonb,
  payload jsonb not null default '{}'::jsonb,
  schema_version integer not null default 3,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint wikaru_quiz_results_owner_local_unique unique (owner_id, local_id)
);

create index if not exists wikaru_quiz_results_owner_finished_idx
  on public.wikaru_quiz_results (owner_id, finished_at desc);

create index if not exists wikaru_quiz_results_participant_finished_idx
  on public.wikaru_quiz_results (participant_key, finished_at desc);

create or replace function public.set_wikaru_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists wikaru_quiz_results_updated_at on public.wikaru_quiz_results;
create trigger wikaru_quiz_results_updated_at
before update on public.wikaru_quiz_results
for each row execute function public.set_wikaru_updated_at();

alter table public.wikaru_quiz_results enable row level security;
alter table public.wikaru_quiz_results force row level security;

drop policy if exists "wikaru_select_own_results" on public.wikaru_quiz_results;
create policy "wikaru_select_own_results"
on public.wikaru_quiz_results for select
to authenticated
using (owner_id = auth.uid());

drop policy if exists "wikaru_insert_own_results" on public.wikaru_quiz_results;
create policy "wikaru_insert_own_results"
on public.wikaru_quiz_results for insert
to authenticated
with check (owner_id = auth.uid());

drop policy if exists "wikaru_update_own_results" on public.wikaru_quiz_results;
create policy "wikaru_update_own_results"
on public.wikaru_quiz_results for update
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

drop policy if exists "wikaru_delete_own_results" on public.wikaru_quiz_results;
create policy "wikaru_delete_own_results"
on public.wikaru_quiz_results for delete
to authenticated
using (owner_id = auth.uid());

drop policy if exists "wikaru_admin_manage_all_results" on public.wikaru_quiz_results;
create policy "wikaru_admin_manage_all_results"
on public.wikaru_quiz_results for all
to authenticated
using (public.is_wikaru_admin())
with check (public.is_wikaru_admin());

revoke all on table public.wikaru_quiz_results from public, anon;
grant select, insert, update, delete on table public.wikaru_quiz_results to authenticated;

