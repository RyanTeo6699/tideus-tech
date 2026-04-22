import Link from "next/link";
import { redirect } from "next/navigation";

import { SectionContainer } from "@/components/site/section-container";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getLocaleContext } from "@/lib/i18n/server";
import { pickLocale } from "@/lib/i18n/workspace";
import { formatConsumerPlanStatus } from "@/lib/plans";
import { hasStripeBillingConfig, syncStripeCheckoutSessionForUser } from "@/lib/server/billing";
import { createClient } from "@/lib/supabase/server";

type BillingSuccessPageProps = {
  searchParams: Promise<{
    session_id?: string;
  }>;
};

export default async function BillingSuccessPage({ searchParams }: BillingSuccessPageProps) {
  const { locale } = await getLocaleContext();
  const { session_id: sessionId } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent("/billing/success")}`);
  }

  let syncedStatus: string | null = null;

  if (sessionId && hasStripeBillingConfig()) {
    try {
      const syncResult = await syncStripeCheckoutSessionForUser({
        sessionId,
        userId: user.id
      });
      syncedStatus = syncResult?.planStatus ?? null;
    } catch (error) {
      console.error("Unable to sync checkout success session", error);
    }
  }

  return (
    <SectionContainer className="py-20">
      <Card className="border-emerald-200 bg-emerald-50/70">
        <CardHeader>
          <Badge variant="secondary" className="mb-4 w-fit">
            {pickLocale(locale, "结账返回", "結帳返回")}
          </Badge>
          <CardTitle className="text-3xl">{pickLocale(locale, "Pro 开通正在同步", "Pro 開通正在同步")}</CardTitle>
          <CardDescription>
            {pickLocale(
              locale,
              "如果付款已经完成，系统会通过安全回调把 Pro 权限写入账户。你可以返回工作台继续案件工作流。",
              "如果付款已經完成，系統會透過安全回調把 Pro 權限寫入帳戶。你可以返回工作台繼續案件工作流程。"
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="rounded-2xl border border-emerald-200 bg-white p-4 text-sm leading-7 text-slate-700">
            {syncedStatus
              ? pickLocale(
                  locale,
                  `当前同步状态：${formatConsumerPlanStatus(syncedStatus, locale)}。`,
                  `目前同步狀態：${formatConsumerPlanStatus(syncedStatus, locale)}。`
                )
              : pickLocale(
                  locale,
                  "当前尚未确认最终订阅状态；如果刚完成付款，请稍等片刻再刷新工作台。",
                  "目前尚未確認最終訂閱狀態；如果剛完成付款，請稍等片刻再重新整理工作台。"
                )}
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link className={buttonVariants({ size: "sm" })} href="/dashboard">
              {pickLocale(locale, "返回案件工作台", "返回案件工作台")}
            </Link>
            <Link className={buttonVariants({ variant: "outline", size: "sm" })} href="/pricing">
              {pickLocale(locale, "查看方案状态", "查看方案狀態")}
            </Link>
          </div>
        </CardContent>
      </Card>
    </SectionContainer>
  );
}
