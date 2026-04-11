import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import type { Json, TablesInsert } from "@/lib/database.types";
import {
  buildCaseMaterialSnapshots,
  buildCaseHandoffIntelligenceWithAi,
  buildCaseReviewDeltaWithAi,
  enrichCaseReviewWithAi,
  parseStoredIntakeNormalization,
  parseStoredMaterialInterpretation
} from "@/lib/case-ai";
import {
  applyKnowledgeToReview,
  buildKnowledgeContext,
  summarizeKnowledgeContext
} from "@/lib/knowledge/adapter";
import { recordCaseEvent } from "@/lib/case-events";
import { buildLatestReviewForCase, getCaseReviewSnapshot, readCaseIntake } from "@/lib/cases";
import { getCurrentLocale } from "@/lib/i18n/server";
import { pickLocale } from "@/lib/i18n/workspace";
import { appendCaseStatusHistory, getNextCaseStatus, normalizeCaseStatus } from "@/lib/case-state";
import type { SupportedUseCaseSlug } from "@/lib/case-workflows";
import { getConsumerPlanState, hasConsumerPlanCapability } from "@/lib/plans";
import { createClient } from "@/lib/supabase/server";

type CaseReviewRouteProps = {
  params: Promise<{
    caseId: string;
  }>;
};

