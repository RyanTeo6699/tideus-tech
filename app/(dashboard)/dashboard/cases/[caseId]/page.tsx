import { notFound, redirect } from "next/navigation";
import Link from "next/link";

import { CaseQuestionPanel } from "@/components/cases/case-question-panel";
import { CaseReviewResult } from "@/components/cases/case-review-result";
import { MaterialWorkspaceActions } from "@/components/cases/material-workspace-actions";
import { WorkspaceShell } from "@/components/dashboard/workspace-shell";
import { EventLink } from "@/components/site/event-link";
import { PlanUpgradeCard } from "@/components/site/plan-upgrade-card";
import { buttonVariants } from "@/components/ui/button";
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
import { formatCaseStatus } from "@/lib/case-state";
import { formatReadinessStatus, getUseCaseDefinition, type SupportedUseCaseSlug } from "@/lib/case-workflows";
import { formatAppDateTime } from "@/lib/i18n/format";
import { getCurrentLocale } from "@/lib/i18n/server";
import { getWorkspaceCopy, pickLocale } from "@/lib/i18n/workspace";
import { hasConsumerPlanCapability } from "@/lib/plans";

type CaseDetailPageProps = {
  params: Promise<{
    caseId: string;
  }>;
};

export default async function CaseDetailPage({ params }: CaseDetailPageProps) {
  const { caseId } = await params;
  const detail = await getCaseDetail(caseId);
  const locale = await getCurrentLocale();
  const copy = getWorkspaceCopy(locale);

  if (!detail.user) {
    redirect(`/login?next=${encodeURIComponent(`/dashboard/cases/${caseId}`)}`);
  }

  if (!detail.caseRecord) {
    notFound();
  }

  const useCase = getUseCaseDefinition(detail.caseRecord.use_case_slug, locale);
  const review = getCaseReviewSnapshot(detail.latestReview);
  const nextAction = getCaseNextAction(detail.caseRecord, detail.documents, locale);
  const materialCounts = getCaseMaterialStatusCounts(detail.documents);
  const reviewHistoryFacts = getReviewHistoryFacts(detail.reviewHistory, locale);
  const reviewDelta = getCaseReviewDeltaSnapshot(detail.latestReview, locale);
  const materialInterpretation = getCaseMaterialInterpretationSnapshot(detail.caseRecord, locale);
  const intakeNormalization = getCaseIntakeNormalizationSnapshot(detail.caseRecord);
  const materialSignals = materialInterpretation?.items.filter((item) => item.possibleIssues.length > 0).slice(0, 4) ?? [];
  const latestReviewedLabel = detail.caseRecord.latest_reviewed_at
    ? formatAppDateTime(detail.caseRecord.latest_reviewed_at, locale)
    : copy.common.noReviewYet;
  const latestReadinessLabel = detail.caseRecord.latest_readiness_status
    ? formatReadinessStatus(detail.caseRecord.latest_readiness_status, locale)
    : copy.common.noReviewYet;
  const latestReviewVersion = detail.latestReview?.version_number ?? detail.caseRecord.latest_review_version;
  const canUseWorkspaceQuestions = hasConsumerPlanCapability(detail.profile, "workspace_case_questions");
  const canUseMaterialActions = hasConsumerPlanCapability(detail.profile, "workspace_material_actions");
  const canUseReviewDelta = hasConsumerPlanCapability(detail.profile, "review_delta");
  const missingItemCount = review?.missingItems.length ?? 0;
  const riskFlagCount = review?.riskFlags.length ?? 0;

  return (
    <WorkspaceShell
      actions={[
        { href: "/dashboard/cases", label: copy.actions.backToCases, variant: "outline" },
        { href: buildCaseResumeHref(detail.caseRecord), label: review ? copy.actions.resumeFromReview : copy.actions.resumeCase }
      ]}
      description={pickLocale(locale, "在这里查看已保存的资料收集、当前材料包状态与审查历史。", "在這裡查看已儲存的資料收集、目前材料包狀態與審查歷史。")}
      eyebrow={copy.shell.caseDetailEyebrow}
      title={detail.caseRecord.title}
    >
      <div className="space-y-6">
        <Card className="overflow-hidden border-emerald-200 bg-emerald-50/80 shadow-none">
          <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-800">
                {pickLocale(locale, "下一条推荐动作", "下一條推薦動作")}
              </p>
              <CardTitle className="mt-3 text-3xl">{nextAction.label}</CardTitle>
              <CardDescription>
                {pickLocale(locale, "这是当前保存案件状态下最值得优先处理的路径。", "這是目前儲存案件狀態下最值得優先處理的路徑。")}
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
                {copy.actions.resumeCase}
              </EventLink>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-[1.3fr_0.9fr_0.9fr_0.9fr]">
              <InfoCard
                label={pickLocale(locale, "为什么推荐这一步", "為什麼推薦這一步")}
                value={nextAction.description}
              />
              <InfoCard label={pickLocale(locale, "最新审查", "最新審查")} value={`${latestReadinessLabel}\n${latestReviewedLabel}`} />
              <InfoCard
                label={pickLocale(locale, "材料待处理", "材料待處理")}
                value={pickLocale(
                  locale,
                  `${materialCounts.requiredActionCount} 个必需项目仍需处理`,
                  `${materialCounts.requiredActionCount} 個必需項目仍需處理`
                )}
              />
              <InfoCard
                label={pickLocale(locale, "审查历史", "審查歷史")}
                value={pickLocale(
                  locale,
                  `已保存 ${detail.reviewHistory.length} 个版本`,
                  `已儲存 ${detail.reviewHistory.length} 個版本`
                )}
              />
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <WorkspaceSignal
            actionHref={buildCaseResumeHref(detail.caseRecord)}
            actionLabel="继续处理"
            label="案件 / 任务"
            value={detail.caseRecord.title}
          />
          <WorkspaceSignal
            actionHref="/dashboard/cases"
            actionLabel="查看全部"
            label="当前状态"
            value={formatCaseStatus(detail.caseRecord.status, "zh-CN")}
          />
          <WorkspaceSignal
            actionHref={`/upload-materials/${caseId}`}
            actionLabel="更新材料"
            label="材料摘要"
            value={`${materialCounts.requiredReady}/${materialCounts.requiredTotal} 个必需项已就绪，${materialCounts.requiredActionCount} 个仍需处理`}
          />
          <WorkspaceSignal
            actionHref={review ? `/review-results/${caseId}/export` : `/upload-materials/${caseId}`}
            actionLabel={review ? "导出 / 交接" : "先生成审查"}
            label="最新审查"
            value={review ? `${latestReadinessLabel}，${missingItemCount} 个缺失项，${riskFlagCount} 个风险标记` : "还没有审查"}
          />
          <WorkspaceSignal
            actionHref={`/dashboard/cases/${caseId}#missing-and-risks`}
            actionLabel="查看详情"
            label="缺失项"
            value={`${missingItemCount} 个`}
          />
          <WorkspaceSignal
            actionHref={`/dashboard/cases/${caseId}#missing-and-risks`}
            actionLabel="查看详情"
            label="风险标记"
            value={`${riskFlagCount} 个`}
          />
          <WorkspaceSignal
            actionHref={`/dashboard/cases/${caseId}#review-history`}
            actionLabel="查看历史"
            label="审查历史"
            value={`已保存 ${detail.reviewHistory.length} 个版本`}
          />
          <WorkspaceSignal
            actionHref={`/dashboard/cases/${caseId}#case-ai-panel`}
            actionLabel="问 AI"
            label="下一步"
            value={nextAction.label}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {buildCaseFacts(detail.caseRecord, detail.documents, locale).map((fact) => (
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
              <CardTitle>{pickLocale(locale, "最新审查快照", "最新審查快照")}</CardTitle>
              <CardDescription>
                {pickLocale(locale, "让最新审查信号始终可见，恢复案件时无需重新读完整个文件。", "讓最新審查訊號始終可見，恢復案件時無需重新讀完整個檔案。")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm leading-7 text-slate-700">
                {detail.caseRecord.latest_review_summary ||
                  pickLocale(locale, "还没有保存的审查版本。资料收集已就位，但材料包仍需要完成第一轮审查。", "還沒有儲存的審查版本。資料收集已就位，但材料包仍需要完成第一輪審查。")}
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <InfoCard
                  label={pickLocale(locale, "审查版本数", "審查版本數")}
                  value={
                    detail.reviewHistory.length > 0
                      ? pickLocale(locale, `已保存 ${detail.reviewHistory.length} 个版本`, `已儲存 ${detail.reviewHistory.length} 個版本`)
                      : copy.common.noVersionYet
                  }
                />
                <InfoCard
                  label={pickLocale(locale, "继续路径", "繼續路徑")}
                  value={
                    review
                      ? pickLocale(locale, "如果材料包已变化，返回材料页；如果当前版本已足够清晰，则直接导出摘要。", "如果材料包已變化，返回材料頁；如果目前版本已足夠清晰，則直接匯出摘要。")
                      : pickLocale(locale, "先完成材料页，再生成第一版结构化审查。", "先完成材料頁，再生成第一版結構化審查。")
                  }
                />
                <InfoCard label={copy.review.latestReviewTimestamp} value={latestReviewedLabel} />
                <InfoCard label={pickLocale(locale, "就绪状态", "就緒狀態")} value={latestReadinessLabel} />
              </div>

              {reviewHistoryFacts.length > 0 ? (
                <div className="space-y-3" id="review-history">
                  <div className="flex flex-col gap-1">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{pickLocale(locale, "最近审查版本", "最近審查版本")}</p>
                    <p className="text-sm leading-6 text-slate-600">
                      {pickLocale(locale, "最新保存的版本排在最前，可用来快速比较案件是否在持续改善。", "最新儲存的版本排在最前，可用來快速比較案件是否在持續改善。")}
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

              {canUseReviewDelta ? (
                reviewDelta ? (
                  <div className="space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{pickLocale(locale, "审查变化对比", "審查變化對比")}</p>
                    <div className="grid gap-3 md:grid-cols-2">
                      <DeltaBlock locale={locale} items={reviewDelta.improvedAreas} title={pickLocale(locale, "改善点", "改善點")} />
                      <DeltaBlock locale={locale} items={reviewDelta.remainingGaps} title={pickLocale(locale, "仍存缺口", "仍存缺口")} />
                      <DeltaBlock locale={locale} items={reviewDelta.newRisks} title={pickLocale(locale, "新增风险", "新增風險")} />
                      <DeltaBlock locale={locale} items={reviewDelta.removedRisks} title={pickLocale(locale, "已消失风险", "已消失風險")} />
                      <DeltaBlock locale={locale} items={reviewDelta.priorityActions} title={pickLocale(locale, "优先动作", "優先動作")} />
                    </div>
                  </div>
                ) : null
              ) : review ? (
                <PlanUpgradeCard
                  capability="review_delta"
                  caseId={caseId}
                  locale={locale}
                  sourceSurface="case-detail-review-delta"
                  useCase={detail.caseRecord.use_case_slug}
                />
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{pickLocale(locale, "材料状态", "材料狀態")}</CardTitle>
              <CardDescription>
                {pickLocale(locale, "快速扫描材料包状态，再决定是否需要回到材料页或重新生成审查。", "快速掃描材料包狀態，再決定是否需要回到材料頁或重新生成審查。")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-950 p-5 text-slate-50">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">{pickLocale(locale, "材料包状态", "材料包狀態")}</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  {pickLocale(
                    locale,
                    `${materialCounts.requiredReady} / ${materialCounts.requiredTotal} 个必需项目已就绪或不适用。`,
                    `${materialCounts.requiredReady} / ${materialCounts.requiredTotal} 個必需項目已就緒或不適用。`
                  )}{" "}
                  {materialCounts.requiredActionCount > 0
                    ? pickLocale(
                        locale,
                        `仍有 ${materialCounts.requiredActionCount} 个必需项目需要处理后，才能进入下一次干净交接。`,
                        `仍有 ${materialCounts.requiredActionCount} 個必需項目需要處理後，才能進入下一次乾淨交接。`
                      )
                    : pickLocale(locale, "当前没有明显的必需材料缺口。", "目前沒有明顯的必需材料缺口。")}
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <InfoCard label={pickLocale(locale, "必需项已就绪", "必需項已就緒")} value={`${materialCounts.requiredReady}/${materialCounts.requiredTotal}`} />
                <InfoCard label={pickLocale(locale, "仍需处理", "仍需處理")} value={materialCounts.requiredActionCount.toString()} />
                <InfoCard label={pickLocale(locale, "收集中", "收集中")} value={materialCounts.collecting.toString()} />
                <InfoCard label={pickLocale(locale, "需刷新", "需更新")} value={materialCounts.needsRefresh.toString()} />
                <InfoCard label={pickLocale(locale, "缺失", "缺失")} value={materialCounts.missing.toString()} />
                <InfoCard label={pickLocale(locale, "已就绪或不适用", "已就緒或不適用")} value={(materialCounts.ready + materialCounts.notApplicable).toString()} />
              </div>

              {materialSignals.length > 0 ? (
                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{pickLocale(locale, "材料解释信号", "材料解讀訊號")}</p>
                  <div className="space-y-3">
                    {materialSignals.map((item) => (
                      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-slate-900" key={item.documentId}>
                        <p className="font-semibold">{item.label}</p>
                        <p className="mt-2">{item.interpretationNote}</p>
                        <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-amber-800">
                          {item.possibleIssues.join("，")}
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

        {canUseMaterialActions ? (
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
        ) : (
          <PlanUpgradeCard
            capability="workspace_material_actions"
            caseId={caseId}
            locale={locale}
            sourceSurface="case-detail-material-actions"
            useCase={detail.caseRecord.use_case_slug}
          />
        )}

        <div id="case-ai-panel">
          {canUseWorkspaceQuestions ? (
            <CaseQuestionPanel
              caseId={caseId}
              caseTitle={detail.caseRecord.title}
              latestReviewSummary={detail.caseRecord.latest_review_summary}
              useCaseSlug={detail.caseRecord.use_case_slug as SupportedUseCaseSlug}
              useCaseTitle={useCase?.shortTitle || detail.caseRecord.use_case_slug}
            />
          ) : (
            <PlanUpgradeCard
              capability="workspace_case_questions"
              caseId={caseId}
              locale={locale}
              sourceSurface="case-detail-case-question"
              useCase={detail.caseRecord.use_case_slug}
            />
          )}
        </div>

        <div id="missing-and-risks">
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
                <CardTitle>{copy.common.noReviewYet}</CardTitle>
                <CardDescription>{pickLocale(locale, "完成材料页后即可生成第一版审查输出。", "完成材料頁後即可生成第一版審查輸出。")}</CardDescription>
              </CardHeader>
            </Card>
          )}
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
          <Card>
            <CardHeader>
              <CardTitle>{pickLocale(locale, "资料收集快照", "資料收集快照")}</CardTitle>
              <CardDescription>{pickLocale(locale, "保存的资料收集事实会一直显示在这里，方便在完整脉络中审阅案件。", "儲存的資料收集事實會一直顯示在這裡，方便在完整脈絡中審閱案件。")}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              {buildCaseSnapshotFacts(detail.caseRecord, locale).map((fact) => (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4" key={`${fact.label}-${fact.value}`}>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{fact.label}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-900">{fact.value}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{pickLocale(locale, "案件备注", "案件備註")}</CardTitle>
              <CardDescription>{pickLocale(locale, "这些备注来自资料收集，并会随案件记录一起保留。", "這些備註來自資料收集，並會隨案件記錄一起保留。")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm leading-7 text-slate-700">
                {buildCaseNotes(detail.caseRecord, locale)}
              </div>
              {intakeNormalization && intakeNormalization.reviewNotes.length > 0 ? (
                <div className="mt-4 space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{pickLocale(locale, "结构化资料收集信号", "結構化資料收集訊號")}</p>
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

function WorkspaceSignal({
  label,
  value,
  actionHref,
  actionLabel
}: {
  label: string;
  value: string;
  actionHref: string;
  actionLabel: string;
}) {
  return (
    <Card className="border-slate-200 bg-white shadow-none">
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-lg">{value}</CardTitle>
      </CardHeader>
      <CardContent>
        <Link className="text-sm font-semibold text-slate-950 underline underline-offset-4" href={actionHref}>
          {actionLabel}
        </Link>
      </CardContent>
    </Card>
  );
}

function DeltaBlock({ title, items, locale }: { title: string; items: string[]; locale: "zh-CN" | "zh-TW" }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{title}</p>
      <div className="mt-3 space-y-2">
        {items.length > 0 ? (
          items.map((item) => (
            <p className="text-sm leading-6 text-slate-900" key={item}>
              {item}
            </p>
          ))
        ) : (
          <p className="text-sm leading-6 text-slate-600">{pickLocale(locale, "当前没有可显示的变化。", "目前沒有可顯示的變化。")}</p>
        )}
      </div>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  const [primary, secondary] = value.split("\n");

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-2 text-sm leading-6 text-slate-900">{primary}</p>
      {secondary ? <p className="mt-1 text-xs text-slate-500">{secondary}</p> : null}
    </div>
  );
}
