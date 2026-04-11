import type { ReactNode } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { PrintReviewButton } from "@/components/cases/print-review-button";
import { ProfessionalReviewRequestCard } from "@/components/cases/professional-review-request-card";
import { EventLink } from "@/components/site/event-link";
import { PlanUpgradeCard } from "@/components/site/plan-upgrade-card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  buildCaseSnapshotFacts,
  getCaseDetail,
  getCaseHandoffIntelligenceSnapshot,
  getCaseMaterialStatusCounts,
  getCaseReviewSnapshot
} from "@/lib/cases";
import { getLatestClientHandoffRequestForCase } from "@/lib/server/handoffs";
import { formatCaseStatus } from "@/lib/case-state";
import { formatDocumentStatus, formatReadinessStatus, getUseCaseDefinition } from "@/lib/case-workflows";
import { formatAppDateTime } from "@/lib/i18n/format";
import { getCurrentLocale } from "@/lib/i18n/server";
import { formatRiskSeverityLabel, getWorkspaceCopy, pickLocale } from "@/lib/i18n/workspace";
import { hasConsumerPlanCapability } from "@/lib/plans";

type ReviewExportPageProps = {
  params: Promise<{
    caseId: string;
  }>;
};

export default async function ReviewExportPage({ params }: ReviewExportPageProps) {
  const { caseId } = await params;
  const detail = await getCaseDetail(caseId);
  const locale = await getCurrentLocale();
  const copy = getWorkspaceCopy(locale);

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

  const useCase = getUseCaseDefinition(detail.caseRecord.use_case_slug, locale);
  const latestReviewedAt = detail.latestReview?.created_at ?? detail.caseRecord.latest_reviewed_at;
  const handoffIntelligence = getCaseHandoffIntelligenceSnapshot(detail.latestReview);
  const keyFacts = buildCaseSnapshotFacts(detail.caseRecord, locale).slice(0, 6);
  const materialCounts = getCaseMaterialStatusCounts(detail.documents);
  const canUseHandoffIntelligence = hasConsumerPlanCapability(detail.profile, "handoff_intelligence");
  const latestHandoffRequest = await getLatestClientHandoffRequestForCase(caseId);
  const riskSummary = {
    high: review.riskFlags.filter((item) => item.severity === "high").length,
    medium: review.riskFlags.filter((item) => item.severity === "medium").length,
    low: review.riskFlags.filter((item) => item.severity === "low").length
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-950 print:bg-white">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 print:px-0 print:py-0">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between print:hidden">
          <div className="flex flex-wrap gap-3">
            <Link className={buttonVariants({ variant: "outline", size: "sm" })} href={`/review-results/${caseId}`}>
              {copy.actions.backToReview}
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
              {pickLocale(locale, "预约演示", "預約示範")}
            </EventLink>
          </div>
          <PrintReviewButton />
        </div>

        <article className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-soft print:rounded-none print:border-0 print:p-0 print:shadow-none">
          <header className="border-b border-slate-200 pb-8">
            <Badge variant="secondary" className="mb-4 w-fit">
              {copy.export.badge}
            </Badge>
            <h1 className="font-serif text-4xl text-slate-950">{detail.caseRecord.title}</h1>
            <p className="mt-3 text-base leading-7 text-slate-600">{useCase?.shortTitle || detail.caseRecord.use_case_slug}</p>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">{copy.export.preparedDescription}</p>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <FactCard label={copy.export.caseType} value={useCase?.shortTitle || detail.caseRecord.use_case_slug} />
              <FactCard label={copy.export.readinessStatus} value={formatReadinessStatus(review.readinessStatus, locale)} />
              <FactCard
                label={copy.export.latestReviewTimestamp}
                value={latestReviewedAt ? formatAppDateTime(latestReviewedAt, locale) : pickLocale(locale, "暂无", "暫無")}
              />
            </div>
          </header>

          <section className="mt-8 space-y-8">
            <ProfessionalReviewRequestCard caseId={caseId} initialHandoffRequest={latestHandoffRequest} />

            <Section title={copy.export.readinessSnapshot}>
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm leading-7 text-slate-900">
                <p className="font-semibold">{review.readinessSummary}</p>
                <p className="mt-3">{review.summary}</p>
                <p className="mt-3 text-slate-700">{review.timelineNote}</p>
              </div>
            </Section>

            {canUseHandoffIntelligence && handoffIntelligence ? (
              <Section title={copy.export.externalReviewSummary}>
                <div className="space-y-4">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm leading-7 text-slate-700">
                    <p className="font-semibold uppercase tracking-[0.18em] text-slate-500">{copy.export.reviewReadyStatus}</p>
                    <p className="mt-2 text-base font-semibold text-slate-950">
                      {formatReadinessStatus(handoffIntelligence.reviewReadyStatus, locale)}
                    </p>
                    <p className="mt-3">{handoffIntelligence.externalSummary}</p>
                  </div>
                  <div className="grid gap-4 lg:grid-cols-3">
                    <PacketList
                      empty={pickLocale(locale, "暂无内容", "暫無內容")}
                      items={handoffIntelligence.issuesNeedingHumanReview}
                      title={copy.export.humanReviewIssues}
                    />
                    <PacketList
                      empty={pickLocale(locale, "暂无内容", "暫無內容")}
                      items={handoffIntelligence.escalationTriggers}
                      title={copy.export.escalationTriggers}
                    />
                    <PacketList
                      empty={pickLocale(locale, "暂无内容", "暫無內容")}
                      items={handoffIntelligence.supportingNotes}
                      title={copy.export.supportingNotes}
                    />
                  </div>
                </div>
              </Section>
            ) : !canUseHandoffIntelligence ? (
              <PlanUpgradeCard
                capability="handoff_intelligence"
                caseId={caseId}
                className="print:hidden"
                locale={locale}
                sourceSurface="review-export-handoff-intelligence"
                useCase={detail.caseRecord.use_case_slug}
              />
            ) : null}

            <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
              <Section title={copy.export.keyFacts}>
                <div className="grid gap-3 sm:grid-cols-2">
                  {keyFacts.map((item) => (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4" key={`${item.label}-${item.value}`}>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{item.label}</p>
                      <p className="mt-2 text-sm leading-6 text-slate-900">{item.value}</p>
                    </div>
                  ))}
                </div>
              </Section>

              <Section title={copy.export.packetSummary}>
                <div className="grid gap-3 sm:grid-cols-2">
                  <SummaryCard label={copy.cases.caseStatus} value={formatCaseStatus(detail.caseRecord.status, locale)} />
                  <SummaryCard label={pickLocale(locale, "已保存审查版本", "已儲存審查版本")} value={detail.reviewHistory.length.toString()} />
                  <SummaryCard label={pickLocale(locale, "必需项已就绪", "必需項已就緒")} value={`${materialCounts.requiredReady}/${materialCounts.requiredTotal}`} />
                  <SummaryCard label={pickLocale(locale, "仍需处理", "仍需處理")} value={materialCounts.requiredActionCount.toString()} />
                </div>
              </Section>
            </div>

            <div className="grid gap-8 lg:grid-cols-2">
              <Section title={copy.export.checklistSummary}>
                <div className="grid gap-3 sm:grid-cols-2">
                  <SummaryCard label={pickLocale(locale, "已就绪或不适用", "已就緒或不適用")} value={(materialCounts.ready + materialCounts.notApplicable).toString()} />
                  <SummaryCard label={pickLocale(locale, "收集中", "收集中")} value={materialCounts.collecting.toString()} />
                  <SummaryCard label={pickLocale(locale, "需刷新", "需更新")} value={materialCounts.needsRefresh.toString()} />
                  <SummaryCard label={pickLocale(locale, "缺失", "缺失")} value={materialCounts.missing.toString()} />
                </div>
              </Section>

              <Section title={copy.export.riskSummary}>
                <div className="grid gap-3 sm:grid-cols-3">
                  <SummaryCard label={pickLocale(locale, "高", "高")} value={riskSummary.high.toString()} />
                  <SummaryCard label={pickLocale(locale, "中", "中")} value={riskSummary.medium.toString()} />
                  <SummaryCard label={pickLocale(locale, "低", "低")} value={riskSummary.low.toString()} />
                </div>
              </Section>
            </div>

            <Section title={copy.export.checklistDetail}>
              <div className="space-y-3">
                {review.checklist.map((item) => (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6" key={item.key}>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <p className="font-semibold text-slate-950">{item.label}</p>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                        {formatDocumentStatus(item.status, locale)}
                      </p>
                    </div>
                    <p className="mt-2 text-slate-700">{item.detail}</p>
                    {item.materialReference ? <p className="mt-2 text-slate-500">{`${copy.common.reference}：${item.materialReference}`}</p> : null}
                  </div>
                ))}
              </div>
            </Section>

            <div className="grid gap-8 lg:grid-cols-2">
              <Section title={copy.review.missingItems}>
                <div className="space-y-3">
                  {review.missingItems.length === 0 ? (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-slate-900">
                      {copy.export.noMissing}
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

              <Section title={copy.review.riskFlags}>
                <div className="space-y-3">
                  {review.riskFlags.length === 0 ? (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-slate-900">
                      {copy.export.noRisk}
                    </div>
                  ) : (
                    review.riskFlags.map((item) => (
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6" key={`${item.label}-${item.detail}`}>
                        <p className="font-semibold text-slate-950">{item.label}</p>
                        <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{formatRiskSeverityLabel(item.severity, locale)}</p>
                        <p className="mt-2 text-slate-700">{item.detail}</p>
                      </div>
                    ))
                  )}
                </div>
              </Section>
            </div>

            <Section title={copy.export.nextSteps}>
              <div className="space-y-3">
                {review.nextSteps.map((item) => (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-slate-900" key={item}>
                    {item}
                  </div>
                ))}
              </div>
            </Section>

            <div className="grid gap-8 lg:grid-cols-2">
              <Section title={copy.export.supportingContextNotes}>
                <div className="space-y-3">
                  {review.supportingContextNotes.length > 0 ? (
                    review.supportingContextNotes.map((item) => (
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700" key={item}>
                        {item}
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                      {copy.export.noSupportingContext}
                    </div>
                  )}
                </div>
              </Section>

              <Section title={copy.export.officialReferenceLabels}>
                <div className="space-y-3">
                  {review.officialReferenceLabels.length > 0 ? (
                    review.officialReferenceLabels.map((item) => (
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700" key={item}>
                        {item}
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                      {copy.export.noOfficialReferences}
                    </div>
                  )}
                </div>
              </Section>
            </div>

            <Card className="border-slate-200 bg-slate-50 shadow-none">
              <CardHeader>
                <CardTitle>{copy.export.trustFooterTitle}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm leading-7 text-slate-700">{copy.export.trustFooterBody}</CardContent>
            </Card>
          </section>
        </article>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function FactCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-2 text-sm leading-6 text-slate-950">{value}</p>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function PacketList({ title, items, empty }: { title: string; items: string[]; empty: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{title}</p>
      <div className="mt-2 space-y-2">
        {items.length > 0 ? (
          items.map((item) => (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700" key={item}>
              {item}
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">{empty}</div>
        )}
      </div>
    </div>
  );
}
