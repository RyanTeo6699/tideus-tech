alter table public.profiles
  add column if not exists citizenship text,
  add column if not exists age_band text,
  add column if not exists marital_status text,
  add column if not exists education_level text,
  add column if not exists english_test_status text,
  add column if not exists canadian_experience text,
  add column if not exists foreign_experience text,
  add column if not exists job_offer_support text,
  add column if not exists province_preference text,
  add column if not exists refusal_history_flag boolean not null default false;

update public.profiles
set
  education_level = coalesce(education_level, nullif(metadata ->> 'education_level', '')),
  english_test_status = coalesce(
    english_test_status,
    case
      when nullif(metadata ->> 'language_readiness', '') = 'ready' then 'completed'
      when nullif(metadata ->> 'language_readiness', '') = 'booked' then 'booked'
      when nullif(metadata ->> 'language_readiness', '') = 'not-started' then 'not-started'
      else null
    end
  ),
  refusal_history_flag = coalesce(refusal_history_flag, false);
