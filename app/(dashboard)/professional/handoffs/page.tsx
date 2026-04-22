import Link from "next/link";
import { redirect } from "next/navigation";

import { LogoutButtonWithRedirect } from "@/components/dashboard/logout-button";
import { ProfessionalAccessLocked } from "@/components/professional/professional-access-locked";
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
import { getProfessionalHandoffInbox } from "@/lib/server/handoffs";
import { cn } from "@/lib/utils";

export default async function ProfessionalHandoffQueuePage() {
  const permissionContext = await getCurrentPermissionContext();

  if (!permissionContext.user) {
    redirect("/professional/login?next=/professional/handoffs");
  }

  if (!canAccessProfessionalDashboard(permissionContext)) {
    return <ProfessionalAccessLocked />;
  }

  const locale = await getCurrentLocale();
  const handoffs = await getProfessionalHandoffInbox(50);

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
              href="/professional/dashboard"
            >
              {pickLocale(locale, "返回专业工作台", "返回專業工作台")}
            </Link>
            <Link className={buttonVariants({ size: "sm" })} href="/for-professionals">
              {pickLocale(locale, "专业端说明", "專業端說明")}
            </Link>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <LanguageSwitcher />
            <LogoutButtonWithRedirect redirectTo="/professional/login" />
          </div>
        </div>

        <Card className="border-white/10 bg-white text-slate-950">
          <CardHeader>
            <Badge variant="secondary" className="mb-4 w-fit">
              {pickLocale(locale, "交接队列", "交接佇列")}
            </Badge>
            <CardTitle className="text-3xl">{pickLocale(locale, "专业审阅请求收件箱", "專業審閱請求收件箱")}</CardTitle>
            <CardDescription>
              {pickLocale(
                locale,
                "这里只处理 C 端发起的结构化交接请求：查看摘要、判断风险、进入详情并推进基础状态。",
                "這裡只處理 C 端發起的結構化交接請求：查看摘要、判斷風險、進入詳情並推進基礎狀態。"
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {handoffs.length > 0 ? (
              handoffs.map((item) => {
                const packet = item.packet;

                return (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5" key={item.handoffRequest.id}>
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <p className="text-lg font-semibold text-slate-950">
                          {packet?.caseTitle || pickLocale(locale, "未命名案件", "未命名案件")}
                        </p>
                        <p className="mt-2 text-sm leading-6 text-slate-700">
                          {(packet?.clientSnapshot.displayName || pickLocale(locale, "未命名客户", "未命名客戶")) +
                            " · " +
                            (packet?.useCaseTitle || pickLocale(locale, "未命名场景", "未命名場景"))}
                        </p>
                        {packet?.clientSnapshot.email ? (
                          <p className="text-sm leading-6 text-slate-600">{packet.clientSnapshot.email}</p>
                        ) : null}
                      </div>
                      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                        <Badge variant="secondary">{formatHandoffRequestStatus(item.handoffRequest.status, locale)}</Badge>
                        <Badge>{formatHandoffAssignmentLabel(item.handoffRequest, locale)}</Badge>
                      </div>
                    </div>

                    <div className="mt-5 grid gap-3 md:grid-cols-4">
                      <QueueFact
                        label={pickLocale(locale, "创建时间", "建立時間")}
                        value={formatAppDateTime(item.handoffRequest.created_at, locale)}
                      />
                      <QueueFact
                        label={pickLocale(locale, "就绪状态", "就緒狀態")}
                        value={formatReadinessStatus(item.handoffRequest.requested_readiness_status, locale)}
                      />
                      <QueueFact
                        label={pickLocale(locale, "高风险", "高風險")}
                        value={String(packet?.riskSummary.high ?? 0)}
                      />
                      <QueueFact
                        label={pickLocale(locale, "需处理材料", "需處理材料")}
                        value={String(packet?.materialSummary.requiredActionCount ?? packet?.materialSummary.missing ?? 0)}
                      />
                    </div>

                    <div className="mt-5 rounded-2xl border border-white bg-white p-4 text-sm leading-6 text-slate-700">
                      <p className="font-semibold uppercase tracking-[0.18em] text-slate-500">
                        {pickLocale(locale, "交接摘要", "交接摘要")}
                      </p>
                      <p className="mt-2">
                        {packet?.handoffIntelligence?.externalSummary ||
                          packet?.resultSummary ||
                          pickLocale(locale, "当前没有可显示的交接摘要。", "目前沒有可顯示的交接摘要。")}
                      </p>
                    </div>

                    <div className="mt-5">
                      <Link className={buttonVariants({ size: "sm" })} href={`/professional/handoffs/${item.handoffRequest.id}`}>
                        {pickLocale(locale, "进入交接详情", "進入交接詳情")}
                      </Link>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6">
                <p className="font-semibold text-slate-950">{pickLocale(locale, "当前没有活跃交接请求", "目前沒有活躍交接請求")}</p>
                <p className="mt-2 text-sm leading-6 text-slate-700">
                  {pickLocale(
                    locale,
                    "当 C 端用户从导出页请求专业审阅后，结构化交接记录会出现在这里。",
                    "當 C 端使用者從匯出頁請求專業審閱後，結構化交接記錄會出現在這裡。"
                  )}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function QueueFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-semibold text-slate-950">{value}</p>
    </div>
  );
}