export async function POST(_request: Request, { params }: CaseReviewRouteProps) {
  const { caseId } = await params;
  const locale = await getCurrentLocale();
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { message: pickLocale(locale, "请先登录后再生成案件审查。", "請先登入後再生成案件審查。") },
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
          pickLocale(locale, "暂时无法加载案件方案状态。", "暫時無法載入案件方案狀態。")
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

  const [{ data: documents, error: documentsError }, { data: latestReviewRow, error: latestReviewError }] = await Promise.all([
    supabase.from("case_documents").select("*").eq("case_id", caseRecord.id).order("position", { ascending: true }),
    supabase.from("case_review_versions").select("*").eq("case_id", caseRecord.id).order("version_number", { ascending: false }).limit(1)
  ]);

  if (documentsError || latestReviewError) {
    return NextResponse.json(
      {
        message:
          documentsError?.message ||
          latestReviewError?.message ||
          pickLocale(locale, "暂时无法加载案件。", "暫時無法載入案件。")
      },
      { status: 500 }
    );
  }

  const currentStatus = normalizeCaseStatus(caseRecord.status);

  if (!currentStatus) {
    return NextResponse.json(
      { message: pickLocale(locale, "暂时无法解析案件状态。", "暫時無法解析案件狀態。") },
      { status: 500 }
    );
  }

  const deterministicReview = await buildLatestReviewForCase(caseRecord, documents ?? [], locale);
  const previousReview = latestReviewRow?.[0] ? getCaseReviewSnapshot(latestReviewRow[0]) : null;
  const planState = getConsumerPlanState(profile ?? null);
  const canUseReviewDelta = hasConsumerPlanCapability(planState, "review_delta");
  const canUseHandoffIntelligence = hasConsumerPlanCapability(planState, "handoff_intelligence");
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
  const baselineReview = applyKnowledgeToReview(deterministicReview, knowledgeContext);
  const aiReview = await enrichCaseReviewWithAi({
    language: locale,
    useCaseSlug: caseRecord.use_case_slug as SupportedUseCaseSlug,
    intake,
    documents: materialSnapshots,
    baselineReview,
    intakeNormalization,
    materialInterpretation,
    knowledgeContext
  });
  const review = aiReview.review;
  const reviewDelta = canUseReviewDelta && previousReview
    ? await buildCaseReviewDeltaWithAi({
        language: locale,
        useCaseSlug: caseRecord.use_case_slug as SupportedUseCaseSlug,
        previousReview,
        latestReview: review
      })
    : null;
  const nextVersion = (latestReviewRow?.[0]?.version_number ?? 0) + 1;
  const handoffIntelligence = canUseHandoffIntelligence
    ? await buildCaseHandoffIntelligenceWithAi({
        language: locale,
        useCaseSlug: caseRecord.use_case_slug as SupportedUseCaseSlug,
        caseTitle: caseRecord.title,
        reviewVersion: nextVersion,
        latestReview: review,
        knowledgeContext
      })
    : null;
  const now = new Date().toISOString();
  const nextStatus = getNextCaseStatus(currentStatus, "reviewed");
  const eventType = nextVersion > 1 ? "review_regenerated" : "review_generated";
  const checklistReadyCount = review.checklist.filter(
    (item) => item.status === "ready" || item.status === "not-applicable"
  ).length;
  const checklistNeedsWorkCount = review.checklist.length - checklistReadyCount;
  const highRiskCount = review.riskFlags.filter((item) => item.severity === "high").length;
  const mediumRiskCount = review.riskFlags.filter((item) => item.severity === "medium").length;

  const reviewInsert: TablesInsert<"case_review_versions"> = {
    case_id: caseRecord.id,
    version_number: nextVersion,
    readiness_status: review.readinessStatus,
    readiness_summary: review.readinessSummary,
    result_summary: review.summary,
    timeline_note: review.timelineNote,
    checklist_items: review.checklist,
    missing_items: review.missingItems,
    risk_flags: review.riskFlags,
    next_steps: review.nextSteps,
    metadata: {
      source: aiReview.trace.source === "openai" ? "knowledge-ai-enriched-case-review" : "knowledge-enhanced-deterministic-case-review",
      reviewSupport: {
        supportingContextNotes: review.supportingContextNotes,
        officialReferenceLabels: review.officialReferenceLabels
      },
      knowledgeAdapter: knowledgeContext as Json,
      aiWorkflow: {
        reviewGeneration: aiReview.trace as Json,
        reviewDelta: reviewDelta as Json | null,
        handoffIntelligence: handoffIntelligence as Json | null
      },
      reviewDelta: (reviewDelta?.output ?? null) as Json | null,
      handoffIntelligence: (handoffIntelligence?.output ?? null) as Json | null
    }
  };

  const { error: insertReviewError } = await supabase.from("case_review_versions").insert(reviewInsert);

  if (insertReviewError) {
    return NextResponse.json({ message: insertReviewError.message }, { status: 500 });
  }

  const { error: updateCaseError } = await supabase
    .from("cases")
    .update({
      status: nextStatus,
      latest_review_version: nextVersion,
      latest_review_summary: review.summary,
      latest_readiness_status: review.readinessStatus,
      latest_timeline_note: review.timelineNote,
      latest_reviewed_at: now,
      checklist_state: review.checklist,
      status_history: appendCaseStatusHistory(caseRecord.status_history, nextStatus, now)
    })
    .eq("user_id", user.id)
    .eq("id", caseRecord.id);

  if (updateCaseError) {
    return NextResponse.json({ message: updateCaseError.message }, { status: 500 });
  }

  const eventError = await recordCaseEvent(supabase, {
    caseId: caseRecord.id,
    userId: user.id,
    eventType,
    status: nextStatus,
    fromStatus: currentStatus,
    toStatus: nextStatus,
    metadata: {
      versionNumber: nextVersion,
      readinessStatus: review.readinessStatus,
      useCase: caseRecord.use_case_slug,
      useCaseSlug: caseRecord.use_case_slug,
      missingCount: review.missingItems.length,
      missingItemCount: review.missingItems.length,
      riskCount: review.riskFlags.length,
      highRiskCount,
      mediumRiskCount,
      checklistReadyCount,
      checklistNeedsWorkCount,
      knowledgeAdapterStatus: knowledgeContext.status,
      knowledgeSourceVersion: knowledgeContext.sourceVersion,
      knowledgeScenarioTag: knowledgeContext.scenarioTag,
      knowledgeSummary: summarizeKnowledgeContext(knowledgeContext),
      reviewGenerationSource: aiReview.trace.source,
      reviewPromptVersion: aiReview.trace.promptVersion,
      deltaGenerated: Boolean(reviewDelta),
      deltaCapabilityEnabled: canUseReviewDelta,
      deltaSource: reviewDelta?.source ?? null,
      deltaPromptVersion: reviewDelta?.promptVersion ?? null,
      deltaRemovedRiskCount: reviewDelta?.output.removedRisks.length ?? 0,
      handoffIntelligenceGenerated: Boolean(handoffIntelligence),
      handoffCapabilityEnabled: canUseHandoffIntelligence,
      handoffIntelligenceSource: handoffIntelligence?.source ?? null,
      handoffIntelligencePromptVersion: handoffIntelligence?.promptVersion ?? null,
      handoffEscalationTriggerCount: handoffIntelligence?.output.escalationTriggers.length ?? 0,
      handoffHumanReviewIssueCount: handoffIntelligence?.output.issuesNeedingHumanReview.length ?? 0
    },
    createdAt: now
  });

  if (eventError) {
    console.error("Unable to record case review event", eventError);
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/cases");
  revalidatePath(`/dashboard/cases/${caseId}`);
  revalidatePath(`/review-results/${caseId}`);
  revalidatePath(`/review-results/${caseId}/export`);

  return NextResponse.json({
    message: pickLocale(locale, "审查已生成。", "審查已生成。"),
    readinessStatus: review.readinessStatus
  });
}
