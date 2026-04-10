import { notFound, redirect } from "next/navigation";

import { DetailShell } from "@/components/dashboard/detail-shell";
import type { Json } from "@/lib/database.types";
import { getCurrentLocale } from "@/lib/i18n/server";
import { pickLocale } from "@/lib/i18n/workspace";
import { getComparisonDetail } from "@/lib/legacy/history";

type ComparisonDetailPageProps = {
  params: Promise<{
    comparisonId: string;
  }>;
};

export default async function ComparisonDetailPage({ params }: ComparisonDetailPageProps) {
  const { comparisonId } = await params;
  const detail = await getComparisonDetail(comparisonId);
  const locale = await getCurrentLocale();

  if (!detail.user) {
    redirect(`/login?next=/dashboard/comparisons/${comparisonId}`);
  }

  if (!detail.record) {
    notFound();
  }

  const snapshot = readSnapshot(detail.record.input_snapshot);

  return (
    <DetailShell
      backHref="/dashboard/comparisons"
      backLabel={pickLocale(locale, "返回比较迁移归档", "返回比較遷移歸檔")}
      eyebrow={pickLocale(locale, "迁移归档", "遷移歸檔")}
      facts={[
        { label: pickLocale(locale, "创建时间", "建立時間"), value: formatDate(detail.record.created_at, locale) },
        { label: pickLocale(locale, "主比较项", "主比較項"), value: `${detail.record.option_a} vs ${detail.record.option_b}` },
        { label: pickLocale(locale, "优先级", "優先級"), value: formatValue(detail.record.priority, locale) },
        { label: pickLocale(locale, "决策期限", "決策期限"), value: formatValue(readSnapshotString(snapshot, "decisionDeadline"), locale) },
        { label: pickLocale(locale, "方案 A 时间匹配", "方案 A 時間匹配"), value: formatValue(readSnapshotString(snapshot, "optionATimelineFit"), locale) },
        { label: pickLocale(locale, "方案 B 时间匹配", "方案 B 時間匹配"), value: formatValue(readSnapshotString(snapshot, "optionBTimelineFit"), locale) }
      ]}
      notes={detail.record.profile_notes}
      notesLabel={pickLocale(locale, "已保存资料备注", "已儲存資料備註")}
      primaryHref="/start-case"
      primaryLabel={pickLocale(locale, "开始新案件", "開始新案件")}
      sections={[
        { title: pickLocale(locale, "为什么重要", "為什麼重要"), items: detail.record.result_why_matters },
        { title: pickLocale(locale, "风险或约束", "風險或限制"), items: detail.record.result_risks_and_constraints, tone: "warning" },
        { title: pickLocale(locale, "缺失信息", "缺失資訊"), items: detail.record.result_missing_information },
        { title: pickLocale(locale, "下一步", "下一步"), items: detail.record.result_next_steps, tone: "action" }
      ]}
      snapshotFacts={[
        { label: pickLocale(locale, "方案 A", "方案 A"), value: readSnapshotString(snapshot, "optionA") || detail.record.option_a },
        { label: pickLocale(locale, "方案 A 材料负担", "方案 A 材料負擔"), value: formatValue(readSnapshotString(snapshot, "optionADocumentLoad"), locale) },
        { label: pickLocale(locale, "方案 A 时间匹配", "方案 A 時間匹配"), value: formatValue(readSnapshotString(snapshot, "optionATimelineFit"), locale) },
        { label: pickLocale(locale, "方案 B", "方案 B"), value: readSnapshotString(snapshot, "optionB") || detail.record.option_b },
        { label: pickLocale(locale, "方案 B 材料负担", "方案 B 材料負擔"), value: formatValue(readSnapshotString(snapshot, "optionBDocumentLoad"), locale) },
        { label: pickLocale(locale, "方案 B 时间匹配", "方案 B 時間匹配"), value: formatValue(readSnapshotString(snapshot, "optionBTimelineFit"), locale) }
      ]}
      snapshotTitle={pickLocale(locale, "比较输入快照", "比較輸入快照")}
      subtitle={pickLocale(
        locale,
        "在同一页面查看迁移阶段保存的权衡记录、主建议和备用逻辑。",
        "在同一頁面查看遷移階段儲存的權衡紀錄、主建議和備用邏輯。"
      )}
      summary={detail.record.result_summary}
      title={`${detail.record.option_a} vs ${detail.record.option_b}`}
    />
  );
}

function readSnapshot(value: Json) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, Json>;
}

function readSnapshotString(snapshot: Record<string, Json>, key: string) {
  const value = snapshot[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function formatValue(value: string | null | undefined, locale: "zh-CN" | "zh-TW") {
  if (!value) {
    return pickLocale(locale, "尚未记录", "尚未記錄");
  }

  const labels: Record<string, { cn: string; tw: string }> = {
    speed: { cn: "速度", tw: "速度" },
    documentation: { cn: "材料负担", tw: "材料負擔" },
    certainty: { cn: "确定性", tw: "確定性" },
    "within-30": { cn: "30 天内", tw: "30 天內" },
    "within-90": { cn: "90 天内", tw: "90 天內" },
    flexible: { cn: "相对灵活", tw: "相對靈活" },
    strong: { cn: "匹配强", tw: "匹配強" },
    moderate: { cn: "中等匹配", tw: "中等匹配" },
    weak: { cn: "匹配弱", tw: "匹配弱" },
    low: { cn: "低", tw: "低" },
    medium: { cn: "中", tw: "中" },
    high: { cn: "高", tw: "高" }
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
