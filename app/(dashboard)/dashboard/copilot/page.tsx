import Link from "next/link";
import { redirect } from "next/navigation";

import { WorkspaceShell } from "@/components/dashboard/workspace-shell";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentLocale } from "@/lib/i18n/server";
import { pickLocale } from "@/lib/i18n/workspace";
import { getCopilotThreadHistory } from "@/lib/legacy/history";
import { cn } from "@/lib/utils";

export default async function DashboardCopilotPage() {
  const { user, items } = await getCopilotThreadHistory();
  const locale = await getCurrentLocale();

  if (!user) {
    redirect("/login?next=/dashboard/copilot");
  }

  return (
    <WorkspaceShell
      actions={[
        { href: "/dashboard", label: pickLocale(locale, "返回总览", "返回總覽"), variant: "outline" },
        { href: "/dashboard/cases", label: pickLocale(locale, "打开案件工作台", "打開案件工作台") }
      ]}
      description={pickLocale(
        locale,
        "这些较早的助手线程仅为迁移连续性而保留在归档中，不再属于主要产品路径。",
        "這些較早的助手執行緒僅為遷移連續性而保留在歸檔中，不再屬於主要產品路徑。"
      )}
      eyebrow={pickLocale(locale, "迁移归档", "遷移歸檔")}
      title={pickLocale(locale, "助手迁移归档", "助手遷移歸檔")}
    >
      {items.length === 0 ? (
        <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 p-6 text-sm leading-6 text-slate-600">
          {pickLocale(
            locale,
            "迁移归档中暂时没有保存的助手线程。当前产品流程优先围绕已保存案件、材料状态和结构化审查结果展开。",
            "遷移歸檔中暫時沒有儲存的助手執行緒。目前產品流程優先圍繞已儲存案件、材料狀態和結構化審查結果展開。"
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <Card className="border-slate-200 bg-slate-50 shadow-none" key={item.id}>
              <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-3xl">
                  <CardTitle className="text-lg">{item.title}</CardTitle>
                  <CardDescription>
                    {pickLocale(locale, "最近更新", "最近更新")} {formatDate(item.updated_at, locale)}
                  </CardDescription>
                </div>
                <Link
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }), "shrink-0")}
                  href={`/copilot?thread=${item.id}`}
                >
                  {pickLocale(locale, "打开线程", "打開執行緒")}
                </Link>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm leading-6 text-slate-700">
                  {item.summary || pickLocale(locale, "尚未保存线程摘要。", "尚未儲存執行緒摘要。")}
                </p>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-700">
                  {pickLocale(
                    locale,
                    "仅当你需要回看迁移阶段的较早对话时，再打开这些归档线程。",
                    "僅當你需要回看遷移階段的較早對話時，再打開這些歸檔執行緒。"
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
