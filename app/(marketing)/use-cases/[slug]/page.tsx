import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHero } from "@/components/site/page-hero";
import { SectionContainer } from "@/components/site/section-container";
import { FeatureCard } from "@/components/site/feature-card";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCaseStartHref, getUseCaseDefinition, supportedUseCases } from "@/lib/case-workflows";

type UseCaseDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export function generateStaticParams() {
  return supportedUseCases.map((item) => ({
    slug: item.slug
  }));
}

export default async function UseCaseDetailPage({ params }: UseCaseDetailPageProps) {
  const { slug } = await params;
  const useCase = getUseCaseDefinition(slug);

  if (!useCase) {
    notFound();
  }

  return (
    <>
      <PageHero
        actions={
          <>
            <Link className={buttonVariants({ size: "lg" })} href={getCaseStartHref(useCase.slug)}>
              Start this case
            </Link>
            <Link className={buttonVariants({ variant: "outline", size: "lg" })} href="/use-cases">
              Back to use cases
            </Link>
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
              <CardTitle>What this workflow is designed to do</CardTitle>
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
              <CardTitle>Good fit for this wedge</CardTitle>
              <CardDescription>These are the signs that this workflow is the right starting point.</CardDescription>
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
            description="These are the expected document types the case workspace will track for this workflow."
            eyebrow="Materials"
            title={useCase.materialsTitle}
          />
          <FeatureCard
            bullets={["Readiness status", "Checklist", "Missing items", "Risk flags", "Timeline note", "Next steps"]}
            description="The review result is structured to support a real case handoff or final quality pass."
            eyebrow="Review"
            title={useCase.reviewTitle}
          />
        </div>
      </SectionContainer>

      <SectionContainer className="pb-24">
        <Card>
          <CardHeader>
            <CardTitle>Not for this workflow</CardTitle>
            <CardDescription>
              These cases should not be treated as routine wedge-workflow prep just because the labels sound related.
            </CardDescription>
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
