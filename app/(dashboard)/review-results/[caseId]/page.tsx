import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { CaseReviewResult } from "@/components/cases/case-review-result";
import { WorkspaceShell } from "@/components/dashboard/workspace-shell";
import { EventLink } from "@/components/site/event-link";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCaseDetail, getCaseReviewSnapshot, getReviewHistoryFacts } from "@/lib/cases";
import { getUseCaseDefinition } from "@/lib/case-workflows";

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

  if (!detail.user) {
    redirect(`/login?next=${encodeURIComponent(`/review-results/${caseId}`)}`);
  }

  if (!detail.caseRecord) {
    notFound();
  }

  const review = getCaseReviewSnapshot(detail.latestReview);
  const useCase = getUseCaseDefinition(detail.caseRecord.use_case_slug);

  return (
    <WorkspaceShell
      actions={[{ href: `/dashboard/cases/${caseId}`, label: "View case", variant: "outline" }]}
      description="This result is the saved review version for the current package state."
      eyebrow="Review Results"
      title={`${detail.caseRecord.title} review`}
    >
      {review ? (
        <CaseReviewResult
          caseId={caseId}
          caseTitle={detail.caseRecord.title}
          latestReviewedAt={detail.latestReview?.created_at ?? detail.caseRecord.latest_reviewed_at}
          latestReviewVersion={detail.latestReview?.version_number ?? detail.caseRecord.latest_review_version}
          review={review}
          reviewHistoryFacts={getReviewHistoryFacts(detail.reviewHistory)}
          showBookDemoCta
          sourceSurface="review-results-page"
          useCaseSlug={detail.caseRecord.use_case_slug}
          useCaseTitle={useCase?.shortTitle || detail.caseRecord.use_case_slug}
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>No review version yet</CardTitle>
            <CardDescription>The materials state has not been turned into a saved review output yet.</CardDescription>
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
              Return to materials
            </EventLink>
            <Link className={buttonVariants({ variant: "outline", size: "sm" })} href={`/dashboard/cases/${caseId}`}>
              View case detail
            </Link>
          </CardContent>
        </Card>
      )}
    </WorkspaceShell>
  );
}
