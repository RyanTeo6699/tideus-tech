import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import type { Json, TablesInsert } from "@/lib/database.types";
import {
  buildCaseMaterialSnapshots,
  buildCaseReviewDeltaWithAi,
  enrichCaseReviewWithAi,
  parseStoredIntakeNormalization,
  parseStoredMaterialInterpretation
} from "@/lib/case-ai";
import {
  applyCaseKnowledgeToReview,
  buildCaseKnowledgeContext,
  summarizeCaseKnowledgeContext
} from "@/lib/case-knowledge";
import { recordCaseEvent } from "@/lib/case-events";
import { buildLatestReviewForCase, getCaseReviewSnapshot, readCaseIntake } from "@/lib/cases";
import { appendCaseStatusHistory, getNextCaseStatus, normalizeCaseStatus } from "@/lib/case-state";
import type { SupportedUseCaseSlug } from "@/lib/case-workflows";
import { createClient } from "@/lib/supabase/server";

type CaseReviewRouteProps = {
  params: Promise<{
    caseId: string;
  }>;
};

export async function POST(_request: Request, { params }: CaseReviewRouteProps) {
  const { caseId } = await params;
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ message: "Sign in to generate a case review." }, { status: 401 });
  }

  const [{ data: caseRecord, error: caseError }, { data: documents, error: documentsError }, { data: latestReviewRow, error: latestReviewError }] =
    await Promise.all([
      supabase
        .from("cases")
        .select("*")
        .eq("user_id", user.id)
        .eq("id", caseId)
        .maybeSingle(),
      supabase.from("case_documents").select("*").eq("case_id", caseId).order("position", { ascending: true }),
      supabase.from("case_review_versions").select("*").eq("case_id", caseId).order("version_number", { ascending: false }).limit(1)
    ]);

  if (caseError || documentsError || latestReviewError) {
    return NextResponse.json(
      {
        message: caseError?.message || documentsError?.message || latestReviewError?.message || "Unable to load the case."
      },
      { status: 500 }
    );
  }

  if (!caseRecord) {
    return NextResponse.json({ message: "The selected case could not be found." }, { status: 404 });
  }

  const currentStatus = normalizeCaseStatus(caseRecord.status);

  if (!currentStatus) {
    return NextResponse.json({ message: "The case status could not be resolved." }, { status: 500 });
  }

  const deterministicReview = await buildLatestReviewForCase(caseRecord, documents ?? []);
  const previousReview = latestReviewRow?.[0] ? getCaseReviewSnapshot(latestReviewRow[0]) : null;
  const intake = readCaseIntake(caseRecord.intake_answers);
  const materialSnapshots = buildCaseMaterialSnapshots(documents ?? []);
  const intakeNormalization = parseStoredIntakeNormalization(caseRecord.metadata);
  const materialInterpretation = parseStoredMaterialInterpretation(caseRecord.metadata);
  const knowledgeContext = buildCaseKnowledgeContext({
    useCaseSlug: caseRecord.use_case_slug as SupportedUseCaseSlug,
    intake,
    documents: materialSnapshots,
    intakeNormalization,
    materialInterpretation
  });
  const baselineReview = applyCaseKnowledgeToReview(deterministicReview, knowledgeContext);
  const aiReview = await enrichCaseReviewWithAi({
    useCaseSlug: caseRecord.use_case_slug as SupportedUseCaseSlug,
    intake,
    documents: materialSnapshots,
    baselineReview,
    intakeNormalization,
    materialInterpretation,
    knowledgeContext
  });
  const review = aiReview.review;
  const reviewDelta = previousReview
    ? await buildCaseReviewDeltaWithAi({
        useCaseSlug: caseRecord.use_case_slug as SupportedUseCaseSlug,
        previousReview,
        latestReview: review
      })
    : null;
  const nextVersion = (latestReviewRow?.[0]?.version_number ?? 0) + 1;
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
    case_id: caseId,
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
      knowledgeAdapter: knowledgeContext as Json,
      aiWorkflow: {
        reviewGeneration: aiReview.trace as Json,
        reviewDelta: reviewDelta as Json | null
      },
      reviewDelta: reviewDelta?.output ?? null
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
    .eq("id", caseId);

  if (updateCaseError) {
    return NextResponse.json({ message: updateCaseError.message }, { status: 500 });
  }

  const eventError = await recordCaseEvent(supabase, {
    caseId,
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
      knowledgeSummary: summarizeCaseKnowledgeContext(knowledgeContext),
      reviewGenerationSource: aiReview.trace.source,
      reviewPromptVersion: aiReview.trace.promptVersion,
      deltaGenerated: Boolean(reviewDelta),
      deltaSource: reviewDelta?.source ?? null,
      deltaPromptVersion: reviewDelta?.promptVersion ?? null
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
    message: "Review generated.",
    readinessStatus: review.readinessStatus
  });
}
