import Link from "next/link";
import { redirect } from "next/navigation";

import { WorkspaceShell } from "@/components/dashboard/workspace-shell";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buildCaseResumeHref, getCases } from "@/lib/cases";
import { formatCaseStatus, formatReadinessStatus, getUseCaseDefinition } from "@/lib/case-workflows";
import { cn } from "@/lib/utils";

export default async function DashboardCasesPage() {
  const { user, items } = await getCases();

  if (!user) {
    redirect("/login?next=/dashboard/cases");
  }

  return (
    <WorkspaceShell
      actions={[
        { href: "/dashboard", label: "Back to overview", variant: "outline" },
        { href: "/start-case", label: "Start a case" }
      ]}
      description="Every saved case stays here with its latest review signal and the correct resume path."
      eyebrow="Case Dashboard"
      title="Saved cases"
    >
      {items.length === 0 ? (
        <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 p-6 text-sm leading-6 text-slate-600">
          No saved cases yet. Start with a supported workflow and Tideus will keep the intake, materials, and review versions together.
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <Card className="border-slate-200 bg-slate-50 shadow-none" key={item.id}>
              <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-3xl">
                  <CardTitle className="text-lg">{item.title}</CardTitle>
                  <CardDescription>
                    {(getUseCaseDefinition(item.use_case_slug)?.shortTitle || item.use_case_slug) +
                      " · " +
                      formatDate(item.updated_at)}
                  </CardDescription>
                </div>
                <div className="flex shrink-0 gap-3">
                  <Link className={cn(buttonVariants({ variant: "outline", size: "sm" }))} href={`/dashboard/cases/${item.id}`}>
                    View detail
                  </Link>
                  <Link className={cn(buttonVariants({ size: "sm" }))} href={buildCaseResumeHref(item)}>
                    Resume
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-700">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Case status</p>
                  <p className="mt-2 text-slate-900">{formatCaseStatus(item.status)}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-700">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Readiness</p>
                  <p className="mt-2 text-slate-900">
                    {item.latest_readiness_status ? formatReadinessStatus(item.latest_readiness_status) : "Not reviewed yet"}
                  </p>
                </div>
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-slate-900">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-800">Latest review note</p>
                  <p className="mt-2">{item.latest_review_summary || "Finish the materials page to generate the first review version."}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </WorkspaceShell>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-CA", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(value));
}
