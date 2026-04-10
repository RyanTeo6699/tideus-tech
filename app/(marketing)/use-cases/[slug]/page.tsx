import Link from "next/link";
import { notFound } from "next/navigation";

import { EventLink } from "@/components/site/event-link";
import { PageHero } from "@/components/site/page-hero";
import { SectionContainer } from "@/components/site/section-container";
import { FeatureCard } from "@/components/site/feature-card";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCaseStartHref, getSupportedUseCases, getUseCaseDefinition } from "@/lib/case-workflows";
import { getLocaleContext } from "@/lib/i18n/server";

type UseCaseDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export function generateStaticParams() {
  return getSupportedUseCases().map((item) => ({
    slug: item.slug
  }));
}

export default async function UseCaseDetailPage({ params }: UseCaseDetailPageProps) {
  const { slug } = await params;
  const { locale, messages } = await getLocaleContext();
  const useCase = getUseCaseDefinition(slug, locale);

  if (!useCase) {
    notFound();
  }

  return (
    <>
      <PageHero
        actions={
          <>
            <EventLink
              className={buttonVariants({ size: "lg" })}
              eventType="use_case_cta_clicked"
              href={getCaseStartHref(useCase.slug)}
              metadata={{
                sourceSurface: "use-case-detail",
                cta: "start-this-case",
                useCase: useCase.slug
              }}
            >
              {messages.useCaseDetail.startThisCase}
            </EventLink>
            <EventLink
              className={buttonVariants({ variant: "outline", size: "lg" })}
              eventType="book_demo_clicked"
              href="/book-demo"
              metadata={{
                sourceSurface: "use-case-detail",
                useCase: useCase.slug
              }}
            >
              {messages.useCaseDetail.bookDemo}
            </EventLink>
          </>
        }
        description={useCase.detailSummary}
        eyebrow={useCase.eyebrow}
        title={useCase.title}
      />

      <SectionContainer className="pb-16">
        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <Card>
            <CardHeader>
              <CardTitle>{messages.useCaseDetail.designedTitle}</CardTitle>
              <CardDescription>{useCase.outcomeSummary}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {useCase.whatYouGet.map((item) => (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700" key={item}>
                  {item}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{messages.useCaseDetail.goodFitTitle}</CardTitle>
              <CardDescription>{messages.useCaseDetail.goodFitDescription}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {useCase.fitSignals.map((item) => (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-slate-900" key={item}>
                  {item}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </SectionContainer>

      <SectionContainer className="pb-16">
        <div className="grid gap-6 md:grid-cols-2">
          <FeatureCard
            bullets={useCase.expectedDocuments.map((item) => item.label)}
            description={messages.useCaseDetail.materialsDescription}
            eyebrow={messages.useCaseDetail.materialsEyebrow}
            title={useCase.materialsTitle}
          />
          <FeatureCard
            bullets={messages.useCaseDetail.reviewBullets}
            description={messages.useCaseDetail.reviewDescription}
            eyebrow={messages.useCaseDetail.reviewEyebrow}
            title={useCase.reviewTitle}
          />
        </div>
      </SectionContainer>

      <SectionContainer className="pb-24">
        <Card>
          <CardHeader>
            <CardTitle>{messages.useCaseDetail.notForTitle}</CardTitle>
            <CardDescription>{messages.useCaseDetail.notForDescription}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            {useCase.notFor.map((item) => (
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
