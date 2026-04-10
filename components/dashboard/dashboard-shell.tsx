import Link from "next/link";
import type { User } from "@supabase/supabase-js";

import type { Tables } from "@/lib/database.types";
import { buildCaseResumeHref } from "@/lib/cases";
import { getProfileCompletion } from "@/lib/profile";
import { formatCaseStatus } from "@/lib/case-state";
import { dashboardNav, siteConfig } from "@/lib/site";
import { formatReadinessStatus, getUseCaseDefinition } from "@/lib/case-workflows";
import { LogoutButton } from "@/components/dashboard/logout-button";
import { DashboardArchiveLinks } from "@/components/legacy/dashboard-archive-links";
import { EventLink } from "@/components/site/event-link";
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
};

export function DashboardShell({ user, profile, recentCases, metrics }: DashboardShellProps) {
  const displayName =
    profile?.full_name ??
    (typeof user.user_metadata?.full_name === "string" && user.user_metadata.full_name.trim()
      ? user.user_metadata.full_name.trim()
      : user.email?.split("@")[0] ?? "Member");
  const userEmail = user.email ?? profile?.email ?? "No email available";
  const firstName = displayName.split(" ")[0] ?? displayName;
  const profileCompletion = getProfileCompletion(profile);

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
                            Resume
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
