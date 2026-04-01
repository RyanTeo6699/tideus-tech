alter table public.assessments
  add column if not exists result_why_matters text[] not null default '{}',
  add column if not exists result_risks_and_constraints text[] not null default '{}',
  add column if not exists result_missing_information text[] not null default '{}';

alter table public.comparisons
  add column if not exists result_why_matters text[] not null default '{}',
  add column if not exists result_risks_and_constraints text[] not null default '{}',
  add column if not exists result_missing_information text[] not null default '{}';

update public.assessments
set
  result_why_matters = case
    when coalesce(array_length(result_why_matters, 1), 0) = 0 then coalesce(result_focus_areas, '{}')
    else result_why_matters
  end,
  result_risks_and_constraints = coalesce(result_risks_and_constraints, '{}'),
  result_missing_information = coalesce(result_missing_information, '{}');

update public.comparisons
set
  result_why_matters = case
    when coalesce(array_length(result_why_matters, 1), 0) = 0 then coalesce(result_focus_areas, '{}')
    else result_why_matters
  end,
  result_risks_and_constraints = coalesce(result_risks_and_constraints, '{}'),
  result_missing_information = coalesce(result_missing_information, '{}');
