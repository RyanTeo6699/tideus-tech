import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type DetailFact = {
  label: string;
  value: string;
};

type DetailSection = {
  title: string;
  items: string[];
  tone?: "default" | "warning" | "action";
};

type DetailShellProps = {
  eyebrow: string;
  title: string;
  subtitle: string;
  summary: string;
  facts: DetailFact[];
  sections: DetailSection[];
  snapshotTitle: string;
  snapshotFacts: DetailFact[];
  notesLabel: string;
  notes: string;
  backHref: string;
  backLabel: string;
  primaryHref: string;
  primaryLabel: string;
};

export function DetailShell({
  eyebrow,
  title,
  subtitle,
  summary,
  facts,
  sections,
  snapshotTitle,
  snapshotFacts,
  notesLabel,
  notes,
  backHref,
  backLabel,
  primaryHref,
  primaryLabel
}: DetailShellProps) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <Link className={cn(buttonVariants({ variant: "outline", size: "sm" }), "border-white/15 bg-white/5 text-white hover:bg-white/10")} href={backHref}>
            {backLabel}
          </Link>
          <Link className={buttonVariants({ size: "sm" })} href={primaryHref}>
            {primaryLabel}
          </Link>
        </div>

        <Card className="border-white/10 bg-white text-slate-950">
          <CardHeader>
            <Badge variant="secondary" className="mb-4 w-fit">
              {eyebrow}
            </Badge>
            <CardTitle className="text-3xl">{title}</CardTitle>
            <CardDescription>{subtitle}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="max-w-4xl text-lg leading-8 text-slate-700">{summary}</p>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {facts.map((fact) => (
            <Card className="border-white/10 bg-white/5 text-slate-50" key={`${fact.label}-${fact.value}`}>
              <CardHeader>
                <CardDescription className="text-slate-400">{fact.label}</CardDescription>
                <CardTitle className="text-xl">{fact.value}</CardTitle>
              </CardHeader>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          {sections.map((section) => (
            <Card className="border-white/10 bg-white text-slate-950" key={section.title}>
              <CardHeader>
                <CardTitle>{section.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {section.items.map((item) => (
                    <div
                      className={cn("rounded-2xl border p-4 text-sm leading-6", {
                        "border-slate-200 bg-slate-50 text-slate-700": !section.tone || section.tone === "default",
                        "border-amber-200 bg-amber-50 text-slate-900": section.tone === "warning",
                        "border-emerald-200 bg-emerald-50 text-slate-900": section.tone === "action"
                      })}
                      key={item}
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border-white/10 bg-white text-slate-950">
          <CardHeader>
            <CardTitle>{snapshotTitle}</CardTitle>
            <CardDescription>Saved inputs stay visible here so the recommendation can be reviewed in context.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {snapshotFacts.map((fact) => (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4" key={`${fact.label}-${fact.value}`}>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{fact.label}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-900">{fact.value}</p>
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{notesLabel}</p>
              <p className="mt-3 text-sm leading-7 text-slate-700">{notes}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
