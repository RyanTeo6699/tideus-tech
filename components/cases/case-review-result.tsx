import type { CaseReviewResult as CaseReviewSnapshot } from "@/lib/case-review";
import { formatDocumentStatus, formatReadinessStatus } from "@/lib/case-workflows";
import { formatAppDateTime } from "@/lib/i18n/format";
import { getCurrentLocale } from "@/lib/i18n/server";
import { formatRiskSeverityLabel, getWorkspaceCopy } from "@/lib/i18n/workspace";
import { EventLink } from "@/components/site/event-link";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
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

export async function CaseReviewResult({
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
  const locale = await getCurrentLocale();
  const copy = getWorkspaceCopy(locale);
  const checklistReadyCount = review.checklist.filter((item) => item.status === "ready" || item.status === "not-applicable").length;
  const checklistNeedsWorkCount = review.checklist.length - checklistReadyCount;

  return (
    <div className="space-y-6">
      <Card className="border-emerald-200 bg-emerald-50/80 shadow-none">
        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <Badge variant="secondary" className="mb-4 w-fit">
              {formatReadinessStatus(review.readinessStatus, locale)}
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
              {copy.actions.updateMaterials}
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
              {copy.actions.exportSummary}
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
                预约演示
              </EventLink>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-lg leading-8 text-slate-900">{review.summary}</p>
          <div className="rounded-2xl border border-emerald-200 bg-white p-4 text-sm leading-6 text-slate-700">
            <p className="font-semibold uppercase tracking-[0.18em] text-emerald-800">{copy.review.readinessSummary}</p>
            <p className="mt-2">{review.readinessSummary}</p>
            <p className="mt-4 font-semibold uppercase tracking-[0.18em] text-emerald-800">{copy.review.timelineNote}</p>
            <p className="mt-2">{review.timelineNote}</p>
            {latestReviewedAt ? (
              <>
                <p className="mt-4 font-semibold uppercase tracking-[0.18em] text-emerald-800">{copy.review.latestReviewTimestamp}</p>
                <p className="mt-2">{formatAppDateTime(latestReviewedAt, locale)}</p>
              </>
            ) : null}
          </div>
          <div className="grid gap-3 sm:grid-cols-4">
            <SummaryPill label={copy.review.checklistReady} value={`${checklistReadyCount}/${review.checklist.length}`} />
            <SummaryPill label={copy.review.needsWork} value={checklistNeedsWorkCount.toString()} />
            <SummaryPill label={copy.review.missingItems} value={review.missingItems.length.toString()} />
            <SummaryPill label={copy.review.riskFlags} value={review.riskFlags.length.toString()} />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{copy.review.checklist}</CardTitle>
            <CardDescription>{copy.review.checklistDescription}</CardDescription>
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
                <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em]">{formatDocumentStatus(item.status, locale)}</p>
                <p className="mt-2">{item.detail}</p>
                {item.materialReference ? <p className="mt-2 text-slate-600">{`${copy.common.reference}：${item.materialReference}`}</p> : null}
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{copy.review.missingItems}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {review.missingItems.length === 0 ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-slate-900">
                  {copy.review.noMissing}
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
              <CardTitle>{copy.review.riskFlags}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {review.riskFlags.length === 0 ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-slate-900">
                  {copy.review.noRisk}
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
                    <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em]">{formatRiskSeverityLabel(item.severity, locale)}</p>
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
            <CardTitle>{copy.review.nextSteps}</CardTitle>
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
              <CardTitle>{copy.review.reviewHistory}</CardTitle>
              <CardDescription>{copy.review.reviewHistoryDescription}</CardDescription>
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
              <CardTitle>{copy.review.supportingContext}</CardTitle>
              <CardDescription>{copy.review.supportingContextDescription}</CardDescription>
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
                  {copy.review.noSupportingContext}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{copy.review.officialReferences}</CardTitle>
              <CardDescription>{copy.review.officialReferencesDescription}</CardDescription>
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
                  {copy.review.noOfficialReferences}
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
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p>
    </div>
  );
}
