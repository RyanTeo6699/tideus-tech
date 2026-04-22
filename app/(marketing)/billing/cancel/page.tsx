import Link from "next/link";

import { SectionContainer } from "@/components/site/section-container";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getLocaleContext } from "@/lib/i18n/server";
import { pickLocale } from "@/lib/i18n/workspace";

export default async function BillingCancelPage() {
  const { locale } = await getLocaleContext();

  return (
    <SectionContainer className="py-20">
      <Card className="border-amber-200 bg-amber-50/70">
        <CardHeader>
          <Badge variant="secondary" className="mb-4 w-fit">
            {pickLocale(locale, "结账未完成", "結帳未完成")}
          </Badge>
          <CardTitle className="text-3xl">{pickLocale(locale, "Pro 尚未开通", "Pro 尚未開通")}</CardTitle>
          <CardDescription>
            {pickLocale(
              locale,
              "你已经离开结账流程，账户会保持当前方案。可以回到价格页重新开始，或先继续使用当前工作流。",
              "你已經離開結帳流程，帳戶會保持目前方案。可以回到價格頁重新開始，或先繼續使用目前工作流程。"
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row">
          <Link className={buttonVariants({ size: "sm" })} href="/pricing">
            {pickLocale(locale, "返回方案页", "返回方案頁")}
          </Link>
          <Link className={buttonVariants({ variant: "outline", size: "sm" })} href="/dashboard">
            {pickLocale(locale, "继续当前工作台", "繼續目前工作台")}
          </Link>
        </CardContent>
      </Card>
    </SectionContainer>
  );
}
