import { EventLink } from "@/components/site/event-link";
import { PageHero } from "@/components/site/page-hero";
import { SectionContainer } from "@/components/site/section-container";
import { FeatureCard } from "@/components/site/feature-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { getLocaleContext } from "@/lib/i18n/server";
import { getTrustBoundaryPoints, getWorkflowSteps } from "@/lib/site";

export default async function HowItWorksPage() {
  const { locale, messages } = await getLocaleContext();
  const workflowSteps = getWorkflowSteps(locale);
  const trustBoundaryPoints = getTrustBoundaryPoints(locale);

  return (
    <>
      <PageHero
        actions={
          <>
            <EventLink
              className={buttonVariants({ size: "lg" })}
              eventType="landing_cta_clicked"
              href="/start-case"
              metadata={{
                sourceSurface: "how-it-works-page",
                cta: "start-case"
              }}
            >
              {messages.howItWorks.startCase}
            </EventLink>
            <EventLink
              className={buttonVariants({ variant: "outline", size: "lg" })}
              eventType="book_demo_clicked"
              href="/book-demo"
              metadata={{
                sourceSurface: "how-it-works-page",
                cta: "book-demo"
              }}
            >
              {messages.howItWorks.bookDemo}
            </EventLink>
          </>
        }
        description={messages.howItWorks.description}
        eyebrow={messages.howItWorks.eyebrow}
        title={messages.howItWorks.title}
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
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">{messages.howItWorks.structuredOutputEyebrow}</p>
            <h2 className="mt-4 font-serif text-4xl text-foreground">{messages.howItWorks.structuredOutputTitle}</h2>
          </div>
          <Card className="border-emerald-200 bg-emerald-50/80">
            <CardHeader>
              <Badge variant="secondary" className="w-fit">
                {messages.howItWorks.reviewBlockBadge}
              </Badge>
              <CardTitle className="text-3xl">{messages.howItWorks.reviewBlockTitle}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              {messages.howItWorks.reviewBlockItems.map((item) => (
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
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">{messages.howItWorks.trustEyebrow}</p>
            <h2 className="mt-4 font-serif text-4xl text-foreground">{messages.howItWorks.trustTitle}</h2>
          </div>
          <div className="space-y-4">
            {trustBoundaryPoints.map((item) => (
              <Card key={item}>
                <CardHeader>
                  <CardTitle className="text-xl">{messages.howItWorks.trustCardTitle}</CardTitle>
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
