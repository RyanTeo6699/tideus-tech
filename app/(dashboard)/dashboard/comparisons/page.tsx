import Link from "next/link";
import { redirect } from "next/navigation";

import { WorkspaceShell } from "@/components/dashboard/workspace-shell";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getComparisonHistory } from "@/lib/legacy/history";
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
        { href: "/start-case", label: "Start a case" }
      ]}
      description="These older tradeoff records remain accessible in the migration archive for continuity, but they are not part of the primary case workflow."
      eyebrow="Migration Archive"
      title="Comparison migration archive"
    >
      {items.length === 0 ? (
        <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 p-6 text-sm leading-6 text-slate-600">
          No comparison records are currently stored in the migration archive. The current product flow prioritizes case intake, materials tracking, and review versions.
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
                <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-700">
                  {item.result_next_steps[0] || "Open the legacy record if you need to review the earlier tradeoff output."}
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
