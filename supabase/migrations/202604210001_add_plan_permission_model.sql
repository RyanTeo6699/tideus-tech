alter table public.profiles
  add column if not exists consumer_plan_tier text not null default 'free'
    check (consumer_plan_tier in ('free', 'pro')),
  add column if not exists consumer_plan_status text not null default 'active'
    check (consumer_plan_status in ('active', 'paused')),
  add column if not exists consumer_plan_source text not null default 'default-free',
  add column if not exists consumer_plan_activated_at timestamptz;

update public.profiles
set
  consumer_plan_tier = case
    when metadata #>> '{platformAccess,consumerPlan,tier}' = 'pro' then 'pro'
    else consumer_plan_tier
  end,
  consumer_plan_source = coalesce(
    nullif(metadata #>> '{platformAccess,consumerPlan,source}', ''),
    consumer_plan_source,
    'default-free'
  ),
  consumer_plan_activated_at = case
    when consumer_plan_activated_at is not null then consumer_plan_activated_at
    when metadata #>> '{platformAccess,consumerPlan,tier}' = 'pro' then timezone('utc'::text, now())
    else consumer_plan_activated_at
  end;

create index if not exists profiles_consumer_plan_tier_idx
on public.profiles (consumer_plan_tier);

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
      and public.professional_profiles.intake_status = 'active'
  )
  or exists (
    select 1
    from public.organization_members
    where public.organization_members.user_id = auth.uid()
      and public.organization_members.status = 'active'
  )
);
