import { notFound, redirect } from "next/navigation";

import { DetailShell } from "@/components/dashboard/detail-shell";
import type { Json } from "@/lib/database.types";
import { getCurrentLocale } from "@/lib/i18n/server";
import { pickLocale } from "@/lib/i18n/workspace";
import { getAssessmentDetail } from "@/lib/legacy/history";

type AssessmentDetailPageProps = {
  params: Promise<{
    assessmentId: string;
  }>;
};

export default async function AssessmentDetailPage({ params }: AssessmentDetailPageProps) {
  const { assessmentId } = await params;
  const detail = await getAssessmentDetail(assessmentId);
  const locale = await getCurrentLocale();

  if (!detail.user) {
    redirect(`/login?next=/dashboard/assessments/${assessmentId}`);
  }

  if (!detail.record) {
    notFound();
  }

  const snapshot = readSnapshot(detail.record.input_snapshot);

  return (
    <DetailShell
      backHref="/dashboard/assessments"
      backLabel={pickLocale(locale, "返回评估迁移归档", "返回評估遷移歸檔")}
      eyebrow={pickLocale(locale, "迁移归档", "遷移歸檔")}
      facts={[
        { label: pickLocale(locale, "创建时间", "建立時間"), value: formatDate(detail.record.created_at, locale) },
        { label: pickLocale(locale, "当前身份", "目前身分"), value: formatValue(detail.record.current_status, locale) },
        { label: pickLocale(locale, "主要目标", "主要目標"), value: formatValue(detail.record.goal, locale) },
        { label: pickLocale(locale, "时间线", "時間線"), value: formatValue(detail.record.timeline, locale) },
        {
          label: pickLocale(locale, "国籍", "國籍"),
          value: readSnapshotString(snapshot, "citizenship") || pickLocale(locale, "尚未记录", "尚未記錄")
        },
        {
          label: pickLocale(locale, "省份偏好", "省份偏好"),
          value: readSnapshotString(snapshot, "provincePreference") || pickLocale(locale, "尚未记录", "尚未記錄")
        }
      ]}
      notes={detail.record.notes}
      notesLabel={pickLocale(locale, "已保存背景备注", "已儲存背景備註")}
      primaryHref="/start-case"
      primaryLabel={pickLocale(locale, "开始新案件", "開始新案件")}
      sections={[
        { title: pickLocale(locale, "为什么重要", "為什麼重要"), items: detail.record.result_why_matters },
        { title: pickLocale(locale, "风险或约束", "風險或限制"), items: detail.record.result_risks_and_constraints, tone: "warning" },
        { title: pickLocale(locale, "缺失信息", "缺失資訊"), items: detail.record.result_missing_information },
        { title: pickLocale(locale, "下一步", "下一步"), items: detail.record.result_next_steps, tone: "action" }
      ]}
      snapshotFacts={[
        { label: pickLocale(locale, "年龄段", "年齡段"), value: formatValue(readSnapshotString(snapshot, "ageBand"), locale) },
        { label: pickLocale(locale, "婚姻状态", "婚姻狀態"), value: formatValue(readSnapshotString(snapshot, "maritalStatus"), locale) },
        { label: pickLocale(locale, "教育程度", "教育程度"), value: formatValue(readSnapshotString(snapshot, "educationLevel"), locale) },
        { label: pickLocale(locale, "英语考试", "英語考試"), value: formatValue(readSnapshotString(snapshot, "englishTestStatus"), locale) },
        { label: pickLocale(locale, "加拿大经历", "加拿大經歷"), value: formatValue(readSnapshotString(snapshot, "canadianExperience"), locale) },
        { label: pickLocale(locale, "海外经历", "海外經歷"), value: formatValue(readSnapshotString(snapshot, "foreignExperience"), locale) },
        { label: pickLocale(locale, "工作录用支持", "工作錄用支持"), value: formatValue(readSnapshotString(snapshot, "jobOfferSupport"), locale) },
        {
          label: pickLocale(locale, "拒签历史", "拒簽歷史"),
          value: readSnapshotBoolean(snapshot, "refusalHistoryFlag") ? pickLocale(locale, "是", "是") : pickLocale(locale, "否", "否")
        }
      ]}
      snapshotTitle={pickLocale(locale, "评估资料快照", "評估資料快照")}
      snapshotDescription={pickLocale(
        locale,
        "已保存的输入会持续显示在这里，方便结合完整背景审阅这条旧评估记录。",
        "已儲存的輸入會持續顯示在這裡，方便結合完整背景審閱這條舊評估紀錄。"
      )}
      subtitle={pickLocale(
        locale,
        "在同一页面查看迁移阶段保存的案件资料收集、结构化建议和下一步动作。",
        "在同一頁面查看遷移階段儲存的案件資料收集、結構化建議和下一步動作。"
      )}
      summary={detail.record.result_summary}
      title={`${formatValue(detail.record.current_status, locale)} ${pickLocale(locale, "到", "到")} ${formatValue(detail.record.goal, locale)}`}
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

function readSnapshotBoolean(snapshot: Record<string, Json>, key: string) {
  return snapshot[key] === true;
}

function formatValue(value: string | null | undefined, locale: "zh-CN" | "zh-TW") {
  if (!value) {
    return pickLocale(locale, "尚未记录", "尚未記錄");
  }

  const labels: Record<string, { cn: string; tw: string }> = {
    "outside-canada": { cn: "加拿大境外", tw: "加拿大境外" },
    visitor: { cn: "访客", tw: "訪客" },
    student: { cn: "学生", tw: "學生" },
    worker: { cn: "工作者", tw: "工作者" },
    "permanent-residence": { cn: "永久居民", tw: "永久居民" },
    "study-permit": { cn: "学习许可", tw: "學習許可" },
    "work-permit": { cn: "工作许可", tw: "工作許可" },
    "family-sponsorship": { cn: "家庭担保", tw: "家庭擔保" },
    "0-6": { cn: "0 到 6 个月", tw: "0 到 6 個月" },
    "6-12": { cn: "6 到 12 个月", tw: "6 到 12 個月" },
    "12-plus": { cn: "12 个月以上", tw: "12 個月以上" },
    "18-24": { cn: "18 到 24 岁", tw: "18 到 24 歲" },
    "25-34": { cn: "25 到 34 岁", tw: "25 到 34 歲" },
    "35-44": { cn: "35 到 44 岁", tw: "35 到 44 歲" },
    "45-plus": { cn: "45 岁以上", tw: "45 歲以上" },
    single: { cn: "单身", tw: "單身" },
    "married-or-common-law": { cn: "已婚或同居伴侣", tw: "已婚或同居伴侶" },
    "separated-or-divorced": { cn: "分居或离婚", tw: "分居或離婚" },
    widowed: { cn: "丧偶", tw: "喪偶" },
    "secondary-or-less": { cn: "中学或以下", tw: "中學或以下" },
    "diploma-or-trade": { cn: "文凭或技工", tw: "文憑或技工" },
    bachelors: { cn: "本科", tw: "本科" },
    graduate: { cn: "研究生", tw: "研究生" },
    completed: { cn: "已完成", tw: "已完成" },
    booked: { cn: "已预约", tw: "已預約" },
    "not-started": { cn: "未开始", tw: "未開始" },
    none: { cn: "无", tw: "無" },
    "under-1-year": { cn: "不足 1 年", tw: "不足 1 年" },
    "1-3-years": { cn: "1 到 3 年", tw: "1 到 3 年" },
    "3-plus-years": { cn: "3 年以上", tw: "3 年以上" },
    confirmed: { cn: "已确认", tw: "已確認" },
    "in-discussion": { cn: "讨论中", tw: "討論中" }
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
