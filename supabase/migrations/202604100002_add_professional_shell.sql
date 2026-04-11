create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  status text not null default 'setup'
    check (status in ('setup', 'active', 'paused', 'archived')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.professional_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  organization_id uuid references public.organizations (id) on delete set null,
  display_name text,
  professional_title text,
  service_regions text[] not null default '{}',
  intake_status text not null default 'pending'
    check (intake_status in ('pending', 'active', 'paused')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'member'
    check (role in ('owner', 'admin', 'reviewer', 'member')),
  status text not null default 'active'
    check (status in ('invited', 'active', 'paused')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  unique (organization_id, user_id)
);

create index if not exists organizations_slug_idx on public.organizations (slug);
create index if not exists professional_profiles_organization_id_idx on public.professional_profiles (organization_id);
create index if not exists organization_members_user_id_idx on public.organization_members (user_id, created_at desc);
create index if not exists organization_members_organization_id_idx on public.organization_members (organization_id, created_at desc);

drop trigger if exists organizations_set_updated_at on public.organizations;
create trigger organizations_set_updated_at
before update on public.organizations
for each row
execute function public.handle_updated_at();

drop trigger if exists professional_profiles_set_updated_at on public.professional_profiles;
create trigger professional_profiles_set_updated_at
before update on public.professional_profiles
for each row
execute function public.handle_updated_at();

drop trigger if exists organization_members_set_updated_at on public.organization_members;
create trigger organization_members_set_updated_at
before update on public.organization_members
for each row
execute function public.handle_updated_at();

alter table public.organizations enable row level security;
alter table public.professional_profiles enable row level security;
alter table public.organization_members enable row level security;

drop policy if exists "professional_profiles_select_own" on public.professional_profiles;
create policy "professional_profiles_select_own"
on public.professional_profiles
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "professional_profiles_insert_own" on public.professional_profiles;
create policy "professional_profiles_insert_own"
on public.professional_profiles
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "professional_profiles_update_own" on public.professional_profiles;
create policy "professional_profiles_update_own"
on public.professional_profiles
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "organization_members_select_own" on public.organization_members;
create policy "organization_members_select_own"
on public.organization_members
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "organizations_select_member_orgs" on public.organizations;
create policy "organizations_select_member_orgs"
on public.organizations
for select
to authenticated
using (
  exists (
    select 1
    from public.organization_members
    where public.organization_members.organization_id = public.organizations.id
      and public.organization_members.user_id = auth.uid()
  )
  or exists (
    select 1
    from public.professional_profiles
    where public.professional_profiles.organization_id = public.organizations.id
      and public.professional_profiles.user_id = auth.uid()
  )
);
