import type { User } from "@supabase/supabase-js";

import type { Json, Tables, TablesInsert } from "@/lib/database.types";
import {
  parseStoredIntakeNormalization,
  parseStoredHandoffIntelligence,
  parseStoredMaterialInterpretation,
  parseStoredReviewDelta
} from "@/lib/case-ai";
import { recordCaseEvent } from "@/lib/case-events";
import {
  buildCaseReviewResult,
  getDocumentProgressCounts,
  parseStoredChecklistItems,
  parseStoredRiskFlags,
  type CaseReviewResult
} from "@/lib/case-review";
import {
  formatReadinessStatus,
  getUseCaseDefinition,
  type CaseDocumentStatus,
  type CaseIntakeValues,
  type SupportedUseCaseSlug
} from "@/lib/case-workflows";
import {
  formatCaseStatus,
  getInitialCaseStatus,
  normalizeCaseStatus
} from "@/lib/case-state";
import { defaultLocale, type AppLocale } from "@/lib/i18n/config";
import { formatAppDate } from "@/lib/i18n/format";
import { pickLocale } from "@/lib/i18n/workspace";
import { createClient } from "@/lib/supabase/server";

export type CaseListResult = {
  user: User | null;
  items: Tables<"cases">[];
};

export type CaseDetailResult = {
  user: User | null;
  profile: Tables<"profiles"> | null;
  caseRecord: Tables<"cases"> | null;
  documents: Tables<"case_documents">[];
  latestReview: Tables<"case_review_versions"> | null;
  reviewHistory: Tables<"case_review_versions">[];
};

type CaseDetailOptions = {
  resumeSource?: "materials" | "review-results";
};

export type CaseNextAction = {
  label: string;
  href: string;
  description: string;
};

export type CaseMaterialStatusCounts = {
  total: number;
  requiredTotal: number;
  ready: number;
  collecting: number;
  needsRefresh: number;
  missing: number;
  notApplicable: number;
  requiredReady: number;
  requiredActionCount: number;
};

export function getCaseIntakeInitialValues(profile: Tables<"profiles"> | null, useCaseSlug: SupportedUseCaseSlug) {
  const values: Partial<CaseIntakeValues> = {};

  if (profile?.current_status) {
    values.currentStatus = profile.current_status === "outside-canada" ? "other" : profile.current_status;
  } else if (useCaseSlug === "visitor-record") {
    values.currentStatus = "visitor";
  } else if (useCaseSlug === "study-permit-extension") {
    values.currentStatus = "student";
  }

  if (profile?.refusal_history_flag) {
    values.refusalOrComplianceIssues = "yes";
  }

  return values;
}

export function buildCaseTitle(useCaseSlug: SupportedUseCaseSlug, intake: CaseIntakeValues, locale: AppLocale = defaultLocale) {
  if (intake.title.trim()) {
    return intake.title.trim();
  }

  const useCase = getUseCaseDefinition(useCaseSlug, locale);
  const fallback = useCase?.shortTitle ?? pickLocale(locale, "案件", "案件");
  return pickLocale(locale, `${fallback} 准备`, `${fallback} 準備`);
}

export function buildInitialCaseDocuments(
  useCaseSlug: SupportedUseCaseSlug,
  intake: CaseIntakeValues,
  locale: AppLocale = defaultLocale
): TablesInsert<"case_documents">[] {
  const useCase = getUseCaseDefinition(useCaseSlug, locale);

  if (!useCase) {
    return [];
  }

  return useCase.expectedDocuments.map((document, index) => ({
    document_key: document.key,
    label: document.label,
    description: document.description,
    position: index,
    required: document.required,
    status: deriveInitialDocumentStatus(useCaseSlug, document.key, intake)
  }));
}

export function buildCaseResumeHref(caseRecord: Tables<"cases">) {
  if (normalizeCaseStatus(caseRecord.status) === "reviewed") {
    return `/review-results/${caseRecord.id}`;
  }

  return `/upload-materials/${caseRecord.id}`;
}

