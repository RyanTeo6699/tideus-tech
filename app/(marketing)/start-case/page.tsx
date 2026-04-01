import Link from "next/link";

import { getCurrentProfileContext } from "@/lib/profile-server";
import { getCaseStartHref, supportedUseCases } from "@/lib/case-workflows";
import { PageHero } from "@/components/site/page-hero";
import { SectionContainer } from "@/components/site/section-container";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function StartCasePage() {
  const { user } = await getCurrentProfileContext();

  return (
    <>
      <PageHero
        actions={
          <>
            <Link className={buttonVariants({ size: "lg" })} href="/use-cases">
              Compare supported scenarios
            </Link>
            <Link className={buttonVariants({ variant: "outline", size: "lg" })} href={user ? "/dashboard" : "/login?next=/dashboard"}>
              {user ? "Open case dashboard" : "Log in to save cases"}
            </Link>
          </>
        }
        description="Choose a supported case type, move into the intake, and start building a saved case record you can resume later."
        eyebrow="Start A Case"
        title="Pick the workflow that matches the case you need to prepare."
      />

      <SectionContainer className="pb-24">
        <div className="grid gap-6 lg:grid-cols-2">
          {supportedUseCases.map((item) => (
            <Card key={item.slug}>
              <CardHeader>
                <CardTitle className="text-3xl">{item.shortTitle}</CardTitle>
                <CardDescription>{item.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  {item.fitSignals.map((signal) => (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700" key={signal}>
                      {signal}
                    </div>
                  ))}
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Link className={buttonVariants({ size: "sm" })} href={getCaseStartHref(item.slug)}>
                    Start {item.shortTitle}
                  </Link>
                  <Link className={buttonVariants({ variant: "outline", size: "sm" })} href={`/use-cases/${item.slug}`}>
                    View workflow detail
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </SectionContainer>
    </>
  );
}
