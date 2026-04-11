import Link from "next/link";
import type { User } from "@supabase/supabase-js";

import type { Tables } from "@/lib/database.types";
import { buildCaseResumeHref } from "@/lib/cases";
import { formatCaseStatus } from "@/lib/case-state";
import { getProfileCompletion } from "@/lib/profile";
import { formatConsumerPlanName, getConsumerPlanDefinitions, getConsumerPlanState } from "@/lib/plans";
import { formatReadinessStatus, getUseCaseDefinition } from "@/lib/case-workflows";
import { formatAppDate } from "@/lib/i18n/format";
import { getCurrentLocale } from "@/lib/i18n/server";
import { getWorkspaceCopy, pickLocale } from "@/lib/i18n/workspace";
import { dashboardNav, siteConfig } from "@/lib/site";
import { LogoutButton } from "@/components/dashboard/logout-button";
import { DashboardArchiveLinks } from "@/components/legacy/dashboard-archive-links";
import { EventLink } from "@/components/site/event-link";
import { LanguageSwitcher } from "@/components/site/language-switcher";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type DashboardShellProps = {
  user: User;
  profile: Tables<"profiles"> | null;
  recentCases: Tables<"cases">[];
  metrics: {
    activeCases: number;
    reviewReadyCases: number;
    actionNeededCases: number;
  };
};

