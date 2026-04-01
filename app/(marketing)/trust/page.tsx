import Link from "next/link";

import { PageHero } from "@/components/site/page-hero";
import { SectionContainer } from "@/components/site/section-container";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trustBoundaryPoints } from "@/lib/site";

const commitments = [
  "Tideus is not presented as government, legal counsel, or a universal immigration platform.",
  "The product is built to organize case prep, surface workflow gaps, and save structured review history for a narrow set of supported workflows.",
  "If the case facts move outside the supported workflow or the risk profile gets serious, the right next step is a professional review."
];

export default function TrustPage() {
  return (
    <>
      <PageHero
        actions={
          <>
            <Link className={buttonVariants({ size: "lg" })} href="/use-cases">
              View supported use cases
            </Link>
            <Link className={buttonVariants({ variant: "outline", size: "lg" })} href="/book-demo">
              Book demo
            </Link>
          </>
        }
        description="Trust here comes from narrow scope, structured review outputs, saved workflow history, and explicit handoff points when a human reviewer should take over."
        eyebrow="Trust & Boundaries"
        title="Tideus is a case workspace, not legal advice."
      />

      <SectionContainer className="pb-16">
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="max-w-md">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">Boundaries</p>
            <h2 className="mt-4 font-serif text-4xl text-foreground">The product only stays credible if the limits are visible.</h2>
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

      <SectionContainer className="pb-24">
        <Card>
          <CardHeader>
            <CardTitle>What Tideus does commit to</CardTitle>
            <CardDescription>
              The promise is narrow: help users organize a case package, see what is still missing, and carry clean workflow history into the next serious review step.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            {commitments.map((item) => (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700" key={item}>
                {item}
              </div>
            ))}
          </CardContent>
        </Card>
      </SectionContainer>
    </>
  );
}
