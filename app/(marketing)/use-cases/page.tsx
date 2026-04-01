import Link from "next/link";

import { FeatureCard } from "@/components/site/feature-card";
import { PageHero } from "@/components/site/page-hero";
import { SectionContainer } from "@/components/site/section-container";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supportedUseCases } from "@/lib/case-workflows";

const intentionallyOutOfScope = [
  "Broad permanent residence strategy work",
  "Universal pathway comparison across many categories",
  "Open-ended legal triage or representation",
  "Complex, highly discretionary scenarios outside the supported workflows"
];

export default function UseCasesPage() {
  return (
    <>
      <PageHero
        actions={
          <>
            <Link className={buttonVariants({ size: "lg" })} href="/start-case">
              Start a case
            </Link>
            <Link className={buttonVariants({ variant: "outline", size: "lg" })} href="/trust">
              Review boundaries
            </Link>
          </>
        }
        description="The first release window stays intentionally small. Tideus only surfaces workflows it can structure cleanly and review consistently."
        eyebrow="Use Cases"
        title="Supported now: a very small number of high-frequency, document-heavy case types."
      />

      <SectionContainer className="pb-16">
        <div className="grid gap-6 lg:grid-cols-2">
          {supportedUseCases.map((item) => (
            <FeatureCard
              bullets={item.whatYouGet}
              cta={{ href: `/use-cases/${item.slug}`, label: "View workflow detail" }}
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
            <CardTitle>Intentionally out of scope right now</CardTitle>
            <CardDescription>
              The fastest way to make the product useful is to keep phase 1 narrow and avoid pretending it can support every scenario.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            {intentionallyOutOfScope.map((item) => (
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
