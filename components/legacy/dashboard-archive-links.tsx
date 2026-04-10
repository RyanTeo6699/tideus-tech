import Link from "next/link";

import { getCurrentLocale } from "@/lib/i18n/server";
import { getWorkspaceCopy } from "@/lib/i18n/workspace";
import { legacyWorkspaceLinks } from "@/lib/legacy/site";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export async function DashboardArchiveLinks() {
  const locale = await getCurrentLocale();
  const copy = getWorkspaceCopy(locale);

  return (
    <Card className="border-slate-200 bg-slate-50/40 text-slate-950 shadow-none">
      <CardHeader>
        <CardTitle className="text-lg">{copy.archive.title}</CardTitle>
        <CardDescription>{copy.archive.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <details className="rounded-2xl border border-dashed border-slate-300 bg-white/80">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-4 text-sm font-medium text-slate-950">
            <div>
              <p>{copy.archive.summaryTitle}</p>
              <p className="mt-1 text-sm font-normal leading-6 text-slate-600">{copy.archive.summaryDescription}</p>
            </div>
            <span className="text-xs uppercase tracking-[0.18em] text-slate-500">{copy.archive.secondary}</span>
          </summary>
          <div className="grid gap-3 border-t border-slate-200 p-4 md:grid-cols-3">
            {legacyWorkspaceLinks.map((link) => (
              <Link
                className="rounded-2xl border border-dashed border-slate-300 bg-white p-4 transition-colors hover:border-slate-400 hover:bg-slate-50"
                href={link.href}
                key={link.href}
              >
                <p className="text-sm font-semibold text-slate-950">{link.label}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{copy.archive.linkDescription}</p>
              </Link>
            ))}
          </div>
        </details>
      </CardContent>
    </Card>
  );
}
