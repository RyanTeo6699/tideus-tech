import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { CaseReviewResult } from "@/components/cases/case-review-result";
import { WorkspaceShell } from "@/components/dashboard/workspace-shell";
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
  const detail = await getCaseDetail(caseId);

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
      actions={[
        { href: `/upload-materials/${caseId}`, label: "Back to materials", variant: "outline" },
        { href: "/dashboard/cases", label: "Back to cases", variant: "outline" }
      ]}
      description="This result is the saved review version for the current package state."
      eyebrow="Review Results"
      title={`${detail.caseRecord.title} review`}
    >
      {review ? (
        <CaseReviewResult
          caseId={caseId}
          caseTitle={detail.caseRecord.title}
          review={review}
          reviewHistoryFacts={getReviewHistoryFacts(detail.reviewHistory)}
          useCaseTitle={useCase?.shortTitle || detail.caseRecord.use_case_slug}
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>No review version yet</CardTitle>
            <CardDescription>The materials state has not been turned into a saved review output yet.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row">
            <Link className={buttonVariants({ size: "sm" })} href={`/upload-materials/${caseId}`}>
              Return to materials
            </Link>
            <Link className={buttonVariants({ variant: "outline", size: "sm" })} href={`/dashboard/cases/${caseId}`}>
              View case detail
            </Link>
          </CardContent>
        </Card>
      )}
    </WorkspaceShell>
  );
}