export function getCaseReviewSnapshot(latestReview: Tables<"case_review_versions"> | null): CaseReviewResult | null {
  if (!latestReview) {
    return null;
  }

  const reviewSupport = readReviewSupportMetadata(latestReview.metadata);

  return {
    readinessStatus: latestReview.readiness_status as CaseReviewResult["readinessStatus"],
    readinessSummary: latestReview.readiness_summary,
    summary: latestReview.result_summary,
    timelineNote: latestReview.timeline_note ?? "",
    checklist: parseStoredChecklistItems(latestReview.checklist_items),
    missingItems: latestReview.missing_items,
    riskFlags: parseStoredRiskFlags(latestReview.risk_flags),
    nextSteps: latestReview.next_steps,
    supportingContextNotes: reviewSupport.supportingContextNotes,
    officialReferenceLabels: reviewSupport.officialReferenceLabels
  };
}

export function buildCaseFacts(
  caseRecord: Tables<"cases">,
  documents: Tables<"case_documents">[],
  locale: AppLocale = defaultLocale
) {
  const counts = getDocumentProgressCounts(
    documents.map((item) => ({
      status: item.status as CaseDocumentStatus,
      required: item.required
    }))
  );

  return [
    {
      label: pickLocale(locale, "案件类型", "案件類型"),
      value: getUseCaseDefinition(caseRecord.use_case_slug, locale)?.shortTitle ?? caseRecord.use_case_slug
    },
    { label: pickLocale(locale, "案件状态", "案件狀態"), value: formatCaseStatus(caseRecord.status, locale) },
    {
      label: pickLocale(locale, "就绪度", "就緒度"),
      value: caseRecord.latest_readiness_status
        ? formatReadinessStatus(caseRecord.latest_readiness_status, locale)
        : pickLocale(locale, "尚未审查", "尚未審查")
    },
    { label: pickLocale(locale, "材料就绪", "材料就緒"), value: `${counts.ready}/${counts.total}` },
    {
      label: pickLocale(locale, "最近审查", "最近審查"),
      value: caseRecord.latest_reviewed_at
        ? formatAppDate(caseRecord.latest_reviewed_at, locale)
        : pickLocale(locale, "尚未审查", "尚未審查")
    },
    { label: pickLocale(locale, "最近更新", "最近更新"), value: formatAppDate(caseRecord.updated_at, locale) }
  ];
}

export function getCaseMaterialStatusCounts(documents: Tables<"case_documents">[]): CaseMaterialStatusCounts {
  let ready = 0;
  let collecting = 0;
  let needsRefresh = 0;
  let missing = 0;
  let notApplicable = 0;
  let requiredTotal = 0;
  let requiredReady = 0;

  for (const item of documents) {
    if (item.required) {
      requiredTotal += 1;
    }

    if (item.status === "ready") {
      ready += 1;
      if (item.required) {
        requiredReady += 1;
      }
      continue;
    }

    if (item.status === "collecting") {
      collecting += 1;
      continue;
    }

    if (item.status === "needs-refresh") {
      needsRefresh += 1;
      continue;
    }

    if (item.status === "missing") {
      missing += 1;
      continue;
    }

    if (item.status === "not-applicable") {
      notApplicable += 1;
      if (item.required) {
        requiredReady += 1;
      }
    }
  }

  return {
    total: documents.length,
    requiredTotal,
    ready,
    collecting,
    needsRefresh,
    missing,
    notApplicable,
    requiredReady,
    requiredActionCount: requiredTotal - requiredReady
  };
}

export function getCaseNextAction(
  caseRecord: Tables<"cases">,
  documents: Tables<"case_documents">[],
  locale: AppLocale = defaultLocale
): CaseNextAction {
  const counts = getDocumentProgressCounts(
    documents.map((item) => ({
      status: item.status as CaseDocumentStatus,
      required: item.required
    }))
  );

  if (normalizeCaseStatus(caseRecord.status) !== "reviewed") {
    return {
      label: pickLocale(locale, "完成材料并生成审查", "完成材料並生成審查"),
      href: `/upload-materials/${caseRecord.id}`,
      description:
        counts.actionNeeded > 0
          ? pickLocale(
              locale,
              `还有 ${counts.actionNeeded} 份必需材料需要处理，然后才能进入第一轮干净的审查。`,
              `還有 ${counts.actionNeeded} 份必需材料需要處理，然後才能進入第一輪乾淨的審查。`
            )
          : pickLocale(
              locale,
              "intake 已完成。下一步是确认材料包状态并生成第一版审查结果。",
              "intake 已完成。下一步是確認材料包狀態並生成第一版審查結果。"
            )
    };
  }

  if (caseRecord.latest_readiness_status === "review-ready") {
    return {
      label: pickLocale(locale, "导出最新摘要", "匯出最新摘要"),
      href: `/review-results/${caseRecord.id}/export`,
      description: pickLocale(
        locale,
        "最新审查结果已足够清晰，可用于打印、导出或进入下一步专业交接。",
        "最新審查結果已足夠清晰，可用於列印、匯出或進入下一步專業交接。"
      )
    };
  }

  return {
    label: pickLocale(locale, "更新材料并重新生成审查", "更新材料並重新生成審查"),
    href: `/upload-materials/${caseRecord.id}`,
    description:
      caseRecord.latest_review_summary ||
      pickLocale(
        locale,
        "该案件已经有保存的审查版本，但在导出前仍应先把材料包再收紧一轮。",
        "該案件已經有儲存的審查版本，但在匯出前仍應先把材料包再收緊一輪。"
      )
  };
}

