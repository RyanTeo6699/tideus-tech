import Link from "next/link";
import type { User } from "@supabase/supabase-js";

import type { Tables } from "@/lib/database.types";
import { buildCaseResumeHref } from "@/lib/cases";
import { getProfileCompletion } from "@/lib/profile";
import { formatCaseStatus } from "@/lib/case-state";
import { dashboardNav, legacyWorkspaceLinks, siteConfig } from "@/lib/site";
import { formatReadinessStatus, getUseCaseDefinition } from "@/lib/case-workflows";
import { LogoutButton } from "@/components/dashboard/logout-button";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  legacyCounts: {
    assessments: number;
    comparisons: number;
    threads: number;
  };
};

export function DashboardShell({ user, profile, recentCases, metrics, legacyCounts }: DashboardShellProps) {
  const displayName =
    profile?.full_name ??
    (typeof user.user_metadata?.full_name === "string" && user.user_metadata.full_name.trim()
      ? user.user_metadata.full_name.trim()
      : user.email?.split("@")[0] ?? "Member");
  const userEmail = user.email ?? profile?.email ?? "No email available";
  const firstName = displayName.split(" ")[0] ?? displayName;
  const profileCompletion = getProfileCompletion(profile);
  const legacyTotal = legacyCounts.assessments + legacyCounts.comparisons + legacyCounts.threads;

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
                <p className="text-sm text-slate-400">Case workspace</p>
              </div>
            </Link>

            <div className="mt-8 rounded-[24px] border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-emerald-300">Account</p>
              <p className="mt-3 text-lg font-semibold">{displayName}</p>
              <p className="text-sm text-slate-400">{userEmail}</p>
            </div>

            <nav className="mt-8 space-y-2">
              {dashboardNav.map((item) => (
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
                  <p className="text-xs uppercase tracking-[0.2em] text-emerald-300">Profile snapshot</p>
                  <p className="mt-2 text-sm text-slate-300">
                    {profileCompletion.completed} of {profileCompletion.total} core fields saved.
                  </p>
                </div>
                <Badge variant="secondary">
                  {profileCompletion.completed}/{profileCompletion.total}
                </Badge>
              </div>

              <div className="mt-4 space-y-3 text-sm leading-6 text-slate-100">
                <div>
                  <p className="text-slate-400">Current status</p>
                  <p>{formatValue(profile?.current_status)}</p>
                </div>
                <div>
                  <p className="text-slate-400">Primary goal</p>
                  <p>{formatValue(profile?.target_goal)}</p>
                </div>
                <div>
                  <p className="text-slate-400">Province focus</p>
                  <p>{profile?.province_preference || "Not set yet"}</p>
                </div>
              </div>

              <Link
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "mt-5 w-full border-white/15 bg-white/5 text-white hover:bg-white/10"
                )}
                href="/dashboard/profile"
              >
                Manage saved profile
              </Link>
            </div>
          </div>
        </aside>

        <main className="flex-1 space-y-6">
          <Card className="border-white/10 bg-white text-slate-950">
            <CardHeader className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <Badge variant="secondary" className="mb-4 w-fit">
                  Case Dashboard
                </Badge>
                <CardTitle className="text-3xl">Welcome back, {firstName}.</CardTitle>
                <CardDescription>
                  Keep the supported case workflows moving with saved intake answers, materials state, and structured review versions.
                </CardDescription>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-end">
                <Link className={buttonVariants({ size: "sm" })} href="/start-case">
                  Start a case
                </Link>
                <Link className={buttonVariants({ variant: "outline", size: "sm" })} href="/dashboard/cases">
                  View all cases
                </Link>
                <Link className={buttonVariants({ variant: "outline", size: "sm" })} href="/dashboard/profile">
                  Manage profile
                </Link>
                <LogoutButton />
              </div>
            </CardHeader>
          </Card>

          <div className="grid gap-4 md:grid-cols-3">
            <MetricCard
              detail="Cases that still need a resume action, a materials update, or another review pass."
              label="Active cases"
              value={metrics.activeCases}
            />
            <MetricCard
              detail="Cases whose latest saved review currently reads as review-ready."
              label="Review-ready"
              value={metrics.reviewReadyCases}
            />
            <MetricCard
              detail="Cases where the current state still shows not-ready, needs-attention, or no review yet."
              label="Needs attention"
              value={metrics.actionNeededCases}
            />
          </div>

          <Card className="border-white/10 bg-white text-slate-950">
            <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <CardTitle>Resume cases</CardTitle>
                <CardDescription>The dashboard should point back to the next real workflow action, not a general tool menu.</CardDescription>
              </div>
              <Link className={buttonVariants({ variant: "outline", size: "sm" })} href="/dashboard/cases">
                View all
              </Link>
            </CardHeader>
            <CardContent>
              {recentCases.length === 0 ? (
                <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 p-5 text-sm leading-6 text-slate-600">
                  No saved cases yet. Start with a supported use case and Tideus will keep the intake, materials, and review output together in one record.
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
                            <span className="text-xs uppercase tracking-[0.18em] text-slate-500">{formatDate(item.updated_at)}</span>
                          </div>
                          <p className="mt-2 text-sm text-slate-500">
                            {(getUseCaseDefinition(item.use_case_slug)?.shortTitle || item.use_case_slug) +
                              " · " +
                              formatCaseStatus(item.status)}
                          </p>
                          <p className="mt-3 text-sm leading-6 text-slate-700">
                            {item.latest_review_summary || "The intake is saved. Continue to the materials step to generate the first review version."}
                          </p>
                          <p className="mt-3 text-sm font-medium text-emerald-800">
                            {item.latest_readiness_status ? formatReadinessStatus(item.latest_readiness_status) : "Not reviewed yet"}
                          </p>
                        </div>
                        <div className="flex shrink-0 gap-3">
                          <Link className={buttonVariants({ variant: "outline", size: "sm" })} href={`/dashboard/cases/${item.id}`}>
                            View detail
                          </Link>
                          <Link className={buttonVariants({ size: "sm" })} href={buildCaseResumeHref(item)}>
                            Resume
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-slate-50/40 text-slate-950 shadow-none">
            <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle className="text-lg">Continuity archive</CardTitle>
                <CardDescription>
                  Older assessment, comparison, and assistant-thread records remain available for continuity only. They are intentionally secondary to the active case workspace.
                </CardDescription>
              </div>
              <Badge variant="secondary">
                {legacyTotal} archived item{legacyTotal === 1 ? "" : "s"}
              </Badge>
            </CardHeader>
            <CardContent>
              <details className="rounded-2xl border border-dashed border-slate-300 bg-white/80">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-4 text-sm font-medium text-slate-950">
                  <div>
                    <p>Open archive links</p>
                    <p className="mt-1 text-sm font-normal leading-6 text-slate-600">
                      Use these only if you need earlier records from the pre-case workspace.
                    </p>
                  </div>
                  <span className="text-xs uppercase tracking-[0.18em] text-slate-500">
                    {legacyTotal === 0 ? "Empty" : "Secondary"}
                  </span>
                </summary>
                <div className="grid gap-3 border-t border-slate-200 p-4 md:grid-cols-3">
                  {legacyWorkspaceLinks.map((link) => (
                    <Link
                      className="rounded-2xl border border-dashed border-slate-300 bg-white p-4 transition-colors hover:border-slate-400 hover:bg-slate-50"
                      href={link.href}
                      key={link.href}
                    >
                      <p className="text-sm font-semibold text-slate-950">{link.label}</p>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {link.href === "/dashboard/assessments"
                          ? `${legacyCounts.assessments} archived record${legacyCounts.assessments === 1 ? "" : "s"}`
                          : link.href === "/dashboard/comparisons"
                            ? `${legacyCounts.comparisons} archived record${legacyCounts.comparisons === 1 ? "" : "s"}`
                            : `${legacyCounts.threads} archived thread${legacyCounts.threads === 1 ? "" : "s"}`}
                      </p>
                    </Link>
                  ))}
                </div>
              </details>
            </CardContent>
          </Card>
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

function formatValue(value: string | null | undefined) {
  if (!value) {
    return "Not set yet";
  }

  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-CA", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(value));
}
