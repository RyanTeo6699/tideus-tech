import type { Json, Tables } from "@/lib/database.types";
import { defaultLocale, isAppLocale, type AppLocale } from "@/lib/i18n/config";
import { pickLocale } from "@/lib/i18n/workspace";

export const handoffRequestStatuses = ["new", "opened", "in_review", "closed"] as const;

export type HandoffRequestStatus = (typeof handoffRequestStatuses)[number];

export type HandoffPacketFact = {
  label: string;
  value: string;
};

export type HandoffPacketSummary = {
  packetVersion: 1;
  locale: AppLocale;
  caseTitle: string;
  useCaseSlug: string;
  useCaseTitle: string;
  clientSnapshot: {
    displayName: string;
    email: string | null;
  };
  latestReviewVersion: number;
  latestReviewedAt: string | null;
  readinessStatus: string;
  readinessSummary: string;
  resultSummary: string;
  timelineNote: string;
  keyFacts: HandoffPacketFact[];
  materialSummary: {
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
  riskSummary: {
    high: number;
    medium: number;
    low: number;
  };
  nextSteps: string[];
  supportingContextNotes: string[];
  officialReferenceLabels: string[];
  handoffIntelligence: {
    reviewReadyStatus: string;
    externalSummary: string;
    issuesNeedingHumanReview: string[];
    escalationTriggers: string[];
    supportingNotes: string[];
  } | null;
};

export type HandoffRequestRecord = {
  handoffRequest: Tables<"handoff_requests">;
  packet: HandoffPacketSummary | null;
};

export function parseStoredHandoffPacketSnapshot(value: Json | null | undefined): HandoffPacketSummary | null {
  const record = readJsonRecord(value);
  const storedLocale = typeof record.locale === "string" ? record.locale : null;
  const locale = isAppLocale(storedLocale) ? storedLocale : defaultLocale;
  const caseTitle = readRequiredString(record.caseTitle);
  const useCaseSlug = readRequiredString(record.useCaseSlug);
  const useCaseTitle = readRequiredString(record.useCaseTitle);
  const readinessStatus = readRequiredString(record.readinessStatus);
  const readinessSummary = readRequiredString(record.readinessSummary);
  const resultSummary = readRequiredString(record.resultSummary);

  if (!caseTitle || !useCaseSlug || !useCaseTitle || !readinessStatus || !readinessSummary || !resultSummary) {
    return null;
  }

  const clientSnapshotRecord = readJsonRecord(record.clientSnapshot);
  const clientDisplayName = readRequiredString(clientSnapshotRecord.displayName);

  if (!clientDisplayName) {
    return null;
  }

  return {
    packetVersion: 1,
    locale,
    caseTitle,
    useCaseSlug,
    useCaseTitle,
    clientSnapshot: {
      displayName: clientDisplayName,
      email: readNullableString(clientSnapshotRecord.email)
    },
    latestReviewVersion: readNumber(record.latestReviewVersion) ?? 1,
    latestReviewedAt: readNullableString(record.latestReviewedAt),
    readinessStatus,
    readinessSummary,
    resultSummary,
    timelineNote: readRequiredString(record.timelineNote),
    keyFacts: readFactArray(record.keyFacts),
    materialSummary: {
      total: readNumberFromRecord(record.materialSummary, "total"),
      requiredTotal: readNumberFromRecord(record.materialSummary, "requiredTotal"),
      ready: readNumberFromRecord(record.materialSummary, "ready"),
      collecting: readNumberFromRecord(record.materialSummary, "collecting"),
      needsRefresh: readNumberFromRecord(record.materialSummary, "needsRefresh"),
      missing: readNumberFromRecord(record.materialSummary, "missing"),
      notApplicable: readNumberFromRecord(record.materialSummary, "notApplicable"),
      requiredReady: readNumberFromRecord(record.materialSummary, "requiredReady"),
      requiredActionCount: readNumberFromRecord(record.materialSummary, "requiredActionCount")
    },
    riskSummary: {
      high: readNumberFromRecord(record.riskSummary, "high"),
      medium: readNumberFromRecord(record.riskSummary, "medium"),
      low: readNumberFromRecord(record.riskSummary, "low")
    },
    nextSteps: readStringArray(record.nextSteps),
    supportingContextNotes: readStringArray(record.supportingContextNotes),
    officialReferenceLabels: readStringArray(record.officialReferenceLabels),
    handoffIntelligence: readHandoffIntelligence(record.handoffIntelligence)
  };
}

export function parseHandoffRequestRecord(record: Tables<"handoff_requests">): HandoffRequestRecord {
  return {
    handoffRequest: record,
    packet: parseStoredHandoffPacketSnapshot(record.export_snapshot)
  };
}

export function isHandoffRequestStatus(value: unknown): value is HandoffRequestStatus {
  return typeof value === "string" && handoffRequestStatuses.includes(value as HandoffRequestStatus);
}

export function formatHandoffRequestStatus(status: string | null | undefined, locale: AppLocale) {
  switch (status) {
    case "new":
      return pickLocale(locale, "新请求", "新請求");
    case "opened":
      return pickLocale(locale, "已打开", "已開啟");
    case "in_review":
      return pickLocale(locale, "审阅中", "審閱中");
    case "closed":
      return pickLocale(locale, "已关闭", "已關閉");
    case "requested":
      return pickLocale(locale, "已请求", "已請求");
    case "queued":
      return pickLocale(locale, "已进入专业收件箱", "已進入專業收件箱");
    case "archived":
      return pickLocale(locale, "已归档", "已歸檔");
    default:
      return pickLocale(locale, "未设置", "未設定");
  }
}

export function formatHandoffAssignmentLabel(record: Tables<"handoff_requests">, locale: AppLocale) {
  if (record.professional_user_id) {
    return pickLocale(locale, "已保留给处理成员", "已保留給處理成員");
  }

  if (record.organization_id) {
    return pickLocale(locale, "组织队列", "組織佇列");
  }

  return pickLocale(locale, "未分配收件", "未分配收件");
}

function readHandoffIntelligence(value: Json | undefined) {
  const record = readJsonRecord(value);
  const reviewReadyStatus = readRequiredString(record.reviewReadyStatus);
  const externalSummary = readRequiredString(record.externalSummary);

  if (!reviewReadyStatus || !externalSummary) {
    return null;
  }

  return {
    reviewReadyStatus,
    externalSummary,
    issuesNeedingHumanReview: readStringArray(record.issuesNeedingHumanReview),
    escalationTriggers: readStringArray(record.escalationTriggers),
    supportingNotes: readStringArray(record.supportingNotes)
  };
}

function readFactArray(value: Json | undefined): HandoffPacketFact[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    const record = readJsonRecord(item);
    const label = readRequiredString(record.label);
    const itemValue = readRequiredString(record.value);

    if (!label || !itemValue) {
      return [];
    }

    return [
      {
        label,
        value: itemValue
      }
    ];
  });
}

function readStringArray(value: Json | undefined): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

function readNumberFromRecord(value: Json | undefined, key: string) {
  return readNumber(readJsonRecord(value)[key]) ?? 0;
}

function readRequiredString(value: Json | undefined) {
  return typeof value === "string" ? value : "";
}

function readNullableString(value: Json | undefined) {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function readNumber(value: Json | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function readJsonRecord(value: Json | null | undefined): Record<string, Json> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, Json>;
}
