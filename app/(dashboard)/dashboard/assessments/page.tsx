import Link from "next/link";
import { redirect } from "next/navigation";

import { WorkspaceShell } from "@/components/dashboard/workspace-shell";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAssessmentHistory } from "@/lib/history";
import { cn } from "@/lib/utils";

export default async function DashboardAssessmentsPage() {
  const { user, items } = await getAssessmentHistory();

  if (!user) {
    redirect("/login?next=/dashboard/assessments");
  }

  return (
    <WorkspaceShell
      actions={[
        { href: "/dashboard", label: "Back to overview", variant: "outline" },
        { href: "/assessment", label: "Start assessment" }
      ]}
      description="Review every saved intake in one place, reopen the detail view, and keep the next action visible."
      eyebrow="Saved assessments"
      title="Assessment history"
    >
      {items.length === 0 ? (
        <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 p-6 text-sm leading-6 text-slate-600">
          No saved assessments yet. Start with an intake and Tideus will keep each structured result available from this page.
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <Card className="border-slate-200 bg-slate-50 shadow-none" key={item.id}>
              <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-3xl">
                  <CardTitle className="text-lg">
                    {formatValue(item.current_status)} to {formatValue(item.goal)}
                  </CardTitle>
                  <CardDescription>{formatDate(item.created_at)}</CardDescription>
                </div>
                <Link className={cn(buttonVariants({ variant: "outline", size: "sm" }), "shrink-0")} href={`/dashboard/assessments/${item.id}`}>
                  View detail
                </Link>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm leading-6 text-slate-700">{item.result_summary}</p>
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-slate-900">
                  {item.result_next_steps[0] || "Open the saved result to choose the next step."}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </WorkspaceShell>
  );
}

function formatValue(value: string) {
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
