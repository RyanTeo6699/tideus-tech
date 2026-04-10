import Link from "next/link";
import { redirect } from "next/navigation";

import { WorkspaceShell } from "@/components/dashboard/workspace-shell";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentLocale } from "@/lib/i18n/server";
import { pickLocale } from "@/lib/i18n/workspace";
import { getAssessmentHistory } from "@/lib/legacy/history";
import { cn } from "@/lib/utils";

export default async function DashboardAssessmentsPage() {
  const { user, items } = await getAssessmentHistory();
  const locale = await getCurrentLocale();

  if (!user) {
    redirect("/login?next=/dashboard/assessments");
  }

  return (
    <WorkspaceShell
      actions={[
        { href: "/dashboard", label: pickLocale(locale, "返回总览", "返回總覽"), variant: "outline" },
        { href: "/start-case", label: pickLocale(locale, "开始案件", "開始案件") }
      ]}
      description={pickLocale(
        locale,
        "这些较早的结构化 intake 仅为迁移连续性而保留在归档中，不再属于主要产品工作流。",
        "這些較早的結構化 intake 僅為遷移連續性而保留在歸檔中，不再屬於主要產品工作流。"
      )}
      eyebrow={pickLocale(locale, "迁移归档", "遷移歸檔")}
      title={pickLocale(locale, "评估迁移归档", "評估遷移歸檔")}
    >
      {items.length === 0 ? (
        <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 p-6 text-sm leading-6 text-slate-600">
          {pickLocale(
            locale,
            "迁移归档中暂时没有评估记录。当前产品流程已经改为从案件建立、材料整理和保存审查版本开始。",
            "遷移歸檔中暫時沒有評估紀錄。目前產品流程已改為從案件建立、材料整理和儲存審查版本開始。"
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <Card className="border-slate-200 bg-slate-50 shadow-none" key={item.id}>
              <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-3xl">
                  <CardTitle className="text-lg">
                    {formatValue(item.current_status, locale)} {pickLocale(locale, "到", "到")} {formatValue(item.goal, locale)}
                  </CardTitle>
                  <CardDescription>{formatDate(item.created_at, locale)}</CardDescription>
                </div>
                <Link
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }), "shrink-0")}
                  href={`/dashboard/assessments/${item.id}`}
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
                      "如果你需要回看较早阶段的结构化输出，再打开这条旧记录。",
                      "如果你需要回看較早階段的結構化輸出，再打開這條舊紀錄。"
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

function formatValue(value: string, locale: "zh-CN" | "zh-TW") {
  const labels: Record<string, { cn: string; tw: string }> = {
    "outside-canada": { cn: "加拿大境外", tw: "加拿大境外" },
    visitor: { cn: "访客", tw: "訪客" },
    student: { cn: "学生", tw: "學生" },
    worker: { cn: "工作者", tw: "工作者" },
    "permanent-residence": { cn: "永久居民", tw: "永久居民" },
    "study-permit": { cn: "学习许可", tw: "學習許可" },
    "work-permit": { cn: "工作许可", tw: "工作許可" },
    "family-sponsorship": { cn: "家庭担保", tw: "家庭擔保" }
  };

  const label = labels[value];
  if (label) {
    return locale === "zh-TW" ? label.tw : label.cn;
  }

  return value;
}

function formatDate(value: string, locale: "zh-CN" | "zh-TW") {
  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(value));
}
