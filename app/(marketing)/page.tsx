import { CTASection } from "@/components/site/cta-section";
import { FeatureCard } from "@/components/site/feature-card";
import { HeroSection } from "@/components/site/hero-section";
import { SectionContainer } from "@/components/site/section-container";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supportedUseCases } from "@/lib/case-workflows";
import { faqItems, homeValueProps, trustBoundaryPoints, workflowSteps } from "@/lib/site";

export default function HomePage() {
  return (
    <>
      <HeroSection />

      <SectionContainer className="py-20" id="value-props">
        <div className="mb-10 max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">Why this wedge works</p>
          <h2 className="mt-4 font-serif text-4xl text-foreground">A case workspace is more useful than a broad tool shelf.</h2>
          <p className="mt-4 text-base leading-7 text-muted-foreground">
            Tideus is being narrowed on purpose: fewer scenarios, clearer workflow boundaries, and output blocks that help a real case move forward.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {homeValueProps.map((item) => (
            <FeatureCard description={item.description} eyebrow={item.eyebrow} key={item.title} title={item.title} />
          ))}
        </div>
      </SectionContainer>

      <SectionContainer className="py-20" id="use-cases">
        <div className="mb-10 max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">Supported scenarios</p>
          <h2 className="mt-4 font-serif text-4xl text-foreground">Start with the cases the product is actually designed to support.</h2>
          <p className="mt-4 text-base leading-7 text-muted-foreground">
            This first phase stays intentionally narrow so the workflow can be correct, structured, and demo-ready instead of broad and vague.
          </p>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          {supportedUseCases.map((item) => (
            <FeatureCard
              bullets={item.whatYouGet}
              cta={{ href: `/use-cases/${item.slug}`, label: "View workflow" }}
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
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">Workflow</p>
          <h2 className="mt-4 font-serif text-4xl text-foreground">The product is built to move one case through one review path.</h2>
          <p className="mt-4 text-base leading-7 text-muted-foreground">
            The flow is narrow on purpose: choose a case type, complete the intake, mark the materials, and generate a saved review output.
          </p>
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
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">Trust boundaries</p>
            <h2 className="mt-4 font-serif text-4xl text-foreground">Helpful case prep has to be clear about what it is not.</h2>
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

      <SectionContainer className="py-20" id="faq">
        <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="max-w-md">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">FAQ</p>
            <h2 className="mt-4 font-serif text-4xl text-foreground">Questions people ask before trusting a workflow product with a real case.</h2>
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
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-800">Why the product is narrowing</p>
            <CardTitle className="font-serif text-4xl text-slate-950">The goal is a cleaner case package, not a bigger site.</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="max-w-3xl text-base leading-7 text-slate-700">
              Tideus now prioritizes workflow correctness over generic AI breadth. That means fewer promises, stronger structure, and a better handoff point when a professional needs to step in.
            </p>
          </CardContent>
        </Card>
      </SectionContainer>

      <CTASection />
    </>
  );
}
