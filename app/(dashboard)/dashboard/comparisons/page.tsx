import Link from "next/link";
import { redirect } from "next/navigation";

import { WorkspaceShell } from "@/components/dashboard/workspace-shell";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getComparisonHistory } from "@/lib/history";
import { cn } from "@/lib/utils";

export default async function DashboardComparisonsPage() {
  const { user, items } = await getComparisonHistory();

  if (!user) {
    redirect("/login?next=/dashboard/comparisons");
  }

  return (
    <WorkspaceShell
      actions={[
        { href: "/dashboard", label: "Back to overview", variant: "outline" },
        { href: "/compare", label: "Start comparison" }
      ]}
      description="Review saved tradeoffs, reopen structured detail views, and keep lead versus fallback paths easy to revisit."
      eyebrow="Saved comparisons"
      title="Comparison history"
    >
      {items.length === 0 ? (
        <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 p-6 text-sm leading-6 text-slate-600">
          No saved comparisons yet. Compare two routes and Tideus will keep the saved tradeoff available from this page.
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <Card className="border-slate-200 bg-slate-50 shadow-none" key={item.id}>
              <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-3xl">
                  <CardTitle className="text-lg">
                    {item.option_a} vs {item.option_b}
                  </CardTitle>
                  <CardDescription>{formatDate(item.created_at)}</CardDescription>
                </div>
                <Link className={cn(buttonVariants({ variant: "outline", size: "sm" }), "shrink-0")} href={`/dashboard/comparisons/${item.id}`}>
                  View detail
                </Link>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm leading-6 text-slate-700">{item.result_summary}</p>
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-slate-900">
                  {item.result_next_steps[0] || "Open the saved comparison to confirm the lead option."}
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
