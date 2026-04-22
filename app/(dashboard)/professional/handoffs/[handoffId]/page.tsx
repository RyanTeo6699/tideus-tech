import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { LogoutButtonWithRedirect } from "@/components/dashboard/logout-button";
import { ProfessionalAccessLocked } from "@/components/professional/professional-access-locked";
import { ProfessionalHandoffActions } from "@/components/professional/professional-handoff-actions";
import { LanguageSwitcher } from "@/components/site/language-switcher";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatReadinessStatus } from "@/lib/case-workflows";
import { formatHandoffAssignmentLabel, formatHandoffRequestStatus } from "@/lib/handoffs";
import { formatAppDateTime } from "@/lib/i18n/format";
import { getCurrentLocale } from "@/lib/i18n/server";
import { pickLocale } from "@/lib/i18n/workspace";
import { canAccessProfessionalDashboard, getCurrentPermissionContext } from "@/lib/permissions";
import { getProfessionalHandoffDetail } from "@/lib/server/handoffs";
import { cn } from "@/lib/utils";

type ProfessionalHandoffDetailPageProps = {
  params: Promise<{
    handoffId: string;
  }>;
};

export default async function ProfessionalHandoffDetailPage({ params }: ProfessionalHandoffDetailPageProps) {
  const { handoffId } = await params;
  const permissionContext = await getCurrentPermissionContext();

  if (!permissionContext.user) {
    redirect(`/professional/login?next=${encodeURIComponent(`/professional/handoffs/${handoffId}`)}`);
  }

  if (!canAccessProfessionalDashboard(permissionContext)) {
    return <ProfessionalAccessLocked />;
  }

  const locale = await getCurrentLocale();
  const detail = await getProfessionalHandoffDetail(handoffId);

  if (!detail) {
    notFound();
  }

  const packet = detail.packet;
  const handoff = detail.handoffRequest;
  const missingCount = packet?.materialSummary.requiredActionCount ?? packet?.materialSummary.missing ?? 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "border-white/15 bg-white/5 text-white hover:bg-white/10"
              )}
              href="/professional/handoffs"
            >
              {pickLocale(locale, "返回交接队列", "返回交接佇列")}
            </Link>
            <Link className={buttonVariants({ size: "sm" })} href="/professional/dashboard">
              {pickLocale(locale, "专业工作台", "專業工作台")}
            </Link>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <LanguageSwitcher />
            <LogoutButtonWithRedirect redirectTo="/professional/login" />
          </div>
        </div>

        <Card className="border-white/10 bg-white text-slate-950">
          <CardHeader>
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <Badge variant="secondary">{formatHandoffRequestStatus(handoff.status, locale)}</Badge>
              <Badge>{formatHandoffAssignmentLabel(handoff, locale)}</Badge>
            </div>
            <CardTitle className="text-3xl">
              {packet?.caseTitle || pickLocale(locale, "未命名交接请求", "未命名交接請求")}
            </CardTitle>
            <CardDescription>
              {pickLocale(
                locale,
                "这是专业端只读交接详情和最小处理状态页。当前支持查看结构化交接包、推进状态和保存内部备注。",
                "這是專業端唯讀交接詳情和最小處理狀態頁。目前支援查看結構化交接包、推進狀態和儲存內部備註。"
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-4">
            <DetailFact
              label={pickLocale(locale, "客户", "客戶")}
              value={packet?.clientSnapshot.displayName || pickLocale(locale, "未命名客户", "未命名客戶")}
            />
            <DetailFact
              label={pickLocale(locale, "案件类型", "案件類型")}
              value={packet?.useCaseTitle || pickLocale(locale, "未命名场景", "未命名場景")}
            />
            <DetailFact
              label={pickLocale(locale, "创建时间", "建立時間")}
              value={formatAppDateTime(handoff.created_at, locale)}
            />
            <DetailFact
              label={pickLocale(locale, "就绪状态", "就緒狀態")}
              value={formatReadinessStatus(handoff.requested_readiness_status, locale)}
            />
          </CardContent>
        </Card>

        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <Card className="border-white/10 bg-white text-slate-950">
            <CardHeader>
              <CardTitle>{pickLocale(locale, "处理动作", "處理動作")}</CardTitle>
              <CardDescription>
                {pickLocale(
                  locale,
                  "状态推进会保留处理成员和时间戳，为后续正式指派与审阅流程打基础。",
                  "狀態推進會保留處理成員和時間戳，為後續正式指派與審閱流程打基礎。"
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProfessionalHandoffActions
                currentStatus={handoff.status}
                handoffId={handoff.id}
                internalNotes={handoff.internal_notes}
                locale={locale}
              />
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white text-slate-950">
            <CardHeader>
              <CardTitle>{pickLocale(locale, "交接摘要", "交接摘要")}</CardTitle>
              <CardDescription>
                {pickLocale(
                  locale,
                  "摘要来自 C 端最新审查与导出交接包，供专业端快速判断是否需要继续审阅。",
                  "摘要來自 C 端最新審查與匯出交接包，供專業端快速判斷是否需要繼續審閱。"
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-7 text-slate-700">
              <SummaryBlock
                label={pickLocale(locale, "专业交接摘要", "專業交接摘要")}
                value={
                  packet?.handoffIntelligence?.externalSummary ||
                  packet?.resultSummary ||
                  pickLocale(locale, "当前没有可显示的交接摘要。", "目前沒有可顯示的交接摘要。")
                }
              />
              <SummaryBlock
                label={pickLocale(locale, "就绪说明", "就緒說明")}
                value={packet?.readinessSummary || pickLocale(locale, "暂无就绪说明。", "暫無就緒說明。")}
              />
              <SummaryBlock
                label={pickLocale(locale, "时间线提示", "時間線提示")}
                value={packet?.timelineNote || pickLocale(locale, "暂无时间线提示。", "暫無時間線提示。")}
              />
              {handoff.request_note ? (
                <SummaryBlock label={pickLocale(locale, "客户备注", "客戶備註")} value={handoff.request_note} />
              ) : null}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          <Card className="border-white/10 bg-white text-slate-950">
            <CardHeader>
              <CardTitle>{pickLocale(locale, "关键案件事实", "關鍵案件事實")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {packet?.keyFacts.length ? (
                packet.keyFacts.map((fact) => <DetailFact key={`${fact.label}-${fact.value}`} label={fact.label} value={fact.value} />)
              ) : (
                <EmptyBlock text={pickLocale(locale, "暂无可显示的案件事实。", "暫無可顯示的案件事實。")} />
              )}
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white text-slate-950">
            <CardHeader>
              <CardTitle>{pickLocale(locale, "风险与缺口", "風險與缺口")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <DetailFact label={pickLocale(locale, "高风险", "高風險")} value={String(packet?.riskSummary.high ?? 0)} />
              <DetailFact label={pickLocale(locale, "中风险", "中風險")} value={String(packet?.riskSummary.medium ?? 0)} />
              <DetailFact label={pickLocale(locale, "低风险", "低風險")} value={String(packet?.riskSummary.low ?? 0)} />
              <DetailFact label={pickLocale(locale, "需处理材料", "需處理材料")} value={String(missingCount)} />
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white text-slate-950">
            <CardHeader>
              <CardTitle>{pickLocale(locale, "下一步建议", "下一步建議")}</CardTitle>
            </CardHeader>
            <CardContent>
              {packet?.nextSteps.length ? (
                <ul className="space-y-3 text-sm leading-7 text-slate-700">
                  {packet.nextSteps.map((item) => (
                    <li className="rounded-2xl border border-slate-200 bg-slate-50 p-4" key={item}>
                      {item}
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyBlock text={pickLocale(locale, "暂无下一步建议。", "暫無下一步建議。")} />
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="border-white/10 bg-white text-slate-950">
          <CardHeader>
            <CardTitle>{pickLocale(locale, "人工审阅提示", "人工審閱提示")}</CardTitle>
            <CardDescription>
              {pickLocale(
                locale,
                "这里保留交接增强摘要里的人工审阅问题与升级触发点，不替代专业判断。",
                "這裡保留交接增強摘要裡的人工審閱問題與升級觸發點，不取代專業判斷。"
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <ListBlock
              emptyText={pickLocale(locale, "暂无人工审阅问题。", "暫無人工審閱問題。")}
              items={packet?.handoffIntelligence?.issuesNeedingHumanReview ?? []}
              title={pickLocale(locale, "需要人工审阅的问题", "需要人工審閱的問題")}
            />
            <ListBlock
              emptyText={pickLocale(locale, "暂无升级触发点。", "暫無升級觸發點。")}
              items={packet?.handoffIntelligence?.escalationTriggers ?? []}
              title={pickLocale(locale, "升级触发点", "升級觸發點")}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function DetailFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-2 text-sm leading-6 text-slate-950">{value}</p>
    </div>
  );
}

function SummaryBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-2">{value}</p>
    </div>
  );
}

function ListBlock({ title, items, emptyText }: { title: string; items: string[]; emptyText: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="font-semibold text-slate-950">{title}</p>
      {items.length > 0 ? (
        <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700">
          {items.map((item) => (
            <li className="rounded-xl border border-white bg-white p-3" key={item}>
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm leading-6 text-slate-700">{emptyText}</p>
      )}
    </div>
  );
}

function EmptyBlock({ text }: { text: string }) {
  return <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">{text}</div>;
}
