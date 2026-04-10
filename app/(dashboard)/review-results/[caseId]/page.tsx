import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { CaseReviewResult } from "@/components/cases/case-review-result";
import { WorkspaceShell } from "@/components/dashboard/workspace-shell";
import { EventLink } from "@/components/site/event-link";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCaseDetail, getCaseReviewSnapshot, getReviewHistoryFacts } from "@/lib/cases";
import { getUseCaseDefinition } from "@/lib/case-workflows";
import { getCurrentLocale } from "@/lib/i18n/server";
import { getWorkspaceCopy } from "@/lib/i18n/workspace";

type ReviewResultsPageProps = {
  params: Promise<{
    caseId: string;
  }>;
};

export default async function ReviewResultsPage({ params }: ReviewResultsPageProps) {
  const { caseId } = await params;
  const detail = await getCaseDetail(caseId, {
    resumeSource: "review-results"
  });
  const locale = await getCurrentLocale();
  const copy = getWorkspaceCopy(locale);

  if (!detail.user) {
    redirect(`/login?next=${encodeURIComponent(`/review-results/${caseId}`)}`);
  }

  if (!detail.caseRecord) {
    notFound();
  }

  const review = getCaseReviewSnapshot(detail.latestReview);
  const useCase = getUseCaseDefinition(detail.caseRecord.use_case_slug, locale);

  return (
    <WorkspaceShell
      actions={[{ href: `/dashboard/cases/${caseId}`, label: copy.actions.viewCase, variant: "outline" }]}
      description="这是一份与当前材料包状态对应的已保存审查版本。"
      eyebrow={copy.shell.reviewEyebrow}
      title={`${detail.caseRecord.title} · ${copy.shell.reviewEyebrow}`}
    >
      {review ? (
        <CaseReviewResult
          caseId={caseId}
          caseTitle={detail.caseRecord.title}
          latestReviewedAt={detail.latestReview?.created_at ?? detail.caseRecord.latest_reviewed_at}
          latestReviewVersion={detail.latestReview?.version_number ?? detail.caseRecord.latest_review_version}
          review={review}
          reviewHistoryFacts={getReviewHistoryFacts(detail.reviewHistory, locale)}
          showBookDemoCta
          sourceSurface="review-results-page"
          useCaseSlug={detail.caseRecord.use_case_slug}
          useCaseTitle={useCase?.shortTitle || detail.caseRecord.use_case_slug}
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>{copy.common.noReviewYet}</CardTitle>
            <CardDescription>当前材料状态还没有生成可保存的结构化审查结果。</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row">
            <EventLink
              caseId={caseId}
              className={buttonVariants({ size: "sm" })}
              eventType="review_cta_clicked"
              href={`/upload-materials/${caseId}`}
              metadata={{
                sourceSurface: "review-results-empty-state",
                cta: "return-to-materials",
                useCase: detail.caseRecord.use_case_slug,
                readinessStatus: detail.caseRecord.latest_readiness_status,
                reviewVersion: detail.caseRecord.latest_review_version
              }}
            >
              {copy.actions.returnToMaterials}
            </EventLink>
            <Link className={buttonVariants({ variant: "outline", size: "sm" })} href={`/dashboard/cases/${caseId}`}>
              {copy.actions.viewDetail}
            </Link>
          </CardContent>
        </Card>
      )}
    </WorkspaceShell>
  );
}
