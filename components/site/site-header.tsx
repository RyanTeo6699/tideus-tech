import Link from "next/link";

import { LanguageSwitcher } from "@/components/site/language-switcher";
import { EventLink } from "@/components/site/event-link";
import { buttonVariants } from "@/components/ui/button";
import { getCurrentLocale } from "@/lib/i18n/server";
import { getAppMessages } from "@/lib/i18n/messages";
import { getMainNav, getSiteConfig } from "@/lib/site";

export async function SiteHeader() {
  const locale = await getCurrentLocale();
  const messages = getAppMessages(locale);
  const siteConfig = getSiteConfig(locale);
  const mainNav = getMainNav(locale);

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link className="flex items-center gap-3" href="/">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-foreground text-sm font-semibold text-background shadow-panel">
            {siteConfig.mark}
          </span>
          <span className="flex flex-col">
            <span className="text-base font-semibold text-foreground">{siteConfig.name}</span>
            <span className="text-xs text-muted-foreground">{messages.site.tagline}</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-8 lg:flex">
          {mainNav.map((item) => (
            <Link className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground" href={item.href} key={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <LanguageSwitcher compact />
          <Link className={buttonVariants({ variant: "ghost", size: "sm" })} href="/login">
            {messages.authForm.loginLink}
          </Link>
          <EventLink
            className={buttonVariants({ variant: "outline", size: "sm" })}
            eventType="book_demo_clicked"
            href="/book-demo"
            metadata={{
              sourceSurface: "site-header",
                cta: "book-demo"
              }}
            >
            {messages.ctaSection.bookDemo}
          </EventLink>
          <EventLink
            className={buttonVariants({ size: "sm" })}
            eventType="landing_cta_clicked"
            href="/start-case"
            metadata={{
              sourceSurface: "site-header",
                cta: "start-case"
              }}
            >
            {messages.ctaSection.startCase}
          </EventLink>
        </div>

        <details className="relative md:hidden">
          <summary className="flex h-11 w-11 cursor-pointer list-none items-center justify-center rounded-2xl border border-border bg-background text-sm font-semibold text-foreground">
            {messages.switcher.label}
          </summary>
          <div className="absolute right-0 top-14 w-72 rounded-[28px] border border-border bg-background p-4 shadow-soft">
            <div className="mb-4">
              <LanguageSwitcher />
            </div>
            <div className="flex flex-col gap-2">
              {mainNav.map((item) => (
                <Link className="rounded-2xl px-3 py-2 text-sm font-medium text-foreground hover:bg-muted" href={item.href} key={item.href}>
                  {item.label}
                </Link>
              ))}
            </div>
            <div className="mt-4 grid gap-2">
              <Link className={buttonVariants({ variant: "outline", size: "sm" })} href="/login">
                {messages.authForm.loginLink}
              </Link>
              <EventLink
                className={buttonVariants({ variant: "outline", size: "sm" })}
                eventType="book_demo_clicked"
                href="/book-demo"
                metadata={{
                  sourceSurface: "mobile-menu",
                  cta: "book-demo"
                }}
              >
                {messages.ctaSection.bookDemo}
              </EventLink>
              <EventLink
                className={buttonVariants({ size: "sm" })}
                eventType="landing_cta_clicked"
                href="/start-case"
                metadata={{
                  sourceSurface: "mobile-menu",
                  cta: "start-case"
                }}
              >
                {messages.ctaSection.startCase}
              </EventLink>
            </div>
          </div>
        </details>
      </div>
    </header>
  );
}
