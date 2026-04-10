import Link from "next/link";
import { redirect } from "next/navigation";

import { WorkspaceShell } from "@/components/dashboard/workspace-shell";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentLocale } from "@/lib/i18n/server";
import { pickLocale } from "@/lib/i18n/workspace";
import { getComparisonHistory } from "@/lib/legacy/history";
import { cn } from "@/lib/utils";

export default async function DashboardComparisonsPage() {
  const { user, items } = await getComparisonHistory();
  const locale = await getCurrentLocale();

  if (!user) {
    redirect("/login?next=/dashboard/comparisons");
  }

  return (
    <WorkspaceShell
      actions={[
        { href: "/dashboard", label: pickLocale(locale, "返回总览", "返回總覽"), variant: "outline" },
        { href: "/start-case", label: pickLocale(locale, "开始案件", "開始案件") }
      ]}
      description={pickLocale(
        locale,
        "这些较早的权衡记录仅为迁移连续性而保留在归档中，不属于当前主要案件工作流。",
        "這些較早的權衡紀錄僅為遷移連續性而保留在歸檔中，不屬於目前主要案件工作流。"
      )}
      eyebrow={pickLocale(locale, "迁移归档", "遷移歸檔")}
      title={pickLocale(locale, "比较迁移归档", "比較遷移歸檔")}
    >
      {items.length === 0 ? (
        <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 p-6 text-sm leading-6 text-slate-600">
          {pickLocale(
            locale,
            "迁移归档中暂时没有比较记录。当前产品流程优先围绕案件 intake、材料跟踪和审查版本。",
            "遷移歸檔中暫時沒有比較紀錄。目前產品流程優先圍繞案件 intake、材料追蹤和審查版本。"
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <Card className="border-slate-200 bg-slate-50 shadow-none" key={item.id}>
              <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-3xl">
                  <CardTitle className="text-lg">
                    {item.option_a} vs {item.option_b}
                  </CardTitle>
                  <CardDescription>{formatDate(item.created_at, locale)}</CardDescription>
                </div>
                <Link
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }), "shrink-0")}
                  href={`/dashboard/comparisons/${item.id}`}
                >
                  {pickLocale(locale, "查看详情", "查看詳情")}
                </Link>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm leading-6 text-slate-700">{item.result_summary}</p>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-700">
                  {item.result_next_steps[0] ||
                    pickLocale(
                      locale,
                      "如果你需要回看较早阶段的权衡输出，再打开这条旧记录。",
                      "如果你需要回看較早階段的權衡輸出，再打開這條舊紀錄。"
                    )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </WorkspaceShell>
  );
}

function formatDate(value: string, locale: "zh-CN" | "zh-TW") {
  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(value));
}
