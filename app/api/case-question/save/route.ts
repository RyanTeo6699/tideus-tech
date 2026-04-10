import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import type { Json, TablesInsert } from "@/lib/database.types";
import { answerCaseQuestionWithAi, normalizeCaseIntakeWithAi } from "@/lib/case-ai";
import { recordCaseEvent } from "@/lib/case-events";
import {
  appendQuestionTrace,
  buildQuestionSeedIntake,
  parseCaseQuestionSaveRequest
} from "@/lib/case-question";
import { buildInitialCaseDocuments } from "@/lib/cases";
import { appendCaseStatusHistory, getInitialCaseStatus } from "@/lib/case-state";
import { buildKnowledgeContext, summarizeKnowledgeContext } from "@/lib/knowledge/adapter";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = parseCaseQuestionSaveRequest(body);

  if (!parsed.success) {
    return NextResponse.json({ message: parsed.message }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ message: "Sign in to save this answer to a workspace." }, { status: 401 });
  }

  const now = new Date().toISOString();
  const createdStatus = getInitialCaseStatus();
  const intake = buildQuestionSeedIntake(parsed.data.useCase, parsed.data.question);
  const intakeNormalization = await normalizeCaseIntakeWithAi(parsed.data.useCase, intake);
  const knowledgeContext = buildKnowledgeContext({
    useCaseSlug: parsed.data.useCase,
    intake,
    documents: [],
    intakeNormalization: intakeNormalization.output,
    materialInterpretation: null
  });
  const answerTrace = await answerCaseQuestionWithAi({
    useCaseSlug: parsed.data.useCase,
    question: parsed.data.question,
    knowledgeContext
  });
  const questionTrace: Json = {
    sourceSurface: "case-question-entry",
    action: parsed.data.action,
    question: parsed.data.question,
    answer: answerTrace.output as Json,
    trace: {
      source: answerTrace.source,
      promptVersion: answerTrace.promptVersion,
      model: answerTrace.model,
      generatedAt: answerTrace.generatedAt,
      fallbackReason: answerTrace.fallbackReason
    },
    knowledge: summarizeKnowledgeContext(knowledgeContext) as Json
  };
  const caseInsert: TablesInsert<"cases"> = {
    user_id: user.id,
    use_case_slug: parsed.data.useCase,
    title: intake.title,
    status: createdStatus,
    intake_answers: intake,
    intake_completed_at: null,
    checklist_state: [],
    status_history: appendCaseStatusHistory([], createdStatus, now),
    metadata: appendQuestionTrace(
      {
        export_records: [],
        tracking_hooks: {
          review_generated: false,
          materials_completed: false
        },
        aiWorkflow: {
          intakeNormalization: intakeNormalization as Json
        },
        trackerActions: answerTrace.output.trackerActions as Json,
        entrySurface: "case-question"
      },
      questionTrace
    )
  };

  const { data: createdCase, error: caseError } = await supabase
    .from("cases")
    .insert(caseInsert)
    .select("id")
    .single();

  if (caseError || !createdCase) {
    return NextResponse.json({ message: caseError?.message || "Unable to create the workspace." }, { status: 500 });
  }

  const documents = buildInitialCaseDocuments(parsed.data.useCase, intake).map((item) => ({
    ...item,
    case_id: createdCase.id
  }));
  const { error: documentsError } = await supabase.from("case_documents").insert(documents);

  if (documentsError) {
    return NextResponse.json({ message: documentsError.message }, { status: 500 });
  }

  const eventError = await recordCaseEvent(supabase, {
    caseId: createdCase.id,
    userId: user.id,
    eventType: "case_created",
    status: createdStatus,
    metadata: {
      source: "case-question-entry",
      sourceSurface: "case-question-entry",
      useCaseSlug: parsed.data.useCase,
      action: parsed.data.action,
      trackerActionCount: answerTrace.output.trackerActions.length,
      questionAnswerSource: answerTrace.source,
      questionPromptVersion: answerTrace.promptVersion,
      knowledgeSourceVersion: knowledgeContext.sourceVersion,
      knowledgeScenarioTag: knowledgeContext.scenarioTag
    },
    createdAt: now
  });

  if (eventError) {
    console.error("Unable to record question workspace event", eventError);
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/cases");
  revalidatePath("/start-case");
  revalidatePath("/case-question");

  const nextHref =
    parsed.data.action === "continue-in-case-workspace"
      ? `/dashboard/cases/${createdCase.id}`
      : `/upload-materials/${createdCase.id}`;

  return NextResponse.json({
    message: "Saved to workspace.",
    caseId: createdCase.id,
    nextHref
  });
}
