import Link from "next/link";

import { PageHero } from "@/components/site/page-hero";
import { SectionContainer } from "@/components/site/section-container";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { siteConfig } from "@/lib/site";

export default function BookDemoPage() {
  return (
    <>
      <PageHero
        actions={
          <>
            <Link className={buttonVariants({ size: "lg" })} href="/start-case">
              Start a case
            </Link>
            <Link className={buttonVariants({ variant: "outline", size: "lg" })} href={`mailto:${siteConfig.supportEmail}`}>
              Email the team
            </Link>
          </>
        }
        description="Use this page if you want an early walkthrough of the wedge workflow or you want to signal interest while the supported scope is still intentionally small."
        eyebrow="Book Demo"
        title="Book a demo or join the early waitlist for the case workspace."
      />

      <SectionContainer className="pb-24">
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Best fit for a demo</CardTitle>
              <CardDescription>The product is most useful to people working inside the supported workflows right now.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                "Visitor Record preparation workflows",
                "Study Permit Extension preparation workflows",
                "Teams exploring a checklist-first case review product",
                "People who want to reduce cleanup before a professional review"
              ].map((item) => (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700" key={item}>
                  {item}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-emerald-200 bg-emerald-50/80">
            <CardHeader>
              <CardTitle>How to request access</CardTitle>
              <CardDescription>
                Start with an account if you want to see the current flow now, or email the team if you want a guided product walkthrough.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-2xl border border-emerald-200 bg-white p-4 text-sm leading-6 text-slate-700">
                Email: <span className="font-semibold text-slate-950">{siteConfig.supportEmail}</span>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link className={buttonVariants({ size: "sm" })} href="/signup">
                  Create account
                </Link>
                <Link className={buttonVariants({ variant: "outline", size: "sm" })} href={`mailto:${siteConfig.supportEmail}`}>
                  Request a demo
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </SectionContainer>
    </>
  );
}
