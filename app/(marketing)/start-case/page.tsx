import Link from "next/link";

import { getCurrentProfileContext } from "@/lib/profile-server";
import { getCaseStartHref, supportedUseCases } from "@/lib/case-workflows";
import { EventLink } from "@/components/site/event-link";
import { PageHero } from "@/components/site/page-hero";
import { SectionContainer } from "@/components/site/section-container";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getLocaleContext } from "@/lib/i18n/server";

export default async function StartCasePage() {
  const { user } = await getCurrentProfileContext();
  const { locale, messages } = await getLocaleContext();
  const supportedUseCases = getSupportedUseCases(locale);

  return (
    <>
      <PageHero
        actions={
          <>
            <EventLink
              className={buttonVariants({ size: "lg" })}
              eventType="book_demo_clicked"
              href="/book-demo"
              metadata={{
                sourceSurface: "start-case-page-hero"
              }}
            >
              {messages.startCase.bookDemo}
            </EventLink>
            <Link className={buttonVariants({ variant: "outline", size: "lg" })} href={user ? "/dashboard" : "/login?next=/dashboard"}>
              {user ? messages.startCase.openWorkspace : messages.startCase.loginToSave}
            </Link>
          </>
        }
        description={messages.startCase.description}
        eyebrow={messages.startCase.eyebrow}
        title={messages.startCase.title}
      />

      <SectionContainer className="pb-24">
        <div className="grid gap-6 lg:grid-cols-2">
          {supportedUseCases.map((item) => (
            <Card key={item.slug}>
              <CardHeader>
                <CardTitle className="text-3xl">{item.shortTitle}</CardTitle>
                <CardDescription>{item.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  {item.fitSignals.map((signal) => (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700" key={signal}>
                      {signal}
                    </div>
                  ))}
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <EventLink
                    className={buttonVariants({ size: "sm" })}
                    eventType="start_case_selected"
                    href={getCaseStartHref(item.slug)}
                    metadata={{
                      sourceSurface: "start-case-page",
                      useCase: item.slug
                    }}
                  >
                    {`${messages.startCase.startUseCase} ${item.shortTitle}`}
                  </EventLink>
                  <Link className={buttonVariants({ variant: "outline", size: "sm" })} href={`/use-cases/${item.slug}`}>
                    {messages.startCase.viewWorkflowDetail}
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </SectionContainer>
    </>
  );
}
