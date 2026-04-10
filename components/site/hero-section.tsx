import { siteConfig } from "@/lib/site";
import { EventLink } from "@/components/site/event-link";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SectionContainer } from "@/components/site/section-container";

export function HeroSection() {
  return (
    <div className="relative overflow-hidden pb-20 pt-10 sm:pb-24 sm:pt-16">
      <div className="absolute inset-x-0 top-0 -z-10 h-[34rem] bg-[radial-gradient(circle_at_top_left,_rgba(52,211,153,0.18),_transparent_42%),radial-gradient(circle_at_top_right,_rgba(59,130,246,0.14),_transparent_34%),linear-gradient(180deg,_rgba(255,255,255,0.9),_rgba(245,247,251,0.4))]" />
      <SectionContainer>
        <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="max-w-3xl">
            <Badge variant="secondary" className="mb-6">
              Workflow-first case prep
            </Badge>
            <h1 className="max-w-3xl font-serif text-5xl leading-tight text-foreground sm:text-6xl">
              Prepare the case before the review starts costing time.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
              {siteConfig.name} is being repositioned as an AI-powered case workspace for high-frequency, document-heavy application and extension prep. Phase 1 stays intentionally narrow: supported scenarios, structured review outputs, and a saved case dashboard.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <EventLink
                className={buttonVariants({ size: "lg" })}
                eventType="landing_cta_clicked"
                href="/start-case"
                metadata={{
                  sourceSurface: "home-hero",
                  cta: "start-case"
                }}
              >
                Start a case
              </EventLink>
              <EventLink
                className={buttonVariants({ variant: "outline", size: "lg" })}
                eventType="book_demo_clicked"
                href="/book-demo"
                metadata={{
                  sourceSurface: "home-hero",
                  cta: "book-demo"
                }}
              >
                Book demo
              </EventLink>
            </div>
            <div className="mt-10 grid gap-6 border-t border-border pt-8 sm:grid-cols-3">
              <div>
                <p className="font-serif text-3xl text-foreground">2</p>
                <p className="mt-2 text-sm text-muted-foreground">Supported wedge workflows in the first release window.</p>
              </div>
              <div>
                <p className="font-serif text-3xl text-foreground">8</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Structured review blocks: readiness, checklist, missing items, risks, timeline, next steps, context, references.
                </p>
              </div>
              <div>
                <p className="font-serif text-3xl text-foreground">1</p>
                <p className="mt-2 text-sm text-muted-foreground">Saved case workspace that keeps intake, materials, and review versions together.</p>
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            <Card className="overflow-hidden border-white/70 bg-white/80">
              <CardHeader>
                <Badge variant="secondary" className="w-fit">
                  Review output example
                </Badge>
                <CardTitle className="text-2xl">What a focused case workspace should feel like</CardTitle>
                <CardDescription>
                  Clear readiness signals, visible document gaps, and next actions that move the package forward.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-[24px] bg-slate-950 p-5 text-slate-50 shadow-panel">
                  <p className="text-xs uppercase tracking-[0.24em] text-emerald-300">Study Permit Extension review</p>
                  <p className="mt-3 text-lg font-semibold">Needs attention: the package is close, but enrolment and tuition evidence still need a cleaner version.</p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Missing items</p>
                      <p className="mt-2 text-sm">Updated enrolment letter and final tuition proof.</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Next step</p>
                      <p className="mt-2 text-sm">Tighten the explanation letter and refresh the evidence list before review.</p>
                    </div>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-[24px] border border-border bg-background p-5">
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Materials tracking</p>
                    <p className="mt-2 text-sm leading-6 text-foreground">Expected documents stay visible so the case can move from intake to package review without guesswork.</p>
                  </div>
                  <div className="rounded-[24px] border border-border bg-background p-5">
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Review versions</p>
                    <p className="mt-2 text-sm leading-6 text-foreground">Each pass produces a saved readiness snapshot with risks and next steps, not a disposable AI thread.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </SectionContainer>
    </div>
  );
}
