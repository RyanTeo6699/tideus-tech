import { PageHero } from "@/components/site/page-hero";
import { SectionContainer } from "@/components/site/section-container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { siteConfig } from "@/lib/site";

const sections = [
  {
    title: "Product boundaries",
    body: `${siteConfig.name} provides structured planning support. It should not be treated as legal advice, an official immigration determination, or a substitute for regulated professional review.`
  },
  {
    title: "Responsible use",
    body: "Users should supply accurate information, review outputs critically, and confirm any important filing, status, or eligibility decisions with qualified professionals before acting."
  },
  {
    title: "Future changes",
    body: "The product, route protection, and integrations will continue to evolve. Terms should be expanded before public launch to cover account ownership, data usage, service limitations, and dispute handling."
  }
];

export default function TermsPage() {
  return (
    <>
      <PageHero
        description="This page sets the current product boundary and should be expanded further before public launch."
        eyebrow="Terms"
        title="Product boundaries should be explicit from the start."
      />

      <SectionContainer className="pb-24">
        <div className="grid gap-6">
          {sections.map((section) => (
            <Card key={section.title}>
              <CardHeader>
                <CardTitle>{section.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="max-w-4xl text-base leading-7 text-muted-foreground">{section.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </SectionContainer>
    </>
  );
}
