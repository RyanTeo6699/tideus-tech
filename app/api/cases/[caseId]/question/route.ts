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
import { getCurrentLocale } from "@/lib/i18n/server";
import { pickLocale } from "@/lib/i18n/workspace";
import type { SupportedUseCaseSlug } from "@/lib/case-workflows";
import { buildKnowledgeContext, summarizeKnowledgeContext } from "@/lib/knowledge/adapter";
import { getConsumerCapabilityAccessDeniedMessage, getConsumerPlanState, hasConsumerPlanCapability } from "@/lib/plans";
import { createClient } from "@/lib/supabase/server";

type CaseQuestionRouteProps = {
  params: Promise<{
    caseId: string;
  }>;
};

export async function POST(request: Request, { params }: CaseQuestionRouteProps) {
  const { caseId } = await params;
  const body = await request.json().catch(() => null);
  const locale = await getCurrentLocale();
  const parsed = parseCaseQuestionRequest(body, locale);

  if (!parsed.success) {
    return NextResponse.json({ message: parsed.message }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { message: pickLocale(locale, "请先登录后再询问这个案件。", "請先登入後再詢問這個案件。") },
      { status: 401 }
    );
  }

  const [{ data: caseRecord, error: caseError }, { data: profile, error: profileError }] = await Promise.all([
    supabase.from("cases").select("*").eq("user_id", user.id).eq("id", caseId).maybeSingle(),
    supabase.from("profiles").select("metadata").eq("user_id", user.id).maybeSingle()
  ]);

  if (caseError || profileError) {
    return NextResponse.json(
      {
        message:
          caseError?.message ||
          profileError?.message ||
          pickLocale(locale, "暂时无法加载案件提问权限。", "暫時無法載入案件提問權限。")
      },
      { status: 500 }
    );
  }

  if (!caseRecord) {
    return NextResponse.json(
      { message: pickLocale(locale, "找不到所选案件。", "找不到所選案件。") },
      { status: 404 }
    );
  }

  const planState = getConsumerPlanState(profile ?? null);

  if (!hasConsumerPlanCapability(planState, "workspace_case_questions")) {
    return NextResponse.json(
      { message: getConsumerCapabilityAccessDeniedMessage("workspace_case_questions", locale) },
      { status: 403 }
    );
  }

  if (caseRecord.use_case_slug !== parsed.data.useCase) {
    return NextResponse.json(
      { message: pickLocale(locale, "提问场景与当前案件不匹配。", "提問場景與目前案件不匹配。") },
      { status: 400 }
    );
  }

  const [{ data: documents, error: documentsError }, { data: reviewRows, error: reviewError }] = await Promise.all([
    supabase.from("case_documents").select("*").eq("case_id", caseRecord.id).order("position", { ascending: true }),
    supabase.from("case_review_versions").select("*").eq("case_id", caseRecord.id).order("version_number", { ascending: false }).limit(2)
  ]);

  if (documentsError || reviewError) {
    return NextResponse.json(
      {
        message:
          documentsError?.message ||
          reviewError?.message ||
          pickLocale(locale, "暂时无法加载案件上下文。", "暫時無法載入案件脈絡。")
      },
      { status: 500 }
    );
  }

  const intake = readCaseIntake(caseRecord.intake_answers);
  const materialSnapshots = buildCaseMaterialSnapshots(documents ?? []);
  const intakeNormalization = parseStoredIntakeNormalization(caseRecord.metadata);
  const materialInterpretation = parseStoredMaterialInterpretation(caseRecord.metadata, locale);
  const knowledgeContext = await buildKnowledgeContext({
    language: locale,
    useCaseSlug: caseRecord.use_case_slug as SupportedUseCaseSlug,
    intake,
    documents: materialSnapshots,
    intakeNormalization,
    materialInterpretation
  });
  const latestReview = getCaseReviewSnapshot(reviewRows?.[0] ?? null);
  const previousReview = getCaseReviewSnapshot(reviewRows?.[1] ?? null);
  const reviewDelta = getCaseReviewDeltaSnapshot(reviewRows?.[0] ?? null, locale);
  const answerTrace = await answerCaseQuestionWithAi({
    language: locale,
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
