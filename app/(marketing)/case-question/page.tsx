import { CaseQuestionEntry } from "@/components/cases/case-question-entry";
import { EventLink } from "@/components/site/event-link";
import { PageHero } from "@/components/site/page-hero";
import { SectionContainer } from "@/components/site/section-container";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getSupportedUseCases } from "@/lib/case-workflows";
import { getLocaleContext } from "@/lib/i18n/server";

export default async function CaseQuestionPage() {
  const { locale, messages } = await getLocaleContext();
  const supportedUseCases = getSupportedUseCases(locale);

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
              {messages.caseQuestionPage.startCase}
            </EventLink>
            <EventLink
              className={buttonVariants({ variant: "outline", size: "lg" })}
              eventType="book_demo_clicked"
              href="/book-demo"
              metadata={{
                sourceSurface: "case-question-page-hero"
              }}
            >
              {messages.caseQuestionPage.bookDemo}
            </EventLink>
          </>
        }
        description={messages.caseQuestionPage.description}
        eyebrow={messages.caseQuestionPage.eyebrow}
        title={messages.caseQuestionPage.title}
      />

      <SectionContainer className="pb-12">
        <div className="grid gap-4 md:grid-cols-3">
          {messages.caseQuestionPage.boundaryItems.map((item) => (
            <Card className="border-slate-200 bg-slate-50 shadow-none" key={item}>
              <CardHeader>
                <CardTitle className="text-xl">{messages.caseQuestionPage.boundaryCardTitle}</CardTitle>
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
