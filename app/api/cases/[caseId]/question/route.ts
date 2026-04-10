import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import type { Json } from "@/lib/database.types";
import {
  answerCaseQuestionWithAi,
  buildCaseMaterialSnapshots,
  parseStoredIntakeNormalization,
  parseStoredMaterialInterpretation
} from "@/lib/case-ai";
import {
  appendQuestionTrace,
  parseCaseQuestionRequest
} from "@/lib/case-question";
import {
  getCaseReviewDeltaSnapshot,
  getCaseReviewSnapshot,
  readCaseIntake
} from "@/lib/cases";
import type { SupportedUseCaseSlug } from "@/lib/case-workflows";
import { buildKnowledgeContext, summarizeKnowledgeContext } from "@/lib/knowledge/adapter";
import { createClient } from "@/lib/supabase/server";

type CaseQuestionRouteProps = {
  params: Promise<{
    caseId: string;
  }>;
};

export async function POST(request: Request, { params }: CaseQuestionRouteProps) {
  const { caseId } = await params;
  const body = await request.json().catch(() => null);
  const parsed = parseCaseQuestionRequest(body);

  if (!parsed.success) {
    return NextResponse.json({ message: parsed.message }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ message: "Sign in to ask about this case." }, { status: 401 });
  }

  const { data: caseRecord, error: caseError } = await supabase
    .from("cases")
    .select("*")
    .eq("user_id", user.id)
    .eq("id", caseId)
    .maybeSingle();

  if (caseError) {
    return NextResponse.json({ message: caseError.message }, { status: 500 });
  }

  if (!caseRecord) {
    return NextResponse.json({ message: "The selected case could not be found." }, { status: 404 });
  }

  if (caseRecord.use_case_slug !== parsed.data.useCase) {
    return NextResponse.json({ message: "The question scenario does not match this case." }, { status: 400 });
  }

  const [{ data: documents, error: documentsError }, { data: reviewRows, error: reviewError }] = await Promise.all([
    supabase.from("case_documents").select("*").eq("case_id", caseRecord.id).order("position", { ascending: true }),
    supabase.from("case_review_versions").select("*").eq("case_id", caseRecord.id).order("version_number", { ascending: false }).limit(2)
  ]);

  if (documentsError || reviewError) {
    return NextResponse.json(
      {
        message: documentsError?.message || reviewError?.message || "Unable to load the case context."
      },
      { status: 500 }
    );
  }

  const intake = readCaseIntake(caseRecord.intake_answers);
  const materialSnapshots = buildCaseMaterialSnapshots(documents ?? []);
  const intakeNormalization = parseStoredIntakeNormalization(caseRecord.metadata);
  const materialInterpretation = parseStoredMaterialInterpretation(caseRecord.metadata);
  const knowledgeContext = buildKnowledgeContext({
    useCaseSlug: caseRecord.use_case_slug as SupportedUseCaseSlug,
    intake,
    documents: materialSnapshots,
    intakeNormalization,
    materialInterpretation
  });
  const latestReview = getCaseReviewSnapshot(reviewRows?.[0] ?? null);
  const previousReview = getCaseReviewSnapshot(reviewRows?.[1] ?? null);
  const reviewDelta = getCaseReviewDeltaSnapshot(reviewRows?.[0] ?? null);
  const answerTrace = await answerCaseQuestionWithAi({
    useCaseSlug: caseRecord.use_case_slug as SupportedUseCaseSlug,
    question: parsed.data.question,
    knowledgeContext,
    caseContext: {
      caseId: caseRecord.id,
      caseTitle: caseRecord.title,
      caseStatus: caseRecord.status,
      latestReview,
      previousReview,
      reviewDelta,
      documents: materialSnapshots
    }
  });
  const questionTrace: Json = {
    sourceSurface: "case-workspace-question",
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
  const { error: updateError } = await supabase
    .from("cases")
    .update({
      metadata: appendQuestionTrace(caseRecord.metadata, questionTrace)
    })
    .eq("user_id", user.id)
      .eq("id", caseRecord.id);

  if (updateError) {
    return NextResponse.json({ message: updateError.message }, { status: 500 });
  }

  revalidatePath(`/dashboard/cases/${caseRecord.id}`);

  return NextResponse.json({
    answer: answerTrace.output,
    trace: {
      source: answerTrace.source,
      promptVersion: answerTrace.promptVersion,
      model: answerTrace.model,
      generatedAt: answerTrace.generatedAt,
      fallbackReason: answerTrace.fallbackReason,
      knowledge: summarizeKnowledgeContext(knowledgeContext)
    }
  });
}
