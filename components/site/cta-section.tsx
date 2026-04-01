import { EventLink } from "@/components/site/event-link";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SectionContainer } from "@/components/site/section-container";

export function CTASection() {
  return (
    <SectionContainer className="pb-24">
      <div className="relative overflow-hidden rounded-[36px] border border-border/80 bg-slate-950 px-6 py-12 text-slate-50 shadow-panel sm:px-10 sm:py-16">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(16,185,129,0.25),_transparent_30%),radial-gradient(circle_at_bottom_left,_rgba(59,130,246,0.2),_transparent_32%)]" />
        <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <Badge variant="inverse" className="mb-5">
              Narrow and review-ready
            </Badge>
            <h2 className="font-serif text-4xl leading-tight sm:text-5xl">Start with a supported case type and build a cleaner package from there.</h2>
            <p className="mt-5 text-base leading-7 text-slate-300">
              Tideus is focused on structured case prep: intake, materials tracking, review output, and a saved dashboard that helps the next professional conversation start with context.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <EventLink
              className={buttonVariants({ variant: "secondary", size: "lg" })}
              eventType="landing_cta_clicked"
              href="/start-case"
              metadata={{
                sourceSurface: "home-cta",
                cta: "start-case"
              }}
            >
              Start a case
            </EventLink>
            <EventLink
              className={buttonVariants({
                variant: "outline",
                size: "lg",
                className: "border-white/20 bg-white/5 text-white hover:bg-white/10"
              })}
              eventType="book_demo_clicked"
              href="/book-demo"
              metadata={{
                sourceSurface: "home-cta",
                cta: "book-demo"
              }}
            >
              Book demo
            </EventLink>
          </div>
        </div>
      </div>
    </SectionContainer>
  );
}
