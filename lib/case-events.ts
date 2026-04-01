import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, Json, TablesInsert } from "@/lib/database.types";
import type { CaseEventType, CaseStatus } from "@/lib/case-state";

type CaseEventInput = {
  caseId: string;
  userId: string;
  eventType: CaseEventType;
  status: CaseStatus;
  fromStatus?: CaseStatus | null;
  toStatus?: CaseStatus | null;
  metadata?: Json;
  createdAt?: string;
};

export async function recordCaseEvent(
  supabase: SupabaseClient<Database>,
  input: CaseEventInput
) {
  return recordCaseEvents(supabase, [input]);
}

export async function recordCaseEvents(
  supabase: SupabaseClient<Database>,
  inputs: CaseEventInput[]
) {
  if (inputs.length === 0) {
    return null;
  }

  const payload: TablesInsert<"case_events">[] = inputs.map((input) => ({
    case_id: input.caseId,
    user_id: input.userId,
    event_type: input.eventType,
    status: input.status,
    from_status: input.fromStatus ?? null,
    to_status: input.toStatus ?? null,
    metadata: input.metadata ?? {},
    created_at: input.createdAt
  }));

  const { error } = await supabase.from("case_events").insert(payload);
  return error;
}
