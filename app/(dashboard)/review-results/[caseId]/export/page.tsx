import type { ReactNode } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { PrintReviewButton } from "@/components/cases/print-review-button";
import { EventLink } from "@/components/site/event-link";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buildCaseSnapshotFacts, getCaseDetail, getCaseMaterialStatusCounts, getCaseReviewSnapshot } from "@/lib/cases";
import { formatDocumentStatus, formatReadinessStatus, getUseCaseDefinition } from "@/lib/case-workflows";

type ReviewExportPageProps = {
  params: Promise<{
    caseId: string;
  }>;
};

export default async function ReviewExportPage({ params }: ReviewExportPageProps) {
  const { caseId } = await params;
  const detail = await getCaseDetail(caseId);

  if (!detail.user) {
    redirect(`/login?next=${encodeURIComponent(`/review-results/${caseId}/export`)}`);
  }

  if (!detail.caseRecord) {
    notFound();
  }

  const review = getCaseReviewSnapshot(detail.latestReview);

  if (!review) {
    redirect(`/review-results/${caseId}`);
  }

  const useCase = getUseCaseDefinition(detail.caseRecord.use_case_slug);
  const latestReviewedAt = detail.latestReview?.created_at ?? detail.caseRecord.latest_reviewed_at;
  const keyFacts = buildCaseSnapshotFacts(detail.caseRecord).slice(0, 6);
  const materialCounts = getCaseMaterialStatusCounts(detail.documents);
  const highRiskCount = review.riskFlags.filter((item) => item.severity === "high").length;
  const mediumRiskCount = review.riskFlags.filter((item) => item.severity === "medium").length;
  const lowRiskCount = review.riskFlags.filter((item) => item.severity === "low").length;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-950 print:bg-white">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 print:px-0 print:py-0">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between print:hidden">
          <div className="flex flex-wrap gap-3">
            <Link className={buttonVariants({ variant: "outline", size: "sm" })} href={`/review-results/${caseId}`}>
              Back to review
            </Link>
            <EventLink
              caseId={caseId}
              className={buttonVariants({ variant: "outline", size: "sm" })}
              eventType="book_demo_clicked"
              href="/book-demo"
              metadata={{
                sourceSurface: "review-export-page",
                useCase: detail.caseRecord.use_case_slug,
                readinessStatus: review.readinessStatus,
                reviewVersion: detail.latestReview?.version_number ?? detail.caseRecord.latest_review_version
              }}
            >
              Book demo
            </EventLink>
          </div>
          <PrintReviewButton />
        </div>

        <article className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-soft print:rounded-none print:border-0 print:p-0 print:shadow-none">
          <header className="border-b border-slate-200 pb-8">
            <Badge variant="secondary" className="mb-4 w-fit">
              Export-ready summary
            </Badge>
            <h1 className="font-serif text-4xl text-slate-950">{detail.caseRecord.title}</h1>
            <p className="mt-3 text-base leading-7 text-slate-600">{useCase?.shortTitle || detail.caseRecord.use_case_slug}</p>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
              Prepared from the latest saved Tideus review version as a handoff-style summary packet for later review,
              internal discussion, or a professional conversation.
            </p>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <FactCard label="Case type" value={useCase?.shortTitle || detail.caseRecord.use_case_slug} />
              <FactCard label="Readiness status" value={formatReadinessStatus(review.readinessStatus)} />
              <FactCard label="Latest review timestamp" value={latestReviewedAt ? formatDateTime(latestReviewedAt) : "Not available"} />
            </div>
          </header>

          <section className="mt-8 space-y-8">
            <Section title="Readiness snapshot">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm leading-7 text-slate-900">
                <p className="font-semibold">{review.readinessSummary}</p>
                <p className="mt-3">{review.summary}</p>
                <p className="mt-3 text-slate-700">{review.timelineNote}</p>
              </div>
            </Section>

            <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
              <Section title="Key case facts">
                <div className="grid gap-3 sm:grid-cols-2">
                  {keyFacts.map((item) => (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4" key={`${item.label}-${item.value}`}>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{item.label}</p>
                      <p className="mt-2 text-sm leading-6 text-slate-900">{item.value}</p>
                    </div>
                  ))}
                </div>
              </Section>

              <Section title="Packet summary">
                <div className="grid gap-3 sm:grid-cols-2">
                  <SummaryCard label="Case status" value={formatCaseStatusValue(detail.caseRecord.status)} />
                  <SummaryCard label="Saved review versions" value={detail.reviewHistory.length.toString()} />
                  <SummaryCard label="Required ready" value={`${materialCounts.requiredReady}/${materialCounts.requiredTotal}`} />
                  <SummaryCard label="Needs action" value={materialCounts.requiredActionCount.toString()} />
                </div>
              </Section>
            </div>

            <div className="grid gap-8 lg:grid-cols-2">
              <Section title="Checklist summary">
                <div className="grid gap-3 sm:grid-cols-2">
                  <SummaryCard label="Ready or n/a" value={(materialCounts.ready + materialCounts.notApplicable).toString()} />
                  <SummaryCard label="Collecting" value={materialCounts.collecting.toString()} />
                  <SummaryCard label="Needs refresh" value={materialCounts.needsRefresh.toString()} />
                  <SummaryCard label="Missing" value={materialCounts.missing.toString()} />
                </div>
              </Section>

              <Section title="Risk summary">
                <div className="grid gap-3 sm:grid-cols-3">
                  <SummaryCard label="High" value={highRiskCount.toString()} />
                  <SummaryCard label="Medium" value={mediumRiskCount.toString()} />
                  <SummaryCard label="Low" value={lowRiskCount.toString()} />
                </div>
              </Section>
            </div>

            <Section title="Checklist detail">
              <div className="space-y-3">
                {review.checklist.map((item) => (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6" key={item.key}>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <p className="font-semibold text-slate-950">{item.label}</p>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                        {formatDocumentStatus(item.status)}
                      </p>
                    </div>
                    <p className="mt-2 text-slate-700">{item.detail}</p>
                    {item.materialReference ? <p className="mt-2 text-slate-500">Reference: {item.materialReference}</p> : null}
                  </div>
                ))}
              </div>
            </Section>

            <div className="grid gap-8 lg:grid-cols-2">
              <Section title="Missing items">
                <div className="space-y-3">
                  {review.missingItems.length === 0 ? (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-slate-900">
                      No required items are currently marked missing.
                    </div>
                  ) : (
                    review.missingItems.map((item) => (
                      <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-slate-900" key={item}>
                        {item}
                      </div>
                    ))
                  )}
                </div>
              </Section>

              <Section title="Risk flags">
                <div className="space-y-3">
                  {review.riskFlags.length === 0 ? (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-slate-900">
                      No major risk flags are visible in this version.
                    </div>
                  ) : (
                    review.riskFlags.map((item) => (
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6" key={`${item.label}-${item.detail}`}>
                        <p className="font-semibold text-slate-950">{item.label}</p>
                        <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{item.severity}</p>
                        <p className="mt-2 text-slate-700">{item.detail}</p>
                      </div>
                    ))
                  )}
                </div>
              </Section>
            </div>

            <Section title="Next steps">
              <div className="space-y-3">
                {review.nextSteps.map((item) => (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-slate-900" key={item}>
                    {item}
                  </div>
                ))}
              </div>
            </Section>

            <Section title="Trust and use">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm leading-7 text-slate-700">
                This packet is a workflow summary for case preparation and discussion. Tideus is not a government service, law firm,
                or licensed representative. Use this summary to review the package later, organize the next evidence step, or bring
                a cleaner record into a professional conversation. It should support a discussion about the case, not replace legal
                advice or a formal filing review.
              </div>
            </Section>
          </section>

          <footer className="mt-10 border-t border-slate-200 pt-6 text-xs leading-6 text-slate-500">
            Generated from the latest saved review version in Tideus. Review timestamp:{" "}
            {latestReviewedAt ? formatDateTime(latestReviewedAt) : "Not available"}.
          </footer>
        </article>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function FactCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="border-slate-200 bg-slate-50 shadow-none">
      <CardHeader>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
        <CardTitle className="text-lg">{value}</CardTitle>
      </CardHeader>
      <CardContent />
    </Card>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-2 text-lg font-semibold text-slate-950">{value}</p>
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

function formatCaseStatusValue(value: string) {
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
