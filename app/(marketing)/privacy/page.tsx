import { PageHero } from "@/components/site/page-hero";
import { SectionContainer } from "@/components/site/section-container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { siteConfig } from "@/lib/site";

const sections = [
  {
    title: "What this policy covers",
    body: "Tideus stores authenticated account records, saved assessments, saved comparisons, and Copilot thread data in Supabase. Analytics and monitoring integrations should still be documented before production launch."
  },
  {
    title: "What may be added later",
    body: "Future versions may process profile details, pathway comparisons, copilot messages, analytics events, and error telemetry. Those integrations should be documented again before launch, alongside retention periods and consent choices."
  },
  {
    title: "Contact",
    body: `For privacy questions about Tideus, use ${siteConfig.supportEmail} until a production support workflow is established.`
  }
];

export default function PrivacyPage() {
  return (
    <>
      <PageHero
        description="This page describes how Tideus handles account and workflow data in its current product version. It should be expanded further before public launch."
        eyebrow="Privacy"
        title="Privacy language should be clear before the product goes live."
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
