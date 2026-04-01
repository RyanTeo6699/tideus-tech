import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import type { TablesInsert } from "@/lib/database.types";
import { appendCaseStatusHistory, buildLatestReviewForCase } from "@/lib/cases";
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
      supabase.from("case_review_versions").select("version_number").eq("case_id", caseId).order("version_number", { ascending: false }).limit(1)
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

  const review = await buildLatestReviewForCase(caseRecord, documents ?? []);
  const nextVersion = (latestReviewRow?.[0]?.version_number ?? 0) + 1;
  const now = new Date().toISOString();

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
      source: "deterministic-case-review"
    }
  };

  const { error: insertReviewError } = await supabase.from("case_review_versions").insert(reviewInsert);

  if (insertReviewError) {
    return NextResponse.json({ message: insertReviewError.message }, { status: 500 });
  }

  const { error: updateCaseError } = await supabase
    .from("cases")
    .update({
      status: "reviewed",
      latest_review_version: nextVersion,
      latest_review_summary: review.summary,
      latest_readiness_status: review.readinessStatus,
      latest_timeline_note: review.timelineNote,
      latest_reviewed_at: now,
      checklist_state: review.checklist,
      status_history: appendCaseStatusHistory(caseRecord.status_history, "reviewed")
    })
    .eq("user_id", user.id)
    .eq("id", caseId);

  if (updateCaseError) {
    return NextResponse.json({ message: updateCaseError.message }, { status: 500 });
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/cases");
  revalidatePath(`/dashboard/cases/${caseId}`);
  revalidatePath(`/review-results/${caseId}`);

  return NextResponse.json({
    message: "Review generated.",
    readinessStatus: review.readinessStatus
  });
}