export function buildCaseSnapshotFacts(caseRecord: Tables<"cases">, locale: AppLocale = defaultLocale) {
  const intake = readCaseIntake(caseRecord.intake_answers);

  return [
    {
      label: pickLocale(locale, "当前身份", "目前身分"),
      value: formatStoredValue(intake.currentStatus, locale) || pickLocale(locale, "尚未记录", "尚未記錄")
    },
    { label: pickLocale(locale, "到期日期", "到期日期"), value: intake.currentPermitExpiry || pickLocale(locale, "尚未记录", "尚未記錄") },
    {
      label: pickLocale(locale, "时间紧迫度", "時間緊迫度"),
      value: formatStoredValue(intake.urgency, locale) || pickLocale(locale, "尚未记录", "尚未記錄")
    },
    {
      label: pickLocale(locale, "护照有效期", "護照效期"),
      value: formatStoredValue(intake.passportValidity, locale) || pickLocale(locale, "尚未记录", "尚未記錄")
    },
    {
      label: pickLocale(locale, "资金状态", "資金狀態"),
      value: formatStoredValue(intake.proofOfFundsStatus, locale) || pickLocale(locale, "尚未记录", "尚未記錄")
    },
    {
      label: pickLocale(locale, "支持性证据", "支援性證據"),
      value: formatStoredValue(intake.supportEvidenceStatus, locale) || pickLocale(locale, "尚未记录", "尚未記錄")
    },
    {
      label: pickLocale(locale, "案件进度信号", "案件進度訊號"),
      value: formatStoredValue(intake.scenarioProgressStatus, locale) || pickLocale(locale, "尚未记录", "尚未記錄")
    },
    { label: pickLocale(locale, "支持主体", "支援主體"), value: intake.supportEntityName || pickLocale(locale, "尚未记录", "尚未記錄") }
  ];
}

export function buildCaseNotes(caseRecord: Tables<"cases">, locale: AppLocale = defaultLocale) {
  return readCaseIntake(caseRecord.intake_answers).notes || pickLocale(locale, "当前没有保存案件备注。", "目前沒有儲存案件備註。");
}

export function getReviewHistoryFacts(reviewHistory: Tables<"case_review_versions">[], locale: AppLocale = defaultLocale) {
  return reviewHistory.map((item) => ({
    label: pickLocale(locale, `版本 ${item.version_number}`, `版本 ${item.version_number}`),
    value: `${formatReadinessStatus(item.readiness_status, locale)} · ${formatAppDate(item.created_at, locale)}`
  }));
}

export function getCaseReviewDeltaSnapshot(
  latestReview: Tables<"case_review_versions"> | null,
  locale: AppLocale = defaultLocale
) {
  return latestReview ? parseStoredReviewDelta(latestReview.metadata, locale) : null;
}

export function getCaseHandoffIntelligenceSnapshot(latestReview: Tables<"case_review_versions"> | null) {
  return latestReview ? parseStoredHandoffIntelligence(latestReview.metadata) : null;
}

export function getCaseMaterialInterpretationSnapshot(
  caseRecord: Tables<"cases">,
  locale: AppLocale = defaultLocale
) {
  return parseStoredMaterialInterpretation(caseRecord.metadata, locale);
}

export function getCaseIntakeNormalizationSnapshot(caseRecord: Tables<"cases">) {
  return parseStoredIntakeNormalization(caseRecord.metadata);
}

export async function getCases(limit = 24): Promise<CaseListResult> {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      user: null,
      items: []
    };
  }

  const { data } = await supabase
    .from("cases")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(limit);

  return {
    user,
    items: data ?? []
  };
}

