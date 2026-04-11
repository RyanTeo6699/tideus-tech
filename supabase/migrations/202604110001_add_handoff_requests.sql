create table if not exists public.handoff_requests (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases (id) on delete cascade,
  client_user_id uuid not null references auth.users (id) on delete cascade,
  professional_user_id uuid references auth.users (id) on delete set null,
  organization_id uuid references public.organizations (id) on delete set null,
  status text not null default 'requested'
    check (status in ('requested', 'queued', 'archived')),
  client_locale text not null
    check (client_locale in ('zh-CN', 'zh-TW')),
  requested_review_version integer not null,
  requested_readiness_status text not null,
  request_note text,
  export_snapshot jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists handoff_requests_client_user_id_idx
on public.handoff_requests (client_user_id, created_at desc);

create index if not exists handoff_requests_professional_user_id_idx
on public.handoff_requests (professional_user_id, created_at desc);

create index if not exists handoff_requests_organization_id_idx
on public.handoff_requests (organization_id, created_at desc);

create index if not exists handoff_requests_status_idx
on public.handoff_requests (status, created_at desc);

create unique index if not exists handoff_requests_active_case_unique_idx
on public.handoff_requests (case_id)
where status in ('requested', 'queued');

drop trigger if exists handoff_requests_set_updated_at on public.handoff_requests;
create trigger handoff_requests_set_updated_at
before update on public.handoff_requests
for each row
execute function public.handle_updated_at();

alter table public.handoff_requests enable row level security;

drop policy if exists "handoff_requests_select_client_or_professional" on public.handoff_requests;
create policy "handoff_requests_select_client_or_professional"
on public.handoff_requests
for select
to authenticated
using (
  auth.uid() = client_user_id
  or auth.uid() = professional_user_id
  or exists (
    select 1
    from public.professional_profiles
    where public.professional_profiles.user_id = auth.uid()
  )
  or exists (
    select 1
    from public.organization_members
    where public.organization_members.user_id = auth.uid()
      and public.organization_members.status = 'active'
  )
);

drop policy if exists "handoff_requests_insert_client_owned_case" on public.handoff_requests;
create policy "handoff_requests_insert_client_owned_case"
on public.handoff_requests
for insert
to authenticated
with check (
  auth.uid() = client_user_id
  and exists (
    select 1
    from public.cases
    where public.cases.id = public.handoff_requests.case_id
      and public.cases.user_id = auth.uid()
  )
);

alter table public.case_events
drop constraint if exists case_events_event_type_check;

alter table public.case_events
add constraint case_events_event_type_check
check (
  event_type in (
    'case_created',
    'intake_started',
    'intake_completed',
    'materials_updated',
    'material_action_requested',
    'review_generated',
    'review_regenerated',
    'case_resumed',
    'professional_review_requested'
  )
);
