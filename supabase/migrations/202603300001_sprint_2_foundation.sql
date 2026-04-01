create extension if not exists pgcrypto;

create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

create table if not exists public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email text unique,
  full_name text,
  current_status text,
  current_country text,
  target_goal text,
  target_timeline text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.assessments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  current_status text not null,
  goal text not null,
  timeline text not null,
  notes text not null,
  input_snapshot jsonb not null default '{}'::jsonb,
  result_summary text not null,
  result_focus_areas text[] not null default '{}',
  result_next_steps text[] not null default '{}',
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.comparisons (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  option_a text not null,
  option_b text not null,
  priority text not null,
  profile_notes text not null,
  input_snapshot jsonb not null default '{}'::jsonb,
  result_summary text not null,
  result_focus_areas text[] not null default '{}',
  result_next_steps text[] not null default '{}',
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.copilot_threads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  summary text,
  status text not null default 'open',
  last_message_at timestamptz,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.copilot_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.copilot_threads (id) on delete cascade,
  role text not null check (role in ('system', 'user', 'assistant')),
  content text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists assessments_user_id_created_at_idx on public.assessments (user_id, created_at desc);
create index if not exists comparisons_user_id_created_at_idx on public.comparisons (user_id, created_at desc);
create index if not exists copilot_threads_user_id_updated_at_idx on public.copilot_threads (user_id, updated_at desc);
create index if not exists copilot_messages_thread_id_created_at_idx on public.copilot_messages (thread_id, created_at asc);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.handle_updated_at();

drop trigger if exists assessments_set_updated_at on public.assessments;
create trigger assessments_set_updated_at
before update on public.assessments
for each row
execute function public.handle_updated_at();

drop trigger if exists comparisons_set_updated_at on public.comparisons;
create trigger comparisons_set_updated_at
before update on public.comparisons
for each row
execute function public.handle_updated_at();

drop trigger if exists copilot_threads_set_updated_at on public.copilot_threads;
create trigger copilot_threads_set_updated_at
before update on public.copilot_threads
for each row
execute function public.handle_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, email, full_name)
  values (
    new.id,
    new.email,
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), '')
  )
  on conflict (user_id) do update
  set
    email = excluded.email,
    full_name = coalesce(excluded.full_name, public.profiles.full_name);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

insert into public.profiles (user_id, email, full_name)
select
  users.id,
  users.email,
  nullif(trim(coalesce(users.raw_user_meta_data ->> 'full_name', '')), '')
from auth.users as users
on conflict (user_id) do update
set
  email = excluded.email,
  full_name = coalesce(excluded.full_name, public.profiles.full_name);

alter table public.profiles enable row level security;
alter table public.assessments enable row level security;
alter table public.comparisons enable row level security;
alter table public.copilot_threads enable row level security;
alter table public.copilot_messages enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "assessments_select_own" on public.assessments;
create policy "assessments_select_own"
on public.assessments
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "assessments_insert_own" on public.assessments;
create policy "assessments_insert_own"
on public.assessments
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "comparisons_select_own" on public.comparisons;
create policy "comparisons_select_own"
on public.comparisons
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "comparisons_insert_own" on public.comparisons;
create policy "comparisons_insert_own"
on public.comparisons
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "copilot_threads_select_own" on public.copilot_threads;
create policy "copilot_threads_select_own"
on public.copilot_threads
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "copilot_threads_insert_own" on public.copilot_threads;
create policy "copilot_threads_insert_own"
on public.copilot_threads
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "copilot_threads_update_own" on public.copilot_threads;
create policy "copilot_threads_update_own"
on public.copilot_threads
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "copilot_messages_select_own" on public.copilot_messages;
create policy "copilot_messages_select_own"
on public.copilot_messages
for select
to authenticated
using (
  exists (
    select 1
    from public.copilot_threads
    where public.copilot_threads.id = public.copilot_messages.thread_id
      and public.copilot_threads.user_id = auth.uid()
  )
);

drop policy if exists "copilot_messages_insert_own" on public.copilot_messages;
create policy "copilot_messages_insert_own"
on public.copilot_messages
for insert
to authenticated
with check (
  exists (
    select 1
    from public.copilot_threads
    where public.copilot_threads.id = public.copilot_messages.thread_id
      and public.copilot_threads.user_id = auth.uid()
  )
);
