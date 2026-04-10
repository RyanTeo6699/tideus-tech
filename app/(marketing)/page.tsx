import { CTASection } from "@/components/site/cta-section";
import { FeatureCard } from "@/components/site/feature-card";
import { HeroSection } from "@/components/site/hero-section";
import { SectionContainer } from "@/components/site/section-container";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getSupportedUseCases } from "@/lib/case-workflows";
import { getLocaleContext } from "@/lib/i18n/server";
import { getFaqItems, getHomeValueProps, getTrustBoundaryPoints, getWorkflowSteps } from "@/lib/site";

export default async function HomePage() {
  const { locale, messages } = await getLocaleContext();
  const homeValueProps = getHomeValueProps(locale);
  const supportedUseCases = getSupportedUseCases(locale);
  const workflowSteps = getWorkflowSteps(locale);
  const trustBoundaryPoints = getTrustBoundaryPoints(locale);
  const faqItems = getFaqItems(locale);

  return (
    <>
      <HeroSection />

      <SectionContainer className="py-20" id="value-props">
        <div className="mb-10 max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">{messages.home.valuePropsEyebrow}</p>
          <h2 className="mt-4 font-serif text-4xl text-foreground">{messages.home.valuePropsTitle}</h2>
          <p className="mt-4 text-base leading-7 text-muted-foreground">{messages.home.valuePropsDescription}</p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {homeValueProps.map((item) => (
            <FeatureCard description={item.description} eyebrow={item.eyebrow} key={item.title} title={item.title} />
          ))}
        </div>
      </SectionContainer>

      <SectionContainer className="py-20" id="use-cases">
        <div className="mb-10 max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">{messages.home.supportedEyebrow}</p>
          <h2 className="mt-4 font-serif text-4xl text-foreground">{messages.home.supportedTitle}</h2>
          <p className="mt-4 text-base leading-7 text-muted-foreground">{messages.home.supportedDescription}</p>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          {supportedUseCases.map((item) => (
            <FeatureCard
              bullets={item.whatYouGet}
              cta={{ href: `/use-cases/${item.slug}`, label: messages.home.viewWorkflow }}
              description={item.description}
              eyebrow={item.eyebrow}
              key={item.title}
              title={item.title}
            />
          ))}
        </div>
      </SectionContainer>

      <SectionContainer className="py-20" id="how-it-works">
        <div className="mb-10 max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">{messages.home.workflowEyebrow}</p>
          <h2 className="mt-4 font-serif text-4xl text-foreground">{messages.home.workflowTitle}</h2>
          <p className="mt-4 text-base leading-7 text-muted-foreground">{messages.home.workflowDescription}</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {workflowSteps.map((item) => (
            <FeatureCard description={item.description} eyebrow={item.eyebrow} key={item.title} title={item.title} />
          ))}
        </div>
      </SectionContainer>

      <SectionContainer className="py-20" id="trust">
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="max-w-md">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">{messages.home.trustEyebrow}</p>
            <h2 className="mt-4 font-serif text-4xl text-foreground">{messages.home.trustTitle}</h2>
          </div>
          <div className="space-y-4">
            {trustBoundaryPoints.map((item) => (
              <Card key={item}>
                <CardHeader>
                  <CardTitle className="text-xl">{messages.home.trustCardTitle}</CardTitle>
                  <CardDescription>{item}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </SectionContainer>

      <SectionContainer className="py-20" id="faq">
        <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="max-w-md">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">{messages.home.faqEyebrow}</p>
            <h2 className="mt-4 font-serif text-4xl text-foreground">{messages.home.faqTitle}</h2>
          </div>
          <div className="space-y-4">
            {faqItems.map((item) => (
              <Card key={item.question}>
                <CardHeader>
                  <CardTitle className="text-xl">{item.question}</CardTitle>
                  <CardDescription>{item.answer}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </SectionContainer>

      <SectionContainer className="pb-20">
        <Card className="border-emerald-200/80 bg-emerald-50/80">
          <CardHeader>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-800">{messages.home.narrowingEyebrow}</p>
            <CardTitle className="font-serif text-4xl text-slate-950">{messages.home.narrowingTitle}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="max-w-3xl text-base leading-7 text-slate-700">{messages.home.narrowingDescription}</p>
          </CardContent>
        </Card>
      </SectionContainer>

      <CTASection />
    </>
  );
}
