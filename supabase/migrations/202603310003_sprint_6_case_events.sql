create table if not exists public.case_events (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  event_type text not null check (
    event_type in (
      'case_created',
      'intake_started',
      'intake_completed',
      'materials_updated',
      'review_generated',
      'review_regenerated',
      'case_resumed'
    )
  ),
  status text not null check (status in ('draft', 'intake-complete', 'materials-updated', 'reviewed')),
  from_status text check (from_status in ('draft', 'intake-complete', 'materials-updated', 'reviewed')),
  to_status text check (to_status in ('draft', 'intake-complete', 'materials-updated', 'reviewed')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists case_events_case_id_created_at_idx on public.case_events (case_id, created_at desc);
create index if not exists case_events_user_id_created_at_idx on public.case_events (user_id, created_at desc);
create index if not exists case_events_type_created_at_idx on public.case_events (event_type, created_at desc);

alter table public.case_events enable row level security;

drop policy if exists "case_events_select_own" on public.case_events;
create policy "case_events_select_own"
on public.case_events
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "case_events_insert_own" on public.case_events;
create policy "case_events_insert_own"
on public.case_events
for insert
to authenticated
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.cases
    where public.cases.id = public.case_events.case_id
      and public.cases.user_id = auth.uid()
  )
);
