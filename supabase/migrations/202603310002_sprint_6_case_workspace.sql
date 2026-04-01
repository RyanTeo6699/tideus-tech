create table if not exists public.cases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  use_case_slug text not null,
  title text not null,
  status text not null default 'draft' check (status in ('draft', 'intake-complete', 'materials-updated', 'reviewed')),
  intake_answers jsonb not null default '{}'::jsonb,
  intake_completed_at timestamptz,
  latest_review_version integer,
  latest_review_summary text,
  latest_readiness_status text,
  latest_timeline_note text,
  latest_reviewed_at timestamptz,
  checklist_state jsonb not null default '[]'::jsonb,
  status_history jsonb not null default '[]'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.case_documents (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases (id) on delete cascade,
  document_key text not null,
  label text not null,
  description text not null,
  position integer not null default 0,
  required boolean not null default true,
  status text not null default 'missing' check (status in ('missing', 'collecting', 'needs-refresh', 'ready', 'not-applicable')),
  material_reference text,
  notes text,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  unique (case_id, document_key)
);

create table if not exists public.case_review_versions (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases (id) on delete cascade,
  version_number integer not null,
  readiness_status text not null,
  readiness_summary text not null,
  result_summary text not null,
  timeline_note text,
  checklist_items jsonb not null default '[]'::jsonb,
  missing_items text[] not null default '{}',
  risk_flags jsonb not null default '[]'::jsonb,
  next_steps text[] not null default '{}',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc'::text, now()),
  unique (case_id, version_number)
);

create index if not exists cases_user_id_updated_at_idx on public.cases (user_id, updated_at desc);
create index if not exists case_documents_case_id_position_idx on public.case_documents (case_id, position asc);
create index if not exists case_review_versions_case_id_version_idx on public.case_review_versions (case_id, version_number desc);

drop trigger if exists cases_set_updated_at on public.cases;
create trigger cases_set_updated_at
before update on public.cases
for each row
execute function public.handle_updated_at();

drop trigger if exists case_documents_set_updated_at on public.case_documents;
create trigger case_documents_set_updated_at
before update on public.case_documents
for each row
execute function public.handle_updated_at();

alter table public.cases enable row level security;
alter table public.case_documents enable row level security;
alter table public.case_review_versions enable row level security;

drop policy if exists "cases_select_own" on public.cases;
create policy "cases_select_own"
on public.cases
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "cases_insert_own" on public.cases;
create policy "cases_insert_own"
on public.cases
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "cases_update_own" on public.cases;
create policy "cases_update_own"
on public.cases
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "case_documents_select_own" on public.case_documents;
create policy "case_documents_select_own"
on public.case_documents
for select
to authenticated
using (
  exists (
    select 1
    from public.cases
    where public.cases.id = public.case_documents.case_id
      and public.cases.user_id = auth.uid()
  )
);

drop policy if exists "case_documents_insert_own" on public.case_documents;
create policy "case_documents_insert_own"
on public.case_documents
for insert
to authenticated
with check (
  exists (
    select 1
    from public.cases
    where public.cases.id = public.case_documents.case_id
      and public.cases.user_id = auth.uid()
  )
);

drop policy if exists "case_documents_update_own" on public.case_documents;
create policy "case_documents_update_own"
on public.case_documents
for update
to authenticated
using (
  exists (
    select 1
    from public.cases
    where public.cases.id = public.case_documents.case_id
      and public.cases.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.cases
    where public.cases.id = public.case_documents.case_id
      and public.cases.user_id = auth.uid()
  )
);

drop policy if exists "case_review_versions_select_own" on public.case_review_versions;
create policy "case_review_versions_select_own"
on public.case_review_versions
for select
to authenticated
using (
  exists (
    select 1
    from public.cases
    where public.cases.id = public.case_review_versions.case_id
      and public.cases.user_id = auth.uid()
  )
);

drop policy if exists "case_review_versions_insert_own" on public.case_review_versions;
create policy "case_review_versions_insert_own"
on public.case_review_versions
for insert
to authenticated
with check (
  exists (
    select 1
    from public.cases
    where public.cases.id = public.case_review_versions.case_id
      and public.cases.user_id = auth.uid()
  )
);
