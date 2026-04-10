alter table public.app_events
drop constraint if exists app_events_event_type_check;

alter table public.app_events
add constraint app_events_event_type_check
check (
  event_type in (
    'landing_cta_clicked',
    'start_case_selected',
    'use_case_cta_clicked',
    'review_cta_clicked',
    'dashboard_resume_clicked',
    'book_demo_clicked',
    'early_access_requested',
    'export_clicked',
    'knowledge_refresh_completed'
  )
);
