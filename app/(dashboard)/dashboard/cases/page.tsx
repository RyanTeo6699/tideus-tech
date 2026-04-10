import Link from "next/link";
import { redirect } from "next/navigation";

import { WorkspaceShell } from "@/components/dashboard/workspace-shell";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buildCaseResumeHref, getCases } from "@/lib/cases";
import { formatCaseStatus } from "@/lib/case-state";
import { formatReadinessStatus, getUseCaseDefinition } from "@/lib/case-workflows";
import { formatAppDate } from "@/lib/i18n/format";
import { getCurrentLocale } from "@/lib/i18n/server";
import { getWorkspaceCopy } from "@/lib/i18n/workspace";

export default async function DashboardCasesPage() {
  const { user, items } = await getCases();
  const locale = await getCurrentLocale();
  const copy = getWorkspaceCopy(locale);

  if (!user) {
    redirect("/login?next=/dashboard/cases");
  }

  return (
    <WorkspaceShell
      actions={[
        { href: "/dashboard", label: copy.actions.backToOverview, variant: "outline" },
        { href: "/start-case", label: copy.actions.startCase }
      ]}
      description={copy.cases.allCasesDescription}
      eyebrow={copy.shell.casesEyebrow}
      title={copy.cases.allCasesTitle}
    >
      {items.length === 0 ? (
        <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 p-6 text-sm leading-6 text-slate-600">
          {copy.dashboard.noCases}
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <Card className="border-slate-200 bg-slate-50 shadow-none" key={item.id}>
              <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-3xl">
                  <CardTitle className="text-lg">{item.title}</CardTitle>
                  <CardDescription>
                    {(getUseCaseDefinition(item.use_case_slug, locale)?.shortTitle || item.use_case_slug) +
                      " · " +
                      formatAppDate(item.updated_at, locale)}
                  </CardDescription>
                </div>
                <div className="flex shrink-0 gap-3">
                  <Link className={buttonVariants({ variant: "outline", size: "sm" })} href={`/dashboard/cases/${item.id}`}>
                    {copy.actions.viewDetail}
                  </Link>
                  <Link className={buttonVariants({ size: "sm" })} href={buildCaseResumeHref(item)}>
                    {copy.actions.resume}
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-700">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{copy.cases.caseStatus}</p>
                  <p className="mt-2 text-slate-900">{formatCaseStatus(item.status, locale)}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-700">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{copy.cases.readiness}</p>
                  <p className="mt-2 text-slate-900">
                    {item.latest_readiness_status ? formatReadinessStatus(item.latest_readiness_status, locale) : copy.common.noReviewYet}
                  </p>
                </div>
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-slate-900">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-800">{copy.cases.latestReview}</p>
                  <p className="mt-2">{item.latest_review_summary || copy.dashboard.defaultReviewNote}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </WorkspaceShell>
  );
}
