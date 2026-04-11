import type { User } from "@supabase/supabase-js";

import type { Json, Tables } from "@/lib/database.types";
import {
  buildCaseSnapshotFacts,
  getCaseHandoffIntelligenceSnapshot,
  getCaseMaterialStatusCounts,
  getCaseReviewSnapshot
} from "@/lib/cases";
import { getUseCaseDefinition } from "@/lib/case-workflows";
import { defaultLocale, isAppLocale, type AppLocale } from "@/lib/i18n/config";
import { pickLocale } from "@/lib/i18n/workspace";
import { createClient } from "@/lib/supabase/server";

export const handoffRequestStatuses = ["requested", "queued", "archived"] as const;

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

type BuildHandoffPacketSnapshotInput = {
  caseRecord: Tables<"cases">;
  documents: Tables<"case_documents">[];
  latestReview: Tables<"case_review_versions">;
  profile: Tables<"profiles"> | null;
  user: Pick<User, "email" | "user_metadata">;
  locale: AppLocale;
};

export function buildHandoffPacketSnapshot({
  caseRecord,
  documents,
  latestReview,
  profile,
  user,
  locale
}: BuildHandoffPacketSnapshotInput): HandoffPacketSummary {
  const review = getCaseReviewSnapshot(latestReview);

  if (!review) {
    throw new Error("Latest review snapshot is required to build a handoff packet.");
  }

  const handoffIntelligence = getCaseHandoffIntelligenceSnapshot(latestReview);
  const materialSummary = getCaseMaterialStatusCounts(documents);
  const riskSummary = {
    high: review.riskFlags.filter((item) => item.severity === "high").length,
    medium: review.riskFlags.filter((item) => item.severity === "medium").length,
    low: review.riskFlags.filter((item) => item.severity === "low").length
  };
  const displayName =
    profile?.full_name ??
    (typeof user.user_metadata?.full_name === "string" && user.user_metadata.full_name.trim()
      ? user.user_metadata.full_name.trim()
      : user.email?.split("@")[0] ?? pickLocale(locale, "未命名客户", "未命名客戶"));

  return {
    packetVersion: 1,
    locale,
    caseTitle: caseRecord.title,
    useCaseSlug: caseRecord.use_case_slug,
    useCaseTitle: getUseCaseDefinition(caseRecord.use_case_slug, locale)?.shortTitle ?? caseRecord.use_case_slug,
    clientSnapshot: {
      displayName,
      email: user.email ?? profile?.email ?? null
    },
    latestReviewVersion: latestReview.version_number,
    latestReviewedAt: latestReview.created_at,
    readinessStatus: review.readinessStatus,
    readinessSummary: review.readinessSummary,
    resultSummary: review.summary,
    timelineNote: review.timelineNote,
    keyFacts: buildCaseSnapshotFacts(caseRecord, locale).slice(0, 6),
    materialSummary,
    riskSummary,
    nextSteps: review.nextSteps,
    supportingContextNotes: review.supportingContextNotes,
    officialReferenceLabels: review.officialReferenceLabels,
    handoffIntelligence: handoffIntelligence
      ? {
          reviewReadyStatus: handoffIntelligence.reviewReadyStatus,
          externalSummary: handoffIntelligence.externalSummary,
          issuesNeedingHumanReview: handoffIntelligence.issuesNeedingHumanReview,
          escalationTriggers: handoffIntelligence.escalationTriggers,
          supportingNotes: handoffIntelligence.supportingNotes
        }
      : null
  };
}

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

export async function getLatestClientHandoffRequestForCase(caseId: string): Promise<HandoffRequestRecord | null> {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from("handoff_requests")
    .select("*")
    .eq("case_id", caseId)
    .eq("client_user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? parseHandoffRequestRecord(data) : null;
}

export async function getProfessionalHandoffInbox(limit = 12): Promise<HandoffRequestRecord[]> {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from("handoff_requests")
    .select("*")
    .in("status", ["requested", "queued"])
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  return (data ?? []).map(parseHandoffRequestRecord);
}

export function formatHandoffRequestStatus(status: string | null | undefined, locale: AppLocale) {
  switch (status) {
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
