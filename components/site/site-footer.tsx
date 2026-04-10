import Link from "next/link";

import { getCurrentLocale } from "@/lib/i18n/server";
import { getFooterGroups, getSiteConfig } from "@/lib/site";
import { getAppMessages } from "@/lib/i18n/messages";

export async function SiteFooter() {
  const locale = await getCurrentLocale();
  const messages = getAppMessages(locale);
  const footerGroups = getFooterGroups(locale);
  const siteConfig = getSiteConfig(locale);

  return (
    <footer className="border-t border-border/80 bg-background/90">
      <div className="mx-auto grid w-full max-w-7xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.2fr_0.8fr_0.8fr] lg:px-8">
        <div className="max-w-md">
          <div className="mb-4 flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-foreground text-sm font-semibold text-background">
              {siteConfig.mark}
            </span>
            <div>
              <p className="text-base font-semibold text-foreground">{siteConfig.name}</p>
              <p className="text-sm text-muted-foreground">{messages.site.footerTagline}</p>
            </div>
          </div>
          <p className="text-sm leading-6 text-muted-foreground">{messages.site.footerDescription}</p>
        </div>

        {footerGroups.map((group) => (
          <div key={group.title}>
            <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">{group.title}</h2>
            <div className="mt-4 flex flex-col gap-3">
              {group.links.map((link) => (
                <Link className="text-sm text-foreground/80 transition-colors hover:text-foreground" href={link.href} key={link.href}>
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </footer>
  );
}
