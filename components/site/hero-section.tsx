import { getCurrentLocale } from "@/lib/i18n/server";
import { getAppMessages } from "@/lib/i18n/messages";
import { EventLink } from "@/components/site/event-link";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SectionContainer } from "@/components/site/section-container";

export async function HeroSection() {
  const locale = await getCurrentLocale();
  const messages = getAppMessages(locale);

  return (
    <div className="relative overflow-hidden pb-20 pt-10 sm:pb-24 sm:pt-16">
      <div className="absolute inset-x-0 top-0 -z-10 h-[34rem] bg-[radial-gradient(circle_at_top_left,_rgba(52,211,153,0.18),_transparent_42%),radial-gradient(circle_at_top_right,_rgba(59,130,246,0.14),_transparent_34%),linear-gradient(180deg,_rgba(255,255,255,0.9),_rgba(245,247,251,0.4))]" />
      <SectionContainer>
        <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="max-w-3xl">
            <Badge variant="secondary" className="mb-6">
              {messages.hero.badge}
            </Badge>
            <h1 className="max-w-3xl font-serif text-5xl leading-tight text-foreground sm:text-6xl">{messages.hero.title}</h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">{messages.hero.description}</p>
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
                {messages.hero.startCase}
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
                {messages.hero.bookDemo}
              </EventLink>
            </div>
            <div className="mt-10 grid gap-6 border-t border-border pt-8 sm:grid-cols-3">
              {messages.hero.stats.map((item) => (
                <div key={`${item.value}-${item.label}`}>
                  <p className="font-serif text-3xl text-foreground">{item.value}</p>
                  <p className="mt-2 text-sm text-muted-foreground">{item.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4">
            <Card className="overflow-hidden border-white/70 bg-white/80">
              <CardHeader>
                <Badge variant="secondary" className="w-fit">
                  {messages.hero.exampleBadge}
                </Badge>
                <CardTitle className="text-2xl">{messages.hero.exampleTitle}</CardTitle>
                <CardDescription>{messages.hero.exampleDescription}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-[24px] bg-slate-950 p-5 text-slate-50 shadow-panel">
                  <p className="text-xs uppercase tracking-[0.24em] text-emerald-300">{messages.hero.exampleReviewTitle}</p>
                  <p className="mt-3 text-lg font-semibold">{messages.hero.exampleReviewSummary}</p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{messages.hero.exampleMissingLabel}</p>
                      <p className="mt-2 text-sm">{messages.hero.exampleMissingValue}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{messages.hero.exampleNextStepLabel}</p>
                      <p className="mt-2 text-sm">{messages.hero.exampleNextStepValue}</p>
                    </div>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-[24px] border border-border bg-background p-5">
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{messages.hero.materialsLabel}</p>
                    <p className="mt-2 text-sm leading-6 text-foreground">{messages.hero.materialsDescription}</p>
                  </div>
                  <div className="rounded-[24px] border border-border bg-background p-5">
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{messages.hero.reviewHistoryLabel}</p>
                    <p className="mt-2 text-sm leading-6 text-foreground">{messages.hero.reviewHistoryDescription}</p>
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
