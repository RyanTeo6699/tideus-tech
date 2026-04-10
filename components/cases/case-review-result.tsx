import type { CaseReviewResult as CaseReviewSnapshot } from "@/lib/case-review";
import { formatDocumentStatus, formatReadinessStatus } from "@/lib/case-workflows";
import { EventLink } from "@/components/site/event-link";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type ReviewHistoryFact = {
  label: string;
  value: string;
};

type CaseReviewResultProps = {
  caseId: string;
  caseTitle: string;
  useCaseTitle: string;
  useCaseSlug: string;
  sourceSurface: string;
  review: CaseReviewSnapshot;
  reviewHistoryFacts?: ReviewHistoryFact[];
  latestReviewedAt?: string | null;
  latestReviewVersion?: number | null;
  showBookDemoCta?: boolean;
};

export function CaseReviewResult({
  caseId,
  caseTitle,
  useCaseTitle,
  useCaseSlug,
  sourceSurface,
  review,
  reviewHistoryFacts = [],
  latestReviewedAt = null,
  latestReviewVersion = null,
  showBookDemoCta = false
}: CaseReviewResultProps) {
  const checklistReadyCount = review.checklist.filter((item) => item.status === "ready" || item.status === "not-applicable").length;
  const checklistNeedsWorkCount = review.checklist.length - checklistReadyCount;

  return (
    <div className="space-y-6">
      <Card className="border-emerald-200 bg-emerald-50/80 shadow-none">
        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <Badge variant="secondary" className="mb-4 w-fit">
              {formatReadinessStatus(review.readinessStatus)}
            </Badge>
            <CardTitle className="text-3xl">{caseTitle}</CardTitle>
            <CardDescription>{useCaseTitle}</CardDescription>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <EventLink
              caseId={caseId}
              className={buttonVariants({ size: "sm" })}
              eventType="review_cta_clicked"
              href={`/upload-materials/${caseId}`}
              metadata={{
                sourceSurface,
                cta: "update-materials",
                useCase: useCaseSlug,
                readinessStatus: review.readinessStatus,
                reviewVersion: latestReviewVersion
              }}
            >
              Update materials
            </EventLink>
            <EventLink
              caseId={caseId}
              className={buttonVariants({ variant: "outline", size: "sm" })}
              eventType="export_clicked"
              href={`/review-results/${caseId}/export`}
              metadata={{
                sourceSurface,
                useCase: useCaseSlug,
                readinessStatus: review.readinessStatus,
                reviewVersion: latestReviewVersion,
                missingItemCount: review.missingItems.length,
                riskCount: review.riskFlags.length
              }}
            >
              Export summary
            </EventLink>
            {showBookDemoCta ? (
              <EventLink
                caseId={caseId}
                className={buttonVariants({ variant: "outline", size: "sm" })}
                eventType="book_demo_clicked"
                href="/book-demo"
                metadata={{
                  sourceSurface,
                  useCase: useCaseSlug,
                  readinessStatus: review.readinessStatus,
                  reviewVersion: latestReviewVersion
                }}
              >
                Book demo
              </EventLink>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-lg leading-8 text-slate-900">{review.summary}</p>
          <div className="rounded-2xl border border-emerald-200 bg-white p-4 text-sm leading-6 text-slate-700">
            <p className="font-semibold uppercase tracking-[0.18em] text-emerald-800">Readiness summary</p>
            <p className="mt-2">{review.readinessSummary}</p>
            <p className="mt-4 font-semibold uppercase tracking-[0.18em] text-emerald-800">Timeline note</p>
            <p className="mt-2">{review.timelineNote}</p>
            {latestReviewedAt ? (
              <>
                <p className="mt-4 font-semibold uppercase tracking-[0.18em] text-emerald-800">Latest review timestamp</p>
                <p className="mt-2">{formatDateTime(latestReviewedAt)}</p>
              </>
            ) : null}
          </div>
          <div className="grid gap-3 sm:grid-cols-4">
            <SummaryPill label="Checklist ready" value={`${checklistReadyCount}/${review.checklist.length}`} />
            <SummaryPill label="Needs work" value={checklistNeedsWorkCount.toString()} />
            <SummaryPill label="Missing items" value={review.missingItems.length.toString()} />
            <SummaryPill label="Risk flags" value={review.riskFlags.length.toString()} />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Checklist</CardTitle>
            <CardDescription>The package state stays visible so the next review pass starts from facts, not memory.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {review.checklist.map((item) => (
              <div
                className={cn("rounded-2xl border p-4 text-sm leading-6", {
                  "border-emerald-200 bg-emerald-50 text-slate-900": item.status === "ready" || item.status === "not-applicable",
                  "border-amber-200 bg-amber-50 text-slate-900": item.status === "needs-refresh" || item.status === "collecting",
                  "border-red-200 bg-red-50 text-slate-900": item.status === "missing"
                })}
                key={item.key}
              >
                <p className="font-semibold">{item.label}</p>
                <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em]">{formatDocumentStatus(item.status)}</p>
                <p className="mt-2">{item.detail}</p>
                {item.materialReference ? <p className="mt-2 text-slate-600">Reference: {item.materialReference}</p> : null}
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Missing items</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {review.missingItems.length === 0 ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-slate-900">
                  No required materials are currently marked missing.
                </div>
              ) : (
                review.missingItems.map((item) => (
                  <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-slate-900" key={item}>
                    {item}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Risk flags</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {review.riskFlags.length === 0 ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-slate-900">
                  No major risk flags are visible in the current version.
                </div>
              ) : (
                review.riskFlags.map((item) => (
                  <div
                    className={cn("rounded-2xl border p-4 text-sm leading-6", {
                      "border-red-200 bg-red-50 text-slate-900": item.severity === "high",
                      "border-amber-200 bg-amber-50 text-slate-900": item.severity === "medium",
                      "border-slate-200 bg-slate-50 text-slate-900": item.severity === "low"
                    })}
                    key={`${item.label}-${item.detail}`}
                  >
                    <p className="font-semibold">{item.label}</p>
                    <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em]">{item.severity}</p>
                    <p className="mt-2">{item.detail}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Next steps</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {review.nextSteps.map((item) => (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-slate-900" key={item}>
                {item}
              </div>
            ))}
          </CardContent>
        </Card>

        {reviewHistoryFacts.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Review history</CardTitle>
              <CardDescription>Each generated pass is saved as a version so the case history stays reviewable.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {reviewHistoryFacts.map((item) => (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4" key={`${item.label}-${item.value}`}>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{item.label}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-900">{item.value}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        ) : null}
      </div>

      {review.supportingContextNotes.length > 0 || review.officialReferenceLabels.length > 0 ? (
        <div className="grid gap-6 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Supporting context</CardTitle>
              <CardDescription>Internal knowledge notes used to sharpen the structured review.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {review.supportingContextNotes.length > 0 ? (
                review.supportingContextNotes.map((item) => (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700" key={item}>
                    {item}
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                  No supporting context notes were stored for this version.
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Official context references</CardTitle>
              <CardDescription>Reference labels retained for traceability, not as a public data portal.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {review.officialReferenceLabels.length > 0 ? (
                review.officialReferenceLabels.map((item) => (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700" key={item}>
                    {item}
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                  No official reference labels were stored for this version.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}

function SummaryPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-emerald-200 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-800">{label}</p>
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