export async function getCaseDetail(caseId: string, options?: CaseDetailOptions): Promise<CaseDetailResult> {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      user: null,
      profile: null,
      caseRecord: null,
      documents: [],
      latestReview: null,
      reviewHistory: []
    };
  }

  const [{ data: profile }, { data: caseRecord }] = await Promise.all([
    supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle(),
    supabase.from("cases").select("*").eq("user_id", user.id).eq("id", caseId).maybeSingle()
  ]);

  if (!caseRecord) {
    return {
      user,
      profile: profile ?? null,
      caseRecord: null,
      documents: [],
      latestReview: null,
      reviewHistory: []
    };
  }

  const [{ data: documents }, { data: reviewHistory }] = await Promise.all([
    supabase.from("case_documents").select("*").eq("case_id", caseRecord.id).order("position", { ascending: true }),
    supabase.from("case_review_versions").select("*").eq("case_id", caseRecord.id).order("version_number", { ascending: false })
  ]);

  if (options?.resumeSource) {
    const status = normalizeCaseStatus(caseRecord.status) ?? getInitialCaseStatus();
    const eventError = await recordCaseEvent(supabase, {
      caseId: caseRecord.id,
      userId: user.id,
      eventType: "case_resumed",
      status,
      metadata: {
        source: options.resumeSource
      }
    });

    if (eventError) {
      console.error("Unable to record case resume event", eventError);
    }
  }

  return {
    user,
    profile: profile ?? null,
    caseRecord,
    documents: documents ?? [],
    latestReview: reviewHistory?.[0] ?? null,
    reviewHistory: reviewHistory ?? []
  };
}

export async function buildLatestReviewForCase(
  caseRecord: Tables<"cases">,
  documents: Tables<"case_documents">[],
  locale: AppLocale = defaultLocale
) {
  const intake = readCaseIntake(caseRecord.intake_answers);
  return buildCaseReviewResult(
    caseRecord.use_case_slug as SupportedUseCaseSlug,
    intake,
    documents.map((item) => ({
      key: item.document_key,
      label: item.label,
      description: item.description,
      required: item.required,
      status: item.status as CaseDocumentStatus,
      material_reference: item.material_reference
    })),
    locale
  );
}

function deriveInitialDocumentStatus(useCaseSlug: SupportedUseCaseSlug, documentKey: string, intake: CaseIntakeValues): CaseDocumentStatus {
  if (documentKey === "proof-of-funds") {
    return mapPreparednessToDocumentStatus(intake.proofOfFundsStatus);
  }

  if (
    (useCaseSlug === "visitor-record" && documentKey === "host-or-accommodation") ||
    (useCaseSlug === "study-permit-extension" && documentKey === "enrolment-letter")
  ) {
    return mapPreparednessToDocumentStatus(intake.supportEvidenceStatus);
  }

  if (
    (useCaseSlug === "visitor-record" && documentKey === "temporary-intent-support") ||
    (useCaseSlug === "study-permit-extension" && documentKey === "transcript-or-progress")
  ) {
    if (intake.scenarioProgressStatus === "clear" || intake.scenarioProgressStatus === "good-standing") {
      return "collecting";
    }

    if (intake.scenarioProgressStatus === "partial" || intake.scenarioProgressStatus === "needs-explanation") {
      return "needs-refresh";
    }

    if (intake.scenarioProgressStatus === "weak" || intake.scenarioProgressStatus === "at-risk") {
      return "missing";
    }
  }

  return "missing";
}

function mapPreparednessToDocumentStatus(value: string): CaseDocumentStatus {
  if (value === "ready") {
    return "collecting";
  }

  if (value === "partial") {
    return "needs-refresh";
  }

  if (value === "not-needed") {
    return "not-applicable";
  }

  return "missing";
}

export function readCaseIntake(value: Json) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {
      title: "",
      currentStatus: "",
      currentPermitExpiry: "",
      urgency: "",
      passportValidity: "",
      proofOfFundsStatus: "",
      refusalOrComplianceIssues: "",
      applicationReason: "",
      supportEntityName: "",
      supportEvidenceStatus: "",
      scenarioProgressStatus: "",
      notes: ""
    };
  }

  const record = value as Record<string, Json>;

  return {
    title: readString(record.title),
    currentStatus: readString(record.currentStatus),
    currentPermitExpiry: readString(record.currentPermitExpiry),
    urgency: readString(record.urgency),
    passportValidity: readString(record.passportValidity),
    proofOfFundsStatus: readString(record.proofOfFundsStatus),
    refusalOrComplianceIssues: readString(record.refusalOrComplianceIssues),
    applicationReason: readString(record.applicationReason),
    supportEntityName: readString(record.supportEntityName),
    supportEvidenceStatus: readString(record.supportEvidenceStatus),
    scenarioProgressStatus: readString(record.scenarioProgressStatus),
    notes: readString(record.notes)
  };
}

