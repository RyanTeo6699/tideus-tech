import Link from "next/link";

import { FeatureCard } from "@/components/site/feature-card";
import { PageHero } from "@/components/site/page-hero";
import { SectionContainer } from "@/components/site/section-container";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getSupportedUseCases } from "@/lib/case-workflows";
import { getLocaleContext } from "@/lib/i18n/server";

export default async function UseCasesPage() {
  const { locale, messages } = await getLocaleContext();
  const supportedUseCases = getSupportedUseCases(locale);

  return (
    <>
      <PageHero
        actions={
          <>
            <Link className={buttonVariants({ size: "lg" })} href="/start-case">
              {messages.useCases.startCase}
            </Link>
            <Link className={buttonVariants({ variant: "outline", size: "lg" })} href="/trust">
              {messages.useCases.reviewBoundaries}
            </Link>
          </>
        }
        description={messages.useCases.description}
        eyebrow={messages.useCases.eyebrow}
        title={messages.useCases.title}
      />

      <SectionContainer className="pb-16">
        <div className="grid gap-6 lg:grid-cols-2">
          {supportedUseCases.map((item) => (
            <FeatureCard
              bullets={item.whatYouGet}
              cta={{ href: `/use-cases/${item.slug}`, label: messages.useCases.detailCta }}
              description={item.description}
              eyebrow={item.eyebrow}
              key={item.slug}
              title={item.title}
            />
          ))}
        </div>
      </SectionContainer>

      <SectionContainer className="pb-24">
        <Card>
          <CardHeader>
            <CardTitle>{messages.useCases.outOfScopeTitle}</CardTitle>
            <CardDescription>{messages.useCases.outOfScopeDescription}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            {messages.useCases.outOfScopeItems.map((item) => (
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
