import Link from "next/link";

import { PageHero } from "@/components/site/page-hero";
import { SectionContainer } from "@/components/site/section-container";
import { FeatureCard } from "@/components/site/feature-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { trustBoundaryPoints, workflowSteps } from "@/lib/site";

export default function HowItWorksPage() {
  return (
    <>
      <PageHero
        actions={
          <>
            <Link className={buttonVariants({ size: "lg" })} href="/start-case">
              Start a case
            </Link>
            <Link className={buttonVariants({ variant: "outline", size: "lg" })} href="/use-cases">
              View supported use cases
            </Link>
          </>
        }
        description="Tideus is designed to move one narrow case through a clean workflow: intake, materials, structured review, and saved follow-up."
        eyebrow="How It Works"
        title="The product is built to clean up a case package before the real review starts."
      />

      <SectionContainer className="pb-16">
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {workflowSteps.map((step) => (
            <FeatureCard description={step.description} eyebrow={step.eyebrow} key={step.title} title={step.title} />
          ))}
        </div>
      </SectionContainer>

      <SectionContainer className="pb-16">
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="max-w-md">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">Structured output</p>
            <h2 className="mt-4 font-serif text-4xl text-foreground">The result is meant to look like a case review block, not a conversation log.</h2>
          </div>
          <Card className="border-emerald-200 bg-emerald-50/80">
            <CardHeader>
              <Badge variant="secondary" className="w-fit">
                Review block
              </Badge>
              <CardTitle className="text-3xl">Every case review is centered on the same six signals.</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              {["Readiness status", "Checklist", "Missing items", "Risk flags", "Timeline note", "Next steps"].map((item) => (
                <div className="rounded-2xl border border-emerald-200 bg-white p-4 text-sm font-medium text-slate-900" key={item}>
                  {item}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </SectionContainer>

      <SectionContainer className="pb-24">
        <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="max-w-md">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">Trust</p>
            <h2 className="mt-4 font-serif text-4xl text-foreground">The workflow stays useful because the boundaries are explicit.</h2>
          </div>
          <div className="space-y-4">
            {trustBoundaryPoints.map((item) => (
              <Card key={item}>
                <CardHeader>
                  <CardTitle className="text-xl">Boundary</CardTitle>
                  <CardDescription>{item}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </SectionContainer>
    </>
  );
}
