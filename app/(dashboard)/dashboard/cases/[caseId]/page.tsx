import Link from "next/link";
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
  getCaseIntakeNormalizationSnapshot,
  getCaseMaterialInterpretationSnapshot,
  getCaseMaterialStatusCounts,
  getCaseNextAction,
  getCaseReviewDeltaSnapshot,
  getCaseReviewSnapshot,
  getReviewHistoryFacts
} from "@/lib/cases";
import { getUseCaseDefinition } from "@/lib/case-workflows";
import { buttonVariants } from "@/components/ui/button";

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
  const nextAction = getCaseNextAction(detail.caseRecord, detail.documents);
  const materialCounts = getCaseMaterialStatusCounts(detail.documents);
  const reviewHistoryFacts = getReviewHistoryFacts(detail.reviewHistory);
  const reviewDelta = getCaseReviewDeltaSnapshot(detail.latestReview);
  const materialInterpretation = getCaseMaterialInterpretationSnapshot(detail.caseRecord);
  const intakeNormalization = getCaseIntakeNormalizationSnapshot(detail.caseRecord);
  const materialSignals = materialInterpretation?.items.filter((item) => item.issueFlags.length > 0).slice(0, 4) ?? [];

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
        <Card className="border-emerald-200 bg-emerald-50/80 shadow-none">
          <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <CardTitle className="text-2xl">Next recommended action</CardTitle>
              <CardDescription>
                Keep the current case moving with the next high-leverage action, not with a generic workspace detour.
              </CardDescription>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link className={buttonVariants({ size: "sm" })} href={nextAction.href}>
                {nextAction.label}
              </Link>
              <Link className={buttonVariants({ variant: "outline", size: "sm" })} href={buildCaseResumeHref(detail.caseRecord)}>
                Resume case
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl border border-emerald-200 bg-white p-5 text-sm leading-7 text-slate-900">
              {nextAction.description}
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl border border-white/80 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Latest review state</p>
                <p className="mt-2 text-sm leading-6 text-slate-900">
                  {detail.caseRecord.latest_review_summary || "No saved review version yet. Generate the first review after the materials state is updated."}
                </p>
              </div>
              <div className="rounded-2xl border border-white/80 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Materials still needing work</p>
                <p className="mt-2 text-2xl font-semibold text-slate-950">{materialCounts.requiredActionCount}</p>
              </div>
              <div className="rounded-2xl border border-white/80 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Saved review versions</p>
                <p className="mt-2 text-2xl font-semibold text-slate-950">{detail.reviewHistory.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

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

        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <Card>
            <CardHeader>
              <CardTitle>Latest review snapshot</CardTitle>
              <CardDescription>
                Keep the latest review signal visible so the case can be resumed without rereading the entire file.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm leading-7 text-slate-700">
                {detail.caseRecord.latest_review_summary ||
                  "No saved review version yet. The intake is in place, but the package still needs a first review pass."}
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Review versions</p>
                  <p className="mt-2 text-sm leading-6 text-slate-900">
                    {detail.reviewHistory.length > 0 ? `${detail.reviewHistory.length} saved version${detail.reviewHistory.length === 1 ? "" : "s"}` : "No versions yet"}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Resume path</p>
                  <p className="mt-2 text-sm leading-6 text-slate-900">
                    {review ? "Return to materials if the package changed, or export the latest summary if it is ready." : "Continue to the materials step to generate the first review."}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Latest review timestamp</p>
                  <p className="mt-2 text-sm leading-6 text-slate-900">
                    {detail.caseRecord.latest_reviewed_at
                      ? new Intl.DateTimeFormat("en-CA", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "numeric",
                          minute: "2-digit"
                        }).format(new Date(detail.caseRecord.latest_reviewed_at))
                      : "Not reviewed yet"}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Readiness state</p>
                  <p className="mt-2 text-sm leading-6 text-slate-900">
                    {detail.caseRecord.latest_readiness_status
                      ? detail.caseRecord.latest_readiness_status
                          .split("-")
                          .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
                          .join(" ")
                      : "Not reviewed yet"}
                  </p>
                </div>
              </div>
              {reviewHistoryFacts.length > 0 ? (
                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Recent review versions</p>
                  <div className="grid gap-3 md:grid-cols-3">
                    {reviewHistoryFacts.slice(0, 3).map((item) => (
                      <div className="rounded-2xl border border-slate-200 bg-white p-4" key={`${item.label}-${item.value}`}>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{item.label}</p>
                        <p className="mt-2 text-sm leading-6 text-slate-900">{item.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
              {reviewDelta ? (
                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Review delta</p>
                  <div className="grid gap-3 md:grid-cols-2">
                    <DeltaBlock title="Improved areas" items={reviewDelta.improvedAreas} />
                    <DeltaBlock title="Remaining gaps" items={reviewDelta.remainingGaps} />
                    <DeltaBlock title="New risks" items={reviewDelta.newRisks} />
                    <DeltaBlock title="Priority actions" items={reviewDelta.priorityActions} />
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Materials state</CardTitle>
              <CardDescription>
                Scan the package state quickly before deciding whether the file needs another materials pass or a fresh review.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Required ready</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-950">
                    {materialCounts.requiredReady}/{materialCounts.requiredTotal}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Needs action</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-950">{materialCounts.requiredActionCount}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Collecting</p>
                  <p className="mt-2 text-lg font-semibold text-slate-950">{materialCounts.collecting}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Needs refresh</p>
                  <p className="mt-2 text-lg font-semibold text-slate-950">{materialCounts.needsRefresh}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Missing</p>
                  <p className="mt-2 text-lg font-semibold text-slate-950">{materialCounts.missing}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Ready or n/a</p>
                  <p className="mt-2 text-lg font-semibold text-slate-950">
                    {materialCounts.ready + materialCounts.notApplicable}
                  </p>
                </div>
              </div>
              {materialSignals.length > 0 ? (
                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Material interpretation signals</p>
                  <div className="space-y-3">
                    {materialSignals.map((item) => (
                      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-slate-900" key={item.documentId}>
                        <p className="font-semibold">{item.label}</p>
                        <p className="mt-2">{item.interpretationNote}</p>
                        <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-amber-800">
                          {item.issueFlags.join(", ")}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>

        {review ? (
          <CaseReviewResult
            caseId={caseId}
            caseTitle={detail.caseRecord.title}
            latestReviewedAt={detail.latestReview?.created_at ?? detail.caseRecord.latest_reviewed_at}
            review={review}
            reviewHistoryFacts={reviewHistoryFacts}
            sourceSurface="case-detail-page"
            useCaseSlug={detail.caseRecord.use_case_slug}
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
              {intakeNormalization && intakeNormalization.reviewNotes.length > 0 ? (
                <div className="mt-4 space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Structured intake signals</p>
                  {intakeNormalization.reviewNotes.slice(0, 3).map((item) => (
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-700" key={item}>
                      {item}
                    </div>
                  ))}
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </WorkspaceShell>
  );
}

function DeltaBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{title}</p>
      <div className="mt-3 space-y-2">
        {items.map((item) => (
          <p className="text-sm leading-6 text-slate-900" key={item}>
            {item}
          </p>
        ))}
      </div>
    </div>
  );
}
