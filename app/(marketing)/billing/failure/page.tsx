import Link from "next/link";

import { SectionContainer } from "@/components/site/section-container";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getLocaleContext } from "@/lib/i18n/server";
import { pickLocale } from "@/lib/i18n/workspace";

export default async function BillingFailurePage() {
  const { locale } = await getLocaleContext();

  return (
    <SectionContainer className="py-20">
      <Card className="border-red-200 bg-red-50/70">
        <CardHeader>
          <Badge variant="secondary" className="mb-4 w-fit">
            {pickLocale(locale, "结账异常", "結帳異常")}
          </Badge>
          <CardTitle className="text-3xl">{pickLocale(locale, "暂时无法确认 Pro 开通", "暫時無法確認 Pro 開通")}</CardTitle>
          <CardDescription>
            {pickLocale(
              locale,
              "如果你已经完成付款，请稍后回到工作台查看方案状态。若状态没有更新，请联系 Tideus 支持。",
              "如果你已經完成付款，請稍後回到工作台查看方案狀態。若狀態沒有更新，請聯絡 Tideus 支援。"
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row">
          <Link className={buttonVariants({ size: "sm" })} href="/dashboard">
            {pickLocale(locale, "返回案件工作台", "返回案件工作台")}
          </Link>
          <Link className={buttonVariants({ variant: "outline", size: "sm" })} href="/pricing">
            {pickLocale(locale, "重新查看方案", "重新查看方案")}
          </Link>
        </CardContent>
      </Card>
    </SectionContainer>
  );
}
