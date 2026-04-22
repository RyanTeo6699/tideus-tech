import Link from "next/link";

import { LanguageSwitcher } from "@/components/site/language-switcher";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentLocale } from "@/lib/i18n/server";
import { pickLocale } from "@/lib/i18n/workspace";
import { formatProfessionalAccessDeniedMessage } from "@/lib/permissions";
import { cn } from "@/lib/utils";

export async function ProfessionalAccessLocked() {
  const locale = await getCurrentLocale();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-3">
          <Link
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "border-white/15 bg-white/5 text-white hover:bg-white/10"
            )}
            href="/dashboard"
          >
            {pickLocale(locale, "返回消费者工作台", "返回消費者工作台")}
          </Link>
          <LanguageSwitcher />
        </div>

        <Card className="border-white/10 bg-white text-slate-950">
          <CardHeader>
            <CardTitle>{pickLocale(locale, "专业端权限未开通", "專業端權限未開通")}</CardTitle>
            <CardDescription>{formatProfessionalAccessDeniedMessage(locale)}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row">
            <Link className={buttonVariants({ size: "sm" })} href="/for-professionals">
              {pickLocale(locale, "查看专业端说明", "查看專業端說明")}
            </Link>
            <Link className={buttonVariants({ variant: "outline", size: "sm" })} href="/book-demo">
              {pickLocale(locale, "预约专业端开通", "預約專業端開通")}
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
