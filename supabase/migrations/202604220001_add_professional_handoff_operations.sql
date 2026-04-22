alter table public.handoff_requests
  add column if not exists opened_at timestamptz,
  add column if not exists in_review_at timestamptz,
  add column if not exists closed_at timestamptz,
  add column if not exists status_updated_at timestamptz,
  add column if not exists status_updated_by uuid references auth.users (id) on delete set null,
  add column if not exists internal_notes text;

update public.handoff_requests
set
  status = case
    when status in ('requested', 'queued') then 'new'
    when status = 'archived' then 'closed'
    else status
  end,
  status_updated_at = coalesce(status_updated_at, updated_at, created_at);

alter table public.handoff_requests
drop constraint if exists handoff_requests_status_check;

alter table public.handoff_requests
add constraint handoff_requests_status_check
check (status in ('new', 'opened', 'in_review', 'closed'));

alter table public.handoff_requests
alter column status set default 'new';

drop index if exists handoff_requests_active_case_unique_idx;
create unique index if not exists handoff_requests_active_case_unique_idx
on public.handoff_requests (case_id)
where status in ('new', 'opened', 'in_review');

create index if not exists handoff_requests_status_updated_at_idx
on public.handoff_requests (status, status_updated_at desc);

create index if not exists handoff_requests_status_updated_by_idx
on public.handoff_requests (status_updated_by, status_updated_at desc);

drop policy if exists "handoff_requests_select_client_or_professional" on public.handoff_requests;
create policy "handoff_requests_select_client_or_professional"
on public.handoff_requests
for select
to authenticated
using (
  auth.uid() = client_user_id
  or auth.uid() = professional_user_id
  or (
    professional_user_id is null
    and organization_id is null
    and (
      exists (
        select 1
        from public.professional_profiles
        where public.professional_profiles.user_id = auth.uid()
          and public.professional_profiles.intake_status = 'active'
      )
      or exists (
        select 1
        from public.organization_members
        where public.organization_members.user_id = auth.uid()
          and public.organization_members.status = 'active'
      )
    )
  )
  or exists (
    select 1
    from public.professional_profiles
    where public.professional_profiles.user_id = auth.uid()
      and public.professional_profiles.intake_status = 'active'
      and public.professional_profiles.organization_id = public.handoff_requests.organization_id
  )
  or exists (
    select 1
    from public.organization_members
    where public.organization_members.user_id = auth.uid()
      and public.organization_members.status = 'active'
      and public.organization_members.organization_id = public.handoff_requests.organization_id
  )
);

drop policy if exists "handoff_requests_update_professional_operations" on public.handoff_requests;
create policy "handoff_requests_update_professional_operations"
on public.handoff_requests
for update
to authenticated
using (
  auth.uid() = professional_user_id
  or (
    professional_user_id is null
    and organization_id is null
    and (
      exists (
        select 1
        from public.professional_profiles
        where public.professional_profiles.user_id = auth.uid()
          and public.professional_profiles.intake_status = 'active'
      )
      or exists (
        select 1
        from public.organization_members
        where public.organization_members.user_id = auth.uid()
          and public.organization_members.status = 'active'
      )
    )
  )
  or exists (
    select 1
    from public.professional_profiles
    where public.professional_profiles.user_id = auth.uid()
      and public.professional_profiles.intake_status = 'active'
      and public.professional_profiles.organization_id = public.handoff_requests.organization_id
  )
  or exists (
    select 1
    from public.organization_members
    where public.organization_members.user_id = auth.uid()
      and public.organization_members.status = 'active'
      and public.organization_members.organization_id = public.handoff_requests.organization_id
  )
)
with check (
  auth.uid() = professional_user_id
  or (
    professional_user_id is null
    and organization_id is null
    and (
      exists (
        select 1
        from public.professional_profiles
        where public.professional_profiles.user_id = auth.uid()
          and public.professional_profiles.intake_status = 'active'
      )
      or exists (
        select 1
        from public.organization_members
        where public.organization_members.user_id = auth.uid()
          and public.organization_members.status = 'active'
      )
    )
  )
  or exists (
    select 1
    from public.professional_profiles
    where public.professional_profiles.user_id = auth.uid()
      and public.professional_profiles.intake_status = 'active'
      and public.professional_profiles.organization_id = public.handoff_requests.organization_id
  )
  or exists (
    select 1
    from public.organization_members
    where public.organization_members.user_id = auth.uid()
      and public.organization_members.status = 'active'
      and public.organization_members.organization_id = public.handoff_requests.organization_id
  )
);
