import { CaseQuestionEntry } from "@/components/cases/case-question-entry";
import { EventLink } from "@/components/site/event-link";
import { PageHero } from "@/components/site/page-hero";
import { SectionContainer } from "@/components/site/section-container";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supportedUseCases } from "@/lib/case-workflows";

export default function CaseQuestionPage() {
  return (
    <>
      <PageHero
        actions={
          <>
            <EventLink
              className={buttonVariants({ size: "lg" })}
              eventType="use_case_cta_clicked"
              href="/start-case"
              metadata={{
                sourceSurface: "case-question-page-hero",
                cta: "start-case"
              }}
            >
              Start a Case
            </EventLink>
            <EventLink
              className={buttonVariants({ variant: "outline", size: "lg" })}
              eventType="book_demo_clicked"
              href="/book-demo"
              metadata={{
                sourceSurface: "case-question-page-hero"
              }}
            >
              Book demo
            </EventLink>
          </>
        }
        description="Ask a focused question tied to Visitor Record or Study Permit Extension prep, then turn the structured answer into workspace actions."
        eyebrow="AI Front Door"
        title="Ask a case-prep question without leaving the workflow."
      />

      <SectionContainer className="pb-12">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            "Structured answers instead of open-ended chat",
            "Current wedge scenarios only",
            "Tracker actions that can become a saved case workspace"
          ].map((item) => (
            <Card className="border-slate-200 bg-slate-50 shadow-none" key={item}>
              <CardHeader>
                <CardTitle className="text-xl">Boundary</CardTitle>
                <CardDescription>{item}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </SectionContainer>

      <SectionContainer className="pb-24">
        <CaseQuestionEntry
          useCases={supportedUseCases.map((item) => ({
            slug: item.slug,
            shortTitle: item.shortTitle,
            description: item.description
          }))}
        />
      </SectionContainer>
    </>
  );
}
