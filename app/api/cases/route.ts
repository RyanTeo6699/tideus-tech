import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import type { TablesInsert } from "@/lib/database.types";
import { recordCaseEvents } from "@/lib/case-events";
import { parseCaseCreateInput } from "@/lib/case-review";
import { buildCaseTitle, buildInitialCaseDocuments } from "@/lib/cases";
import { appendCaseStatusHistory, getInitialCaseStatus, getNextCaseStatus } from "@/lib/case-state";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = parseCaseCreateInput(body);

  if (!parsed.success) {
    return NextResponse.json({ message: parsed.message }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ message: "Sign in to create a case." }, { status: 401 });
  }

  const now = new Date().toISOString();
  const createdStatus = getInitialCaseStatus();
  const completedStatus = getNextCaseStatus(createdStatus, "intake-complete");
  const caseInsert: TablesInsert<"cases"> = {
    user_id: user.id,
    use_case_slug: parsed.data.useCase,
    title: buildCaseTitle(parsed.data.useCase, parsed.data.intake),
    status: createdStatus,
    intake_answers: parsed.data.intake,
    intake_completed_at: null,
    checklist_state: [],
    status_history: appendCaseStatusHistory([], createdStatus, now),
    metadata: {
      export_records: [],
      tracking_hooks: {
        review_generated: false,
        materials_completed: false
      }
    }
  };

  const { data: createdCase, error: caseError } = await supabase
    .from("cases")
    .insert(caseInsert)
    .select("id, title")
    .single();

  if (caseError || !createdCase) {
    return NextResponse.json({ message: caseError?.message || "Unable to create the case." }, { status: 500 });
  }

  const documents = buildInitialCaseDocuments(parsed.data.useCase, parsed.data.intake).map((item) => ({
    ...item,
    case_id: createdCase.id
  }));

  const { error: documentsError } = await supabase.from("case_documents").insert(documents);

  if (documentsError) {
    return NextResponse.json({ message: documentsError.message }, { status: 500 });
  }

  const { error: updateCaseError } = await supabase
    .from("cases")
    .update({
      status: completedStatus,
      intake_completed_at: now,
      status_history: appendCaseStatusHistory(caseInsert.status_history, completedStatus, now)
    })
    .eq("user_id", user.id)
    .eq("id", createdCase.id);

  if (updateCaseError) {
    return NextResponse.json({ message: updateCaseError.message }, { status: 500 });
  }

  const eventError = await recordCaseEvents(supabase, [
    {
      caseId: createdCase.id,
      userId: user.id,
      eventType: "case_created",
      status: createdStatus,
      metadata: {
        useCaseSlug: parsed.data.useCase
      },
      createdAt: now
    },
    {
      caseId: createdCase.id,
      userId: user.id,
      eventType: "intake_started",
      status: createdStatus,
      metadata: {
        source: "case-intake-form"
      },
      createdAt: now
    },
    {
      caseId: createdCase.id,
      userId: user.id,
      eventType: "intake_completed",
      status: completedStatus,
      fromStatus: createdStatus,
      toStatus: completedStatus,
      metadata: {
        useCaseSlug: parsed.data.useCase
      },
      createdAt: now
    }
  ]);

  if (eventError) {
    console.error("Unable to record case creation events", eventError);
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/cases");
  revalidatePath("/case-intake");
  revalidatePath("/start-case");

  return NextResponse.json({
    message: "Case created.",
    caseId: createdCase.id,
    nextHref: `/upload-materials/${createdCase.id}`
  });
}
