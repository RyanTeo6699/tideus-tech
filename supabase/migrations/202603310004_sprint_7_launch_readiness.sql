alter table public.case_documents
  add column if not exists storage_bucket text,
  add column if not exists storage_path text,
  add column if not exists file_name text,
  add column if not exists file_size_bytes bigint,
  add column if not exists mime_type text,
  add column if not exists uploaded_at timestamptz;

create table if not exists public.lead_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  email text not null,
  use_case_interest text not null check (use_case_interest in ('visitor-record', 'study-permit-extension', 'both', 'not-sure')),
  current_stage text not null check (current_stage in ('researching', 'organizing-now', 'review-soon', 'team-evaluating')),
  wants_demo boolean not null default false,
  wants_early_access boolean not null default false,
  note text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc'::text, now()),
  check (wants_demo or wants_early_access)
);

create table if not exists public.app_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  case_id uuid references public.cases (id) on delete set null,
  lead_request_id uuid references public.lead_requests (id) on delete set null,
  event_type text not null check (
    event_type in (
      'landing_cta_clicked',
      'start_case_selected',
      'book_demo_clicked',
      'early_access_requested',
      'export_clicked'
    )
  ),
  path text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists lead_requests_created_at_idx on public.lead_requests (created_at desc);
create index if not exists lead_requests_email_created_at_idx on public.lead_requests (email, created_at desc);
create index if not exists app_events_event_type_created_at_idx on public.app_events (event_type, created_at desc);
create index if not exists app_events_case_id_created_at_idx on public.app_events (case_id, created_at desc);

alter table public.lead_requests enable row level security;
alter table public.app_events enable row level security;

drop policy if exists "lead_requests_insert_public" on public.lead_requests;
create policy "lead_requests_insert_public"
on public.lead_requests
for insert
to anon, authenticated
with check (user_id is null or auth.uid() = user_id);

drop policy if exists "lead_requests_select_own" on public.lead_requests;
create policy "lead_requests_select_own"
on public.lead_requests
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "app_events_insert_public" on public.app_events;
create policy "app_events_insert_public"
on public.app_events
for insert
to anon, authenticated
with check (user_id is null or auth.uid() = user_id);

drop policy if exists "app_events_select_own" on public.app_events;
create policy "app_events_select_own"
on public.app_events
for select
to authenticated
using (user_id is not null and auth.uid() = user_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'case-materials',
  'case-materials',
  false,
  10485760,
  array['application/pdf', 'image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "case_materials_select_own" on storage.objects;
create policy "case_materials_select_own"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'case-materials'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "case_materials_insert_own" on storage.objects;
create policy "case_materials_insert_own"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'case-materials'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "case_materials_update_own" on storage.objects;
create policy "case_materials_update_own"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'case-materials'
  and auth.uid()::text = (storage.foldername(name))[1]
)
with check (
  bucket_id = 'case-materials'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "case_materials_delete_own" on storage.objects;
create policy "case_materials_delete_own"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'case-materials'
  and auth.uid()::text = (storage.foldername(name))[1]
);
