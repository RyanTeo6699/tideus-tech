import { BookDemoForm } from "@/components/site/book-demo-form";
import { EventLink } from "@/components/site/event-link";
import { PageHero } from "@/components/site/page-hero";
import { SectionContainer } from "@/components/site/section-container";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentProfileContext } from "@/lib/profile-server";

export default async function BookDemoPage() {
  const { user, profile } = await getCurrentProfileContext();
  const initialEmail = user?.email ?? profile?.email ?? "";

  return (
    <>
      <PageHero
        actions={
          <EventLink
            className={buttonVariants({ size: "lg" })}
            eventType="landing_cta_clicked"
            href="/start-case"
            metadata={{
              sourceSurface: "book-demo-page",
              cta: "start-case"
            }}
          >
            Start a case
          </EventLink>
        }
        description="Use this page to request a walkthrough, signal early-access interest, or both. The funnel is intentionally narrow and centered on the two supported workflows."
        eyebrow="Book Demo"
        title="Book a demo or join the early waitlist for the case workspace."
      />

      <SectionContainer className="pb-24">
        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <Card>
            <CardHeader>
              <CardTitle>Best fit for a demo</CardTitle>
              <CardDescription>The product is most useful to people working inside the supported workflows right now.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                "Visitor Record preparation workflows",
                "Study Permit Extension preparation workflows",
                "Teams exploring a checklist-first case review product",
                "People who want to reduce cleanup before a professional review"
              ].map((item) => (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700" key={item}>
                  {item}
                </div>
              ))}
            </CardContent>
          </Card>

          <BookDemoForm initialEmail={initialEmail} />
        </div>
      </SectionContainer>
    </>
  );
}
