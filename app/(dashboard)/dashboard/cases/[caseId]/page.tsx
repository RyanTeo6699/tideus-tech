import { notFound, redirect } from "next/navigation";

import { CaseQuestionPanel } from "@/components/cases/case-question-panel";
import { CaseReviewResult } from "@/components/cases/case-review-result";
import { MaterialWorkspaceActions } from "@/components/cases/material-workspace-actions";
import { WorkspaceShell } from "@/components/dashboard/workspace-shell";
import { EventLink } from "@/components/site/event-link";
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
import { formatReadinessStatus, getUseCaseDefinition, type SupportedUseCaseSlug } from "@/lib/case-workflows";
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
  const materialSignals = materialInterpretation?.items.filter((item) => item.possibleIssues.length > 0).slice(0, 4) ?? [];
  const latestReviewedLabel = detail.caseRecord.latest_reviewed_at ? formatDateTime(detail.caseRecord.latest_reviewed_at) : "Not reviewed yet";
  const latestReadinessLabel = detail.caseRecord.latest_readiness_status
    ? formatReadinessStatus(detail.caseRecord.latest_readiness_status)
    : "Not reviewed yet";
  const latestReviewVersion = detail.latestReview?.version_number ?? detail.caseRecord.latest_review_version;

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
        <Card className="overflow-hidden border-emerald-200 bg-emerald-50/80 shadow-none">
          <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-800">Next recommended action</p>
              <CardTitle className="mt-3 text-3xl">{nextAction.label}</CardTitle>
              <CardDescription>
                This is the highest-leverage path for the current saved case state.
              </CardDescription>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <EventLink
                caseId={detail.caseRecord.id}
                className={buttonVariants({ size: "sm" })}
                eventType="dashboard_resume_clicked"
                href={nextAction.href}
                metadata={{
                  sourceSurface: "case-detail-next-action",
                  cta: "next-recommended-action",
                  useCase: detail.caseRecord.use_case_slug,
                  caseStatus: detail.caseRecord.status,
                  readinessStatus: detail.caseRecord.latest_readiness_status,
                  reviewVersion: latestReviewVersion
                }}
              >
                {nextAction.label}
              </EventLink>
              <EventLink
                caseId={detail.caseRecord.id}
                className={buttonVariants({ variant: "outline", size: "sm" })}
                eventType="dashboard_resume_clicked"
                href={buildCaseResumeHref(detail.caseRecord)}
                metadata={{
                  sourceSurface: "case-detail-header",
                  cta: "resume-case",
                  useCase: detail.caseRecord.use_case_slug,
                  caseStatus: detail.caseRecord.status,
                  readinessStatus: detail.caseRecord.latest_readiness_status,
                  reviewVersion: latestReviewVersion
                }}
              >
                Resume case
              </EventLink>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-[1.3fr_0.9fr_0.9fr_0.9fr]">
              <div className="rounded-2xl border border-white/80 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Why this action</p>
                <p className="mt-2 text-sm leading-6 text-slate-900">
                  {nextAction.description}
                </p>
              </div>
              <div className="rounded-2xl border border-white/80 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Latest review</p>
                <p className="mt-2 text-lg font-semibold text-slate-950">{latestReadinessLabel}</p>
                <p className="mt-1 text-xs text-slate-500">{latestReviewedLabel}</p>
              </div>
              <div className="rounded-2xl border border-white/80 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Materials action</p>
                <p className="mt-2 text-2xl font-semibold text-slate-950">{materialCounts.requiredActionCount}</p>
                <p className="mt-1 text-xs text-slate-500">required item{materialCounts.requiredActionCount === 1 ? "" : "s"} need work</p>
              </div>
              <div className="rounded-2xl border border-white/80 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Review history</p>
                <p className="mt-2 text-2xl font-semibold text-slate-950">{detail.reviewHistory.length}</p>
                <p className="mt-1 text-xs text-slate-500">saved version{detail.reviewHistory.length === 1 ? "" : "s"}</p>
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
                    {latestReviewedLabel}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Readiness state</p>
                  <p className="mt-2 text-sm leading-6 text-slate-900">
                    {latestReadinessLabel}
                  </p>
                </div>
              </div>
              {reviewHistoryFacts.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex flex-col gap-1">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Recent review versions</p>
                    <p className="text-sm leading-6 text-slate-600">
                      Latest saved version is listed first. Use this history to compare whether the package is improving between review passes.
                    </p>
                  </div>
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
                    <DeltaBlock title="Removed risks" items={reviewDelta.removedRisks} />
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
              <div className="rounded-2xl border border-slate-200 bg-slate-950 p-5 text-slate-50">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">Package state</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  {materialCounts.requiredReady} of {materialCounts.requiredTotal} required items are ready or not applicable.
                  {materialCounts.requiredActionCount > 0
                    ? ` ${materialCounts.requiredActionCount} required item${materialCounts.requiredActionCount === 1 ? "" : "s"} still need action before the next clean handoff.`
                    : " No required material gaps are visible in the current state."}
                </p>
              </div>
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
                          {item.possibleIssues.join(", ")}
                        </p>
                        <p className="mt-2 text-sm leading-6 text-slate-700">{item.suggestedNextAction}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>

        <MaterialWorkspaceActions
          caseId={caseId}
          documents={detail.documents.map((item) => ({
            id: item.id,
            label: item.label,
            status: item.status,
            required: item.required,
            fileName: item.file_name,
            materialReference: item.material_reference,
            notes: item.notes
          }))}
        />

        <CaseQuestionPanel
          caseId={caseId}
          caseTitle={detail.caseRecord.title}
          latestReviewSummary={detail.caseRecord.latest_review_summary}
          useCaseSlug={detail.caseRecord.use_case_slug as SupportedUseCaseSlug}
          useCaseTitle={useCase?.shortTitle || detail.caseRecord.use_case_slug}
        />

        {review ? (
          <CaseReviewResult
            caseId={caseId}
            caseTitle={detail.caseRecord.title}
            latestReviewedAt={detail.latestReview?.created_at ?? detail.caseRecord.latest_reviewed_at}
            latestReviewVersion={latestReviewVersion}
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

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-CA", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}