function readString(value: Json | undefined) {
  return typeof value === "string" ? value : "";
}

function readReviewSupportMetadata(metadata: Json | null | undefined) {
  const record = readJsonRecord(metadata);
  const reviewSupport = readJsonRecord(record.reviewSupport);
  const knowledgeAdapter = readJsonRecord(record.knowledgeAdapter);
  const aiWorkflow = readJsonRecord(record.aiWorkflow);
  const reviewGeneration = readJsonRecord(aiWorkflow.reviewGeneration);
  const reviewOutput = readJsonRecord(reviewGeneration.output);

  return {
    supportingContextNotes: readStringArray(
      reviewSupport.supportingContextNotes ?? reviewOutput.supportingContextNotes ?? knowledgeAdapter.supportingContextNotes
    ),
    officialReferenceLabels: readStringArray(
      reviewSupport.officialReferenceLabels ?? reviewOutput.officialReferenceLabels ?? knowledgeAdapter.officialReferenceLabels
    )
  };
}

function readJsonRecord(value: Json | null | undefined): Record<string, Json> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, Json>;
}

function readStringArray(value: Json | undefined): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => (typeof item === "string" && item.trim() ? [item.trim()] : []));
}

function formatStoredValue(value: string | null | undefined, locale: AppLocale = defaultLocale) {
  if (!value) {
    return null;
  }

  const labels: Record<string, string> = {
    visitor: pickLocale(locale, "访问者", "訪客"),
    student: pickLocale(locale, "学生", "學生"),
    worker: pickLocale(locale, "工作者", "工作者"),
    "outside-canada": pickLocale(locale, "加拿大境外", "加拿大境外"),
    other: pickLocale(locale, "其他", "其他"),
    "under-30": pickLocale(locale, "30 天内", "30 天內"),
    "30-60": pickLocale(locale, "31 到 60 天内", "31 到 60 天內"),
    "under-90": pickLocale(locale, "90 天内", "90 天內"),
    "90-plus": pickLocale(locale, "90 天以上", "90 天以上"),
    "under-6": pickLocale(locale, "少于 6 个月", "少於 6 個月"),
    "6-12": pickLocale(locale, "6 到 12 个月", "6 到 12 個月"),
    "12-plus": pickLocale(locale, "12 个月以上", "12 個月以上"),
    missing: pickLocale(locale, "缺失", "缺失"),
    partial: pickLocale(locale, "部分具备", "部分具備"),
    ready: pickLocale(locale, "已具备", "已具備"),
    "not-needed": pickLocale(locale, "不需要", "不需要"),
    unclear: pickLocale(locale, "不清楚", "不清楚"),
    yes: pickLocale(locale, "是", "是"),
    no: pickLocale(locale, "否", "否"),
    "family-or-host": pickLocale(locale, "家人 / 邀请方支持", "家人 / 邀請方支援"),
    tourism: pickLocale(locale, "旅游或个人行程", "旅遊或個人行程"),
    "wrap-up": pickLocale(locale, "离境前处理事务", "離境前處理事務"),
    "registration-delay": pickLocale(locale, "注册或文件延误", "註冊或文件延誤"),
    "program-transition": pickLocale(locale, "课程或学习安排变动", "課程或學習安排變動"),
    "tourism-or-visit": pickLocale(locale, "探访 / 停留", "探訪 / 停留"),
    "awaiting-next-step": pickLocale(locale, "等待下一步安排", "等待下一步安排"),
    clear: pickLocale(locale, "清晰", "清晰"),
    partial: pickLocale(locale, "部分清晰", "部分清晰"),
    weak: pickLocale(locale, "偏弱", "偏弱"),
    "good-standing": pickLocale(locale, "状态良好", "狀態良好"),
    "needs-explanation": pickLocale(locale, "需要解释", "需要解釋"),
    "at-risk": pickLocale(locale, "存在风险", "存在風險")
  };

  return labels[value] ?? value;
}
