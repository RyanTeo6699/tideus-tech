import { PageHero } from "@/components/site/page-hero";
import { SectionContainer } from "@/components/site/section-container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { siteConfig } from "@/lib/site";

const sections = [
  {
    title: "Account data",
    body: "Tideus stores authenticated account records such as email address and basic profile details needed to keep the case workspace tied to the right person."
  },
  {
    title: "Case workspace data",
    body: "The current product stores case records, intake responses, document-state tracking, review outputs, workflow status history, and saved review versions so users can resume a case without starting over."
  },
  {
    title: "Workflow history",
    body: "Tideus also stores structured case events such as case creation, intake completion, materials updates, review generation, and case resume events. The goal is product continuity and future workflow analysis, not a user-facing analytics dashboard in this sprint."
  },
  {
    title: "Service boundaries",
    body: "Tideus is not a government service or a law firm. The stored data supports case preparation workflows and structured review blocks inside the product."
  },
  {
    title: "Contact",
    body: `For privacy questions about Tideus, use ${siteConfig.supportEmail}.`
  }
];

export default function PrivacyPage() {
  return (
    <>
      <PageHero
        description="This page describes the data Tideus stores for the current case-first workflow product: account records, case records, document states, review outputs, and workflow history."
        eyebrow="Privacy"
        title="Privacy language should match the case workspace the product actually is."
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