export async function DashboardShell({ user, profile, recentCases, metrics }: DashboardShellProps) {
  const locale = await getCurrentLocale();
  const copy = getWorkspaceCopy(locale);
  const displayName =
    profile?.full_name ??
    (typeof user.user_metadata?.full_name === "string" && user.user_metadata.full_name.trim()
      ? user.user_metadata.full_name.trim()
      : user.email?.split("@")[0] ?? copy.common.notSet);
  const firstName = displayName.split(" ")[0] ?? displayName;
  const userEmail = user.email ?? profile?.email ?? copy.common.notSet;
  const profileCompletion = getProfileCompletion(profile);
  const planState = getConsumerPlanState(profile);
  const proPlan = getConsumerPlanDefinitions(locale).find((item) => item.tier === "pro");
  const planHighlights = proPlan?.features.slice(0, 3) ?? [];

  const navItems = dashboardNav.map((item) => ({
    ...item,
    label:
      item.href === "/dashboard"
        ? copy.shell.dashboardEyebrow
        : item.href === "/dashboard/cases"
          ? copy.cases.allCasesTitle
          : copy.actions.manageProfile
  }));

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:flex-row lg:px-8">
        <aside className="lg:sticky lg:top-6 lg:w-80 lg:self-start">
          <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-panel backdrop-blur-sm">
            <Link className="flex items-center gap-3" href="/">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-sm font-semibold text-slate-950">
                {siteConfig.mark}
              </span>
              <div>
                <p className="font-semibold">{siteConfig.name}</p>
                <p className="text-sm text-slate-400">{copy.dashboard.sidebarTagline}</p>
              </div>
            </Link>

            <div className="mt-8 rounded-[24px] border border-white/10 bg-white/5 p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-emerald-300">{copy.common.account}</p>
                  <p className="mt-3 text-lg font-semibold">{displayName}</p>
                  <p className="text-sm text-slate-400">{userEmail}</p>
                </div>
                <LanguageSwitcher />
              </div>
            </div>

            <nav className="mt-8 space-y-2">
              {navItems.map((item) => (
                <Link
                  className="flex items-center justify-between rounded-2xl px-4 py-3 text-sm text-slate-200 transition-colors hover:bg-white/10"
                  href={item.href}
                  key={item.href}
                >
                  <span>{item.label}</span>
                  <span className="text-slate-500">/</span>
                </Link>
              ))}
            </nav>

            <div className="mt-8 rounded-[24px] border border-emerald-400/20 bg-emerald-400/10 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-emerald-300">{copy.dashboard.profileSnapshot}</p>
                  <p className="mt-2 text-sm text-slate-300">
                    {pickLocale(
                      locale,
                      `已保存 ${profileCompletion.completed} / ${profileCompletion.total} 个核心字段。`,
                      `已儲存 ${profileCompletion.completed} / ${profileCompletion.total} 個核心欄位。`
                    )}
                  </p>
                </div>
                <Badge variant="secondary">
                  {profileCompletion.completed}/{profileCompletion.total}
                </Badge>
              </div>

              <div className="mt-4 space-y-3 text-sm leading-6 text-slate-100">
                <div>
                  <p className="text-slate-400">{copy.dashboard.currentStatus}</p>
                  <p>{formatValue(profile?.current_status, locale)}</p>
                </div>
                <div>
                  <p className="text-slate-400">{copy.dashboard.primaryGoal}</p>
                  <p>{formatValue(profile?.target_goal, locale)}</p>
                </div>
                <div>
                  <p className="text-slate-400">{copy.dashboard.provinceFocus}</p>
                  <p>{profile?.province_preference || copy.common.notSet}</p>
                </div>
              </div>

              <Link
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "mt-5 w-full border-white/15 bg-white/5 text-white hover:bg-white/10"
                )}
                href="/dashboard/profile"
              >
                {copy.actions.manageProfile}
              </Link>
            </div>

            <div className="mt-8 rounded-[24px] border border-amber-400/20 bg-amber-400/10 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-amber-200">
                    {pickLocale(locale, "当前 C 端方案", "目前 C 端方案")}
                  </p>
                  <p className="mt-2 text-lg font-semibold">{formatConsumerPlanName(planState.tier, locale)}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    {planState.tier === "pro"
                      ? pickLocale(
                          locale,
                          "已启用持续 AI 协作、审查变化对比和更强的交接摘要层。",
                          "已啟用持續 AI 協作、審查變化對比和更強的交接摘要層。"
                        )
                      : pickLocale(
                          locale,
                          "当前保留案件、材料和基础审查工作流。连续 AI 追问、材料动作和交接增强层属于 Pro。",
                          "目前保留案件、材料和基礎審查工作流程。連續 AI 追問、材料動作和交接增強層屬於 Pro。"
                        )}
                  </p>
                </div>
                <Badge variant="secondary">{formatConsumerPlanName(planState.tier, locale)}</Badge>
              </div>

              <div className="mt-4 space-y-2 text-sm leading-6 text-slate-100">
                {planHighlights.map((item) => (
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2" key={item}>
                    {item}
                  </div>
                ))}
              </div>

              <div className="mt-5 flex flex-col gap-3">
                <Link
                  className={cn(
                    buttonVariants({ variant: planState.tier === "pro" ? "outline" : "secondary", size: "sm" }),
                    planState.tier === "pro" ? "border-white/15 bg-white/5 text-white hover:bg-white/10" : ""
                  )}
                  href="/pricing"
                >
                  {planState.tier === "pro"
                    ? pickLocale(locale, "查看方案详情", "查看方案詳情")
                    : pickLocale(locale, "查看 Free / Pro 差异", "查看 Free / Pro 差異")}
                </Link>
                {planState.tier === "free" ? (
                  <EventLink
                    className={buttonVariants({ variant: "outline", size: "sm" })}
                    eventType="book_demo_clicked"
                    href="/book-demo"
                    metadata={{
                      sourceSurface: "dashboard-plan-card",
                      requestedPlan: "pro"
                    }}
                  >
                    {pickLocale(locale, "预约升级 Pro", "預約升級 Pro")}
                  </EventLink>
                ) : null}
              </div>
            </div>
          </div>
        </aside>

        <main className="flex-1 space-y-6">
          <Card className="border-white/10 bg-white text-slate-950">
            <CardHeader className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <Badge variant="secondary" className="mb-4 w-fit">
                  {copy.shell.dashboardEyebrow}
                </Badge>
                <CardTitle className="text-3xl">{`${copy.dashboard.welcome}，${firstName}`}</CardTitle>
                <CardDescription>{copy.dashboard.description}</CardDescription>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-end">
                <Link className={buttonVariants({ size: "sm" })} href="/start-case">
                  {copy.actions.startCase}
                </Link>
                <Link className={buttonVariants({ variant: "outline", size: "sm" })} href="/dashboard/cases">
                  {copy.actions.viewAll}
                </Link>
                <Link className={buttonVariants({ variant: "outline", size: "sm" })} href="/dashboard/profile">
                  {copy.actions.manageProfile}
                </Link>
                <LogoutButton />
              </div>
            </CardHeader>
          </Card>

          <div className="grid gap-4 md:grid-cols-3">
            <MetricCard detail={copy.dashboard.activeCasesDetail} label={copy.dashboard.activeCases} value={metrics.activeCases} />
            <MetricCard detail={copy.dashboard.reviewReadyDetail} label={copy.dashboard.reviewReady} value={metrics.reviewReadyCases} />
            <MetricCard detail={copy.dashboard.needsAttentionDetail} label={copy.dashboard.needsAttention} value={metrics.actionNeededCases} />
          </div>

          <Card className="border-white/10 bg-white text-slate-950">
            <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <CardTitle>{copy.dashboard.resumeCases}</CardTitle>
                <CardDescription>{copy.dashboard.resumeCasesDescription}</CardDescription>
              </div>
              <Link className={buttonVariants({ variant: "outline", size: "sm" })} href="/dashboard/cases">
                {copy.actions.viewAll}
              </Link>
            </CardHeader>
            <CardContent>
              {recentCases.length === 0 ? (
                <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 p-5 text-sm leading-6 text-slate-600">
                  {copy.dashboard.noCases}
                </div>
              ) : (
                <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-slate-50">
                  {recentCases.map((item, index) => (
                    <div
                      className={cn("px-5 py-5", {
                        "border-t border-slate-200": index !== 0
                      })}
                      key={item.id}
                    >
                      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                        <div className="max-w-3xl">
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-sm font-semibold text-slate-950">{item.title}</span>
                            <span className="text-xs uppercase tracking-[0.18em] text-slate-500">{formatAppDate(item.updated_at, locale)}</span>
                          </div>
                          <p className="mt-2 text-sm text-slate-500">
                            {(getUseCaseDefinition(item.use_case_slug, locale)?.shortTitle || item.use_case_slug) +
                              " · " +
                              formatCaseStatus(item.status, locale)}
                          </p>
                          <p className="mt-3 text-sm leading-6 text-slate-700">{item.latest_review_summary || copy.dashboard.defaultReviewNote}</p>
                          <p className="mt-3 text-sm font-medium text-emerald-800">
                            {item.latest_readiness_status
                              ? formatReadinessStatus(item.latest_readiness_status, locale)
                              : copy.common.noReviewYet}
                          </p>
                        </div>
                        <div className="flex shrink-0 gap-3">
                          <Link className={buttonVariants({ variant: "outline", size: "sm" })} href={`/dashboard/cases/${item.id}`}>
                            {copy.actions.viewDetail}
                          </Link>
                          <EventLink
                            caseId={item.id}
                            className={buttonVariants({ size: "sm" })}
                            eventType="dashboard_resume_clicked"
                            href={buildCaseResumeHref(item)}
                            metadata={{
                              sourceSurface: "dashboard-recent-cases",
                              useCase: item.use_case_slug,
                              caseStatus: item.status,
                              readinessStatus: item.latest_readiness_status,
                              reviewVersion: item.latest_review_version
                            }}
                          >
                            {copy.actions.resume}
                          </EventLink>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <DashboardArchiveLinks />
        </main>
      </div>
    </div>
  );
}

function MetricCard({ label, value, detail }: { label: string; value: number; detail: string }) {
  return (
    <Card className="border-white/10 bg-white/5 text-slate-50">
      <CardHeader>
        <CardDescription className="text-slate-400">{label}</CardDescription>
        <CardTitle className="font-serif text-5xl">{value.toString().padStart(2, "0")}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-6 text-slate-300">{detail}</p>
      </CardContent>
    </Card>
  );
}

function formatValue(value: string | null | undefined, locale: "zh-CN" | "zh-TW") {
  if (!value) {
    return pickLocale(locale, "尚未设置", "尚未設定");
  }

  const labels: Record<string, string> = {
    visitor: pickLocale(locale, "访问者", "訪客"),
    student: pickLocale(locale, "学生", "學生"),
    worker: pickLocale(locale, "工作者", "工作者"),
    "outside-canada": pickLocale(locale, "加拿大境外", "加拿大境外"),
    other: pickLocale(locale, "其他", "其他"),
    "visitor-record": pickLocale(locale, "访客记录准备", "訪客紀錄準備"),
    "study-permit-extension": pickLocale(locale, "学签延期准备", "學簽延期準備")
  };

  return labels[value] ?? value;
}
