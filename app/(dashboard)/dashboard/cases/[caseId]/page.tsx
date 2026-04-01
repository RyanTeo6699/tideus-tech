import { notFound, redirect } from "next/navigation";

import { CaseReviewResult } from "@/components/cases/case-review-result";
import { WorkspaceShell } from "@/components/dashboard/workspace-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  buildCaseFacts,
  buildCaseNotes,
  buildCaseResumeHref,
  buildCaseSnapshotFacts,
  getCaseDetail,
  getCaseReviewSnapshot,
  getReviewHistoryFacts
} from "@/lib/cases";
import { getUseCaseDefinition } from "@/lib/case-workflows";

type CaseDetailPageProps = {
  params: Promise<{
    caseId: string;
  }>;
};

export default async function CaseDetailPage({ params }: CaseDetailPageProps) {
  const { caseId } = await params;
  const detail = await getCaseDetail(caseId);

  if (!detail.user) {
    redirect(`/login?next=${encodeURIComponent(`/dashboard/cases/${caseId}`)}`);
  }

  if (!detail.caseRecord) {
    notFound();
  }

  const useCase = getUseCaseDefinition(detail.caseRecord.use_case_slug);
  const review = getCaseReviewSnapshot(detail.latestReview);

  return (
    <WorkspaceShell
      actions={[
        { href: "/dashboard/cases", label: "Back to cases", variant: "outline" },
        { href: buildCaseResumeHref(detail.caseRecord), label: review ? "Resume from review" : "Resume case" }
      ]}
      description="Use this page to review the saved intake, the current package state, and the review history."
      eyebrow="Case Detail"
      title={detail.caseRecord.title}
    >
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {buildCaseFacts(detail.caseRecord, detail.documents).map((fact) => (
            <Card className="border-slate-200 bg-slate-50 shadow-none" key={`${fact.label}-${fact.value}`}>
              <CardHeader>
                <CardDescription>{fact.label}</CardDescription>
                <CardTitle className="text-lg">{fact.value}</CardTitle>
              </CardHeader>
            </Card>
          ))}
        </div>

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
              <CardDescription>Complete the materials step to generate the first review output.</CardDescription>
            </CardHeader>
          </Card>
        )}

        <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
          <Card>
            <CardHeader>
              <CardTitle>Intake snapshot</CardTitle>
              <CardDescription>The saved intake facts stay visible here so the case can be reviewed in context.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              {buildCaseSnapshotFacts(detail.caseRecord).map((fact) => (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4" key={`${fact.label}-${fact.value}`}>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{fact.label}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-900">{fact.value}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Case notes</CardTitle>
              <CardDescription>These notes were saved from the intake and travel with the case record.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm leading-7 text-slate-700">
                {buildCaseNotes(detail.caseRecord)}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </WorkspaceShell>
  );
}
