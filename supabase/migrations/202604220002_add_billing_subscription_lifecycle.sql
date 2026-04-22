alter table public.profiles
drop constraint if exists profiles_consumer_plan_status_check;

alter table public.profiles
add constraint profiles_consumer_plan_status_check
check (consumer_plan_status in ('active', 'inactive', 'canceled', 'expired', 'trialing', 'paused'));

alter table public.profiles
  add column if not exists consumer_plan_current_period_end timestamptz,
  add column if not exists billing_provider text,
  add column if not exists billing_customer_id text,
  add column if not exists billing_subscription_id text,
  add column if not exists billing_last_event_id text;

create index if not exists profiles_billing_customer_id_idx
on public.profiles (billing_provider, billing_customer_id);

create index if not exists profiles_billing_subscription_id_idx
on public.profiles (billing_provider, billing_subscription_id);

create table if not exists public.billing_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  provider text not null check (provider in ('stripe')),
  provider_customer_id text not null,
  provider_subscription_id text not null,
  provider_price_id text,
  consumer_plan_tier text not null default 'pro'
    check (consumer_plan_tier in ('free', 'pro')),
  status text not null
    check (status in ('active', 'inactive', 'canceled', 'expired', 'trialing', 'paused')),
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  canceled_at timestamptz,
  trial_end timestamptz,
  last_event_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  unique (provider, provider_subscription_id)
);

create index if not exists billing_subscriptions_user_id_idx
on public.billing_subscriptions (user_id, updated_at desc);

create index if not exists billing_subscriptions_customer_idx
on public.billing_subscriptions (provider, provider_customer_id);

create table if not exists public.billing_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null check (provider in ('stripe')),
  provider_event_id text not null,
  event_type text not null,
  user_id uuid references auth.users (id) on delete set null,
  provider_customer_id text,
  provider_subscription_id text,
  processed_at timestamptz,
  payload jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc'::text, now()),
  unique (provider, provider_event_id)
);

create index if not exists billing_events_user_id_idx
on public.billing_events (user_id, created_at desc);

create index if not exists billing_events_subscription_idx
on public.billing_events (provider, provider_subscription_id, created_at desc);

drop trigger if exists billing_subscriptions_set_updated_at on public.billing_subscriptions;
create trigger billing_subscriptions_set_updated_at
before update on public.billing_subscriptions
for each row
execute function public.handle_updated_at();

alter table public.billing_subscriptions enable row level security;
alter table public.billing_events enable row level security;

drop policy if exists "billing_subscriptions_select_own" on public.billing_subscriptions;
create policy "billing_subscriptions_select_own"
on public.billing_subscriptions
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "billing_events_select_own" on public.billing_events;
create policy "billing_events_select_own"
on public.billing_events
for select
to authenticated
using (auth.uid() = user_id);
