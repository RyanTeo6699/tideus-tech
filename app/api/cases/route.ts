import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import type { Json, TablesInsert } from "@/lib/database.types";
import { normalizeCaseIntakeWithAi } from "@/lib/case-ai";
import { recordCaseEvents } from "@/lib/case-events";
import { parseCaseCreateInput } from "@/lib/case-review";
import { buildCaseTitle, buildInitialCaseDocuments } from "@/lib/cases";
import { getCurrentLocale } from "@/lib/i18n/server";
import { pickLocale } from "@/lib/i18n/workspace";
import { appendCaseStatusHistory, getInitialCaseStatus, getNextCaseStatus } from "@/lib/case-state";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const locale = await getCurrentLocale();
  const parsed = parseCaseCreateInput(body, locale);

  if (!parsed.success) {
    return NextResponse.json({ message: parsed.message }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { message: pickLocale(locale, "请先登录后再创建案件。", "請先登入後再建立案件。") },
      { status: 401 }
    );
  }

  const now = new Date().toISOString();
  const createdStatus = getInitialCaseStatus();
  const completedStatus = getNextCaseStatus(createdStatus, "intake-complete");
  const intakeNormalization = await normalizeCaseIntakeWithAi(parsed.data.useCase, parsed.data.intake, locale);
  const caseInsert: TablesInsert<"cases"> = {
    user_id: user.id,
    use_case_slug: parsed.data.useCase,
    title: buildCaseTitle(parsed.data.useCase, parsed.data.intake, locale),
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
      },
      aiWorkflow: {
        intakeNormalization: intakeNormalization as Json
      }
    }
  };

  const { data: createdCase, error: caseError } = await supabase
    .from("cases")
    .insert(caseInsert)
    .select("id, title")
    .single();

  if (caseError || !createdCase) {
    return NextResponse.json(
      { message: caseError?.message || pickLocale(locale, "暂时无法创建案件。", "暫時無法建立案件。") },
      { status: 500 }
    );
  }

  const documents = buildInitialCaseDocuments(parsed.data.useCase, parsed.data.intake, locale).map((item) => ({
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
        useCaseSlug: parsed.data.useCase,
        intakeNormalizationSource: intakeNormalization.source,
        intakeNormalizationPromptVersion: intakeNormalization.promptVersion,
        normalizedFieldCount: Object.keys(intakeNormalization.output.inferredFields).length,
        normalizedReviewNoteCount: intakeNormalization.output.reviewNotes.length
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
    message: pickLocale(locale, "案件已创建。", "案件已建立。"),
    caseId: createdCase.id,
    nextHref: `/upload-materials/${createdCase.id}`
  });
}
