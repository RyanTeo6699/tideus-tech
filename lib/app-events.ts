import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, Json, TablesInsert } from "@/lib/database.types";

export const appEventTypes = [
  "landing_cta_clicked",
  "start_case_selected",
  "use_case_cta_clicked",
  "review_cta_clicked",
  "dashboard_resume_clicked",
  "book_demo_clicked",
  "early_access_requested",
  "export_clicked"
] as const;

export type AppEventType = (typeof appEventTypes)[number];

type AppEventInput = {
  eventType: AppEventType;
  userId?: string | null;
  caseId?: string | null;
  leadRequestId?: string | null;
  path?: string | null;
  metadata?: Json;
  createdAt?: string;
};

export function isAppEventType(value: string): value is AppEventType {
  return appEventTypes.includes(value as AppEventType);
}

export async function recordAppEvent(supabase: SupabaseClient<Database>, input: AppEventInput) {
  return recordAppEvents(supabase, [input]);
}

export async function recordAppEvents(supabase: SupabaseClient<Database>, inputs: AppEventInput[]) {
  if (inputs.length === 0) {
    return null;
  }

  const payload: TablesInsert<"app_events">[] = inputs.map((input) => ({
    user_id: input.userId ?? null,
    case_id: input.caseId ?? null,
    lead_request_id: input.leadRequestId ?? null,
    event_type: input.eventType,
    path: input.path ?? null,
    metadata: input.metadata ?? {},
    created_at: input.createdAt
  }));

  const { error } = await supabase.from("app_events").insert(payload);
  return error;
}
