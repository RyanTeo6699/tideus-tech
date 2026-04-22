import Link from "next/link";

import { LogoutButtonWithRedirect } from "@/components/dashboard/logout-button";
import { LanguageSwitcher } from "@/components/site/language-switcher";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatReadinessStatus } from "@/lib/case-workflows";
import { formatHandoffRequestStatus } from "@/lib/handoffs";
import { formatAppDateTime } from "@/lib/i18n/format";
import { getCurrentLocale } from "@/lib/i18n/server";
import { pickLocale } from "@/lib/i18n/workspace";
import {
  type ProfessionalDashboardData,
  formatOrganizationMemberRole,
  formatOrganizationMemberStatus,
  formatOrganizationStatus,
  formatProfessionalIntakeStatus
} from "@/lib/professionals";
import { cn } from "@/lib/utils";

type ProfessionalDashboardShellProps = ProfessionalDashboardData;

export async function ProfessionalDashboardShell({
  user,
  professionalProfile,
  primaryOrganization,
  memberships,
  handoffRequests,
  handoffSummary
}: ProfessionalDashboardShellProps) {
  const locale = await getCurrentLocale();
  const profileName =
    professionalProfile?.display_name ||
    (typeof user.user_metadata?.full_name === "string" && user.user_metadata.full_name.trim()
      ? user.user_metadata.full_name.trim()
      : user.email?.split("@")[0]) ||
    pickLocale(locale, "未命名专业成员", "未命名專業成員");

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
              href="/for-professionals"
            >
              {pickLocale(locale, "返回专业端介绍", "返回專業端介紹")}
            </Link>
            <Link className={buttonVariants({ size: "sm" })} href="/book-demo">
              {pickLocale(locale, "预约专业端演示", "預約專業端示範")}
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
              {pickLocale(locale, "专业端工作台", "專業端工作台")}
            </Badge>
            <CardTitle className="text-3xl">{pickLocale(locale, "接收并初步处理 C 端交接请求", "接收並初步處理 C 端交接請求")}</CardTitle>
            <CardDescription>
              {pickLocale(
                locale,
                "当前专业端聚焦收件、查看交接包、推进基础状态和保留内部备注，不扩展成完整客户管理系统。",
                "目前專業端聚焦收件、查看交接包、推進基礎狀態和保留內部備註，不擴展成完整客戶管理系統。"
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-4">
              <SummaryCard
                label={pickLocale(locale, "活跃交接", "活躍交接")}
                value={String(handoffSummary.activeCount)}
              />
              <SummaryCard label={pickLocale(locale, "新请求", "新請求")} value={String(handoffSummary.newCount)} />
              <SummaryCard label={pickLocale(locale, "审阅中", "審閱中")} value={String(handoffSummary.inReviewCount)} />
              <SummaryCard
                label={pickLocale(locale, "高风险提示", "高風險提示")}
                value={String(handoffSummary.highRiskCount)}
              />
            </div>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <Link className={buttonVariants({ size: "sm" })} href="/professional/handoffs">
                {pickLocale(locale, "打开交接队列", "打開交接佇列")}
              </Link>
              <Link className={buttonVariants({ variant: "outline", size: "sm" })} href="/dashboard">
                {pickLocale(locale, "返回消费者工作台", "返回消費者工作台")}
              </Link>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <Card className="border-white/10 bg-white text-slate-950">
            <CardHeader>
              <CardTitle>{pickLocale(locale, "专业档案", "專業檔案")}</CardTitle>
              <CardDescription>
                {pickLocale(
                  locale,
                  "专业端当前只保留身份、所属组织和开通状态，不提前扩展成客户管理后台。",
                  "專業端目前只保留身分、所屬組織和開通狀態，不提前擴展成客戶管理後台。"
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {professionalProfile ? null : (
                <EmptyCard
                  description={pickLocale(
                    locale,
                    "当前账号已经可以进入专业端，但还没有正式的专业档案记录。后续可通过人工开通把该账号挂到组织和专业角色下。",
                    "目前帳號已經可以進入專業端，但還沒有正式的專業檔案記錄。後續可透過人工開通把此帳號掛到組織和專業角色下。"
                  )}
                  title={pickLocale(locale, "专业档案待开通", "專業檔案待開通")}
                />
              )}
              <div className="grid gap-4 md:grid-cols-2">
                <InfoCard label={pickLocale(locale, "显示名称", "顯示名稱")} value={profileName} />
                <InfoCard
                  label={pickLocale(locale, "开通状态", "開通狀態")}
                  value={
                    professionalProfile
                      ? formatProfessionalIntakeStatus(professionalProfile.intake_status, locale)
                      : pickLocale(locale, "待开通", "待開通")
                  }
                />
                <InfoCard
                  label={pickLocale(locale, "专业头衔", "專業頭銜")}
                  value={professionalProfile?.professional_title || pickLocale(locale, "尚未设置", "尚未設定")}
                />
                <InfoCard
                  label={pickLocale(locale, "服务地区", "服務地區")}
                  value={
                    professionalProfile?.service_regions.length
                      ? professionalProfile.service_regions.join(" / ")
                      : pickLocale(locale, "尚未设置", "尚未設定")
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white text-slate-950">
            <CardHeader>
              <CardTitle>{pickLocale(locale, "组织骨架", "組織骨架")}</CardTitle>
              <CardDescription>
                {pickLocale(
                  locale,
                  "组织层现在只准备名称、slug、状态和成员关系，为后续案件指派与交接队列留位。",
                  "組織層現在只準備名稱、slug、狀態和成員關係，為後續案件指派與交接佇列留位。"
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {primaryOrganization ? (
                <>
                  <InfoCard label={pickLocale(locale, "组织名称", "組織名稱")} value={primaryOrganization.name} />
                  <InfoCard label={pickLocale(locale, "组织标识", "組織標識")} value={primaryOrganization.slug} />
                  <InfoCard
                    label={pickLocale(locale, "组织状态", "組織狀態")}
                    value={formatOrganizationStatus(primaryOrganization.status, locale)}
                  />
                </>
              ) : (
                <EmptyCard
                  description={pickLocale(
                    locale,
                    "当前账号还没有关联组织。后续可以通过人工开通或内部脚本把专业成员挂到组织下。",
                    "目前帳號還沒有關聯組織。後續可以透過人工開通或內部腳本把專業成員掛到組織下。"
                  )}
                  title={pickLocale(locale, "尚未关联组织", "尚未關聯組織")}
                />
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <Card className="border-white/10 bg-white text-slate-950">
            <CardHeader>
              <CardTitle>{pickLocale(locale, "组织成员结构", "組織成員結構")}</CardTitle>
              <CardDescription>
                {pickLocale(
                  locale,
                  "当前只展示你自己的成员记录与角色关系，不提前扩展出完整团队管理面板。",
                  "目前只展示你自己的成員記錄與角色關係，不提前擴展出完整團隊管理面板。"
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {memberships.length > 0 ? (
                memberships.map((membership) => (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4" key={membership.id}>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <p className="font-semibold text-slate-950">
                        {membership.organization?.name || pickLocale(locale, "未命名组织", "未命名組織")}
                      </p>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                        {formatOrganizationMemberStatus(membership.status, locale)}
                      </p>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-700">
                      {pickLocale(locale, "角色", "角色")} · {formatOrganizationMemberRole(membership.role, locale)}
                    </p>
                  </div>
                ))
              ) : (
                <EmptyCard
                  description={pickLocale(
                    locale,
                    "当前没有专业成员记录。数据模型已经就位，但实际成员关系仍等待开通。",
                    "目前沒有專業成員記錄。資料模型已經就位，但實際成員關係仍等待開通。"
                  )}
                  title={pickLocale(locale, "尚无成员关系", "尚無成員關係")}
                />
              )}
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white text-slate-950">
            <CardHeader>
              <CardTitle>{pickLocale(locale, "交接收件箱", "交接收件箱")}</CardTitle>
              <CardDescription>
                {pickLocale(
                  locale,
                  "这里展示来自 C 端的专业审阅请求。你可以进入详情查看交接包，并推进新请求、已打开、审阅中和已关闭状态。",
                  "這裡展示來自 C 端的專業審閱請求。你可以進入詳情查看交接包，並推進新請求、已開啟、審閱中和已關閉狀態。"
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {handoffRequests.length > 0 ? (
                handoffRequests.map((item) => {
                  const packet = item.packet;
                  const summary =
                    packet?.handoffIntelligence?.externalSummary ||
                    packet?.resultSummary ||
                    pickLocale(locale, "当前没有可显示的交接摘要。", "目前沒有可顯示的交接摘要。");

                  return (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4" key={item.handoffRequest.id}>
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="font-semibold text-slate-950">
                            {packet?.caseTitle || pickLocale(locale, "未命名案件", "未命名案件")}
                          </p>
                          <p className="mt-1 text-sm leading-6 text-slate-700">
                            {(packet?.useCaseTitle || pickLocale(locale, "未命名场景", "未命名場景")) +
                              " · " +
                              (packet?.clientSnapshot.displayName || pickLocale(locale, "未命名客户", "未命名客戶"))}
                          </p>
                          {packet?.clientSnapshot.email ? (
                            <p className="text-sm leading-6 text-slate-600">{packet.clientSnapshot.email}</p>
                          ) : null}
                        </div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                          {formatHandoffRequestStatus(item.handoffRequest.status, locale)}
                        </p>
                      </div>

                      <div className="mt-4 grid gap-3 md:grid-cols-3">
                        <InfoCard
                          label={pickLocale(locale, "提交时间", "提交時間")}
                          value={formatAppDateTime(item.handoffRequest.created_at, locale)}
                        />
                        <InfoCard
                          label={pickLocale(locale, "审查版本", "審查版本")}
                          value={pickLocale(
                            locale,
                            `版本 ${item.handoffRequest.requested_review_version}`,
                            `版本 ${item.handoffRequest.requested_review_version}`
                          )}
                        />
                        <InfoCard
                          label={pickLocale(locale, "就绪状态", "就緒狀態")}
                          value={formatReadinessStatus(item.handoffRequest.requested_readiness_status, locale)}
                        />
                      </div>

                      <div className="mt-4 rounded-2xl border border-white bg-white p-4 text-sm leading-6 text-slate-700">
                        <p className="font-semibold uppercase tracking-[0.18em] text-slate-500">
                          {pickLocale(locale, "交接摘要", "交接摘要")}
                        </p>
                        <p className="mt-2">{summary}</p>
                      </div>

                      {item.handoffRequest.request_note ? (
                        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-slate-700">
                          <p className="font-semibold uppercase tracking-[0.18em] text-amber-800">
                            {pickLocale(locale, "客户备注", "客戶備註")}
                          </p>
                          <p className="mt-2">{item.handoffRequest.request_note}</p>
                        </div>
                      ) : null}

                      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                        <Link
                          className={buttonVariants({ size: "sm" })}
                          href={`/professional/handoffs/${item.handoffRequest.id}`}
                        >
                          {pickLocale(locale, "查看交接详情", "查看交接詳情")}
                        </Link>
                        <Link className={buttonVariants({ variant: "outline", size: "sm" })} href="/professional/handoffs">
                          {pickLocale(locale, "查看完整队列", "查看完整佇列")}
                        </Link>
                      </div>
                    </div>
                  );
                })
              ) : (
                <EmptyCard
                  description={pickLocale(
                    locale,
                    "当前还没有来自 C 端的专业审阅请求。一旦导出页发起交接，请求会先进入这里。",
                    "目前還沒有來自 C 端的專業審閱請求。一旦匯出頁發起交接，請求會先進入這裡。"
                  )}
                  title={pickLocale(locale, "收件箱为空", "收件箱為空")}
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-2 text-sm leading-6 text-slate-900">{value}</p>
    </div>
  );
}

function EmptyCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5">
      <p className="font-semibold text-slate-950">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-700">{description}</p>
    </div>
  );
}
