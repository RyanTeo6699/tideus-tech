import Link from "next/link";
import { redirect } from "next/navigation";

import { WorkspaceShell } from "@/components/dashboard/workspace-shell";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCopilotThreadHistory } from "@/lib/history";
import { cn } from "@/lib/utils";

export default async function DashboardCopilotPage() {
  const { user, items } = await getCopilotThreadHistory();

  if (!user) {
    redirect("/login?next=/dashboard/copilot");
  }

  return (
    <WorkspaceShell
      actions={[
        { href: "/dashboard", label: "Back to overview", variant: "outline" },
        { href: "/copilot", label: "Open Copilot" }
      ]}
      description="Review saved threads, reopen structured turn history, and continue the next question without losing context."
      eyebrow="Saved Copilot threads"
      title="Copilot history"
    >
      {items.length === 0 ? (
        <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 p-6 text-sm leading-6 text-slate-600">
          No saved Copilot threads yet. Start a focused question and Tideus will keep the structured answer available from this page.
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <Card className="border-slate-200 bg-slate-50 shadow-none" key={item.id}>
              <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-3xl">
                  <CardTitle className="text-lg">{item.title}</CardTitle>
                  <CardDescription>Updated {formatDate(item.updated_at)}</CardDescription>
                </div>
                <Link className={cn(buttonVariants({ variant: "outline", size: "sm" }), "shrink-0")} href={`/copilot?thread=${item.id}`}>
                  Open thread
                </Link>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm leading-6 text-slate-700">{item.summary || "No thread summary saved yet."}</p>
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-slate-900">
                  Continue this thread when the next decision or blocker is clear enough to keep the context focused.
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
