import type { ReactNode } from "react";
import Link from "next/link";

import { siteConfig } from "@/lib/site";
import { SectionContainer } from "@/components/site/section-container";
import { buttonVariants } from "@/components/ui/button";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-50">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.22),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(59,130,246,0.2),_transparent_26%)]" />
      <SectionContainer className="relative flex min-h-screen flex-col py-6">
        <header className="flex items-center justify-between gap-4">
          <Link className="flex items-center gap-3" href="/">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-sm font-semibold text-slate-950">
              {siteConfig.mark}
            </span>
            <div>
              <p className="font-semibold">{siteConfig.name}</p>
              <p className="text-sm text-slate-400">Secure account access</p>
            </div>
          </Link>
          <Link
            className={buttonVariants({
              variant: "outline",
              size: "sm",
              className: "border-white/15 bg-white/5 text-white hover:bg-white/10"
            })}
            href="/"
          >
            Back home
          </Link>
        </header>
        <div className="flex flex-1 items-center py-10">{children}</div>
      </SectionContainer>
    </div>
  );
}
