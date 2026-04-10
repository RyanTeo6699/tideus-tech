import type { Json, TablesInsert } from "@/lib/database.types";
import { appLocales, defaultLocale, isAppLocale, type AppLocale } from "@/lib/i18n/config";
import { createClient } from "@/lib/supabase/server";
import type { SupportedUseCaseSlug } from "@/lib/case-workflows";
import {
  CASE_KNOWLEDGE_REFRESH_EVENT_TYPE,
  type CaseKnowledgeMaterialGuidanceNote,
  type CaseKnowledgeProcessingTimeNote,
  type CaseKnowledgeReference,
  type CaseKnowledgeRefreshPayload,
  type CaseKnowledgeRefreshSnapshot
} from "@/lib/knowledge/types";

type ParseSuccess<T> = {
  success: true;
  data: T;
};

type ParseFailure = {
  success: false;
  message: string;
};

type ParseResult<T> = ParseSuccess<T> | ParseFailure;

type SaveKnowledgeRefreshInput = {
  scenarioTag: SupportedUseCaseSlug;
  sourceVersion: string;
  sourceLabel: string;
  refreshedAt: string;
  localizedKnowledge: Record<AppLocale, CaseKnowledgeRefreshPayload>;
};

export async function readLatestKnowledgeRefreshSnapshot(
  scenarioTag: SupportedUseCaseSlug
): Promise<CaseKnowledgeRefreshSnapshot | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("app_events")
    .select("metadata, created_at")
    .eq("event_type", CASE_KNOWLEDGE_REFRESH_EVENT_TYPE)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error || !data) {
    return null;
  }

  for (const row of data) {
    const snapshot = parseKnowledgeRefreshSnapshot(row.metadata, row.created_at ?? null);

    if (snapshot && snapshot.scenarioTag === scenarioTag) {
      return snapshot;
    }
  }

  return null;
}

export async function saveKnowledgeRefreshSnapshot(input: SaveKnowledgeRefreshInput) {
  const supabase = await createClient();
  const payload: TablesInsert<"app_events"> = {
    event_type: CASE_KNOWLEDGE_REFRESH_EVENT_TYPE,
    path: "/api/internal/knowledge/refresh",
    metadata: {
      scenarioTag: input.scenarioTag,
      sourceVersion: input.sourceVersion,
      sourceLabel: input.sourceLabel,
      refreshedAt: input.refreshedAt,
      localizedKnowledge: input.localizedKnowledge as Json
    }
  };

  const { error } = await supabase.from("app_events").insert(payload);
  return error;
}

export function parseKnowledgeRefreshRequest(value: unknown): ParseResult<SaveKnowledgeRefreshInput> {
  const body = readRecord(value);

  if (!body) {
    return {
      success: false,
      message: "知识刷新请求无效。"
    };
  }

  const scenarioTag = typeof body.scenarioTag === "string" ? body.scenarioTag.trim() : "";
  const sourceVersion = typeof body.sourceVersion === "string" ? body.sourceVersion.trim() : "";
  const sourceLabel = typeof body.sourceLabel === "string" ? body.sourceLabel.trim() : "";
  const refreshedAt = typeof body.refreshedAt === "string" && body.refreshedAt.trim() ? body.refreshedAt.trim() : new Date().toISOString();
  const localizedKnowledgeRecord = readRecord(body.localizedKnowledge);

  if (scenarioTag !== "visitor-record" && scenarioTag !== "study-permit-extension") {
    return {
      success: false,
      message: "只支持访客记录与学签延期的知识刷新。"
    };
  }

  if (!sourceVersion) {
    return {
      success: false,
      message: "请提供知识源版本标识。"
    };
  }

  if (!sourceLabel) {
    return {
      success: false,
      message: "请提供知识源标签。"
    };
  }

  if (!localizedKnowledgeRecord) {
    return {
      success: false,
      message: "请提供 zh-CN 与 zh-TW 的结构化知识内容。"
    };
  }

  const localizedKnowledge = {} as Record<AppLocale, CaseKnowledgeRefreshPayload>;

  for (const locale of appLocales) {
    const payload = parseKnowledgeRefreshPayload(localizedKnowledgeRecord[locale]);

    if (!payload) {
      return {
        success: false,
        message: locale === "zh-TW" ? "缺少繁體中文的結構化知識內容。" : "缺少简体中文的结构化知识内容。"
      };
    }

    localizedKnowledge[locale] = payload;
  }

  return {
    success: true,
    data: {
      scenarioTag,
      sourceVersion,
      sourceLabel,
      refreshedAt,
      localizedKnowledge
    }
  };
}

export function getKnowledgeRefreshPayloadForLocale(
  snapshot: CaseKnowledgeRefreshSnapshot | null,
  locale: AppLocale = defaultLocale
): CaseKnowledgeRefreshPayload | null {
  if (!snapshot) {
    return null;
  }

  return snapshot.localizedKnowledge[locale] ?? null;
}

function parseKnowledgeRefreshSnapshot(value: Json | null | undefined, createdAt: string | null): CaseKnowledgeRefreshSnapshot | null {
  const record = readRecord(value);
  const scenarioTag = typeof record?.scenarioTag === "string" ? record.scenarioTag.trim() : "";
  const sourceVersion = typeof record?.sourceVersion === "string" ? record.sourceVersion.trim() : "";
  const sourceLabel = typeof record?.sourceLabel === "string" ? record.sourceLabel.trim() : "";
  const refreshedAt = typeof record?.refreshedAt === "string" && record.refreshedAt.trim() ? record.refreshedAt.trim() : createdAt ?? new Date().toISOString();
  const localizedKnowledgeRecord = readRecord(record?.localizedKnowledge);

  if (
    (scenarioTag !== "visitor-record" && scenarioTag !== "study-permit-extension") ||
    !sourceVersion ||
    !sourceLabel ||
    !localizedKnowledgeRecord
  ) {
    return null;
  }

  const localizedKnowledge: Partial<Record<AppLocale, CaseKnowledgeRefreshPayload>> = {};

  for (const [localeKey, localeValue] of Object.entries(localizedKnowledgeRecord)) {
    if (!isAppLocale(localeKey)) {
      continue;
    }

    const payload = parseKnowledgeRefreshPayload(localeValue);

    if (payload) {
      localizedKnowledge[localeKey] = payload;
    }
  }

  return {
    scenarioTag,
    sourceVersion,
    sourceLabel,
    refreshedAt,
    localizedKnowledge
  };
}

function parseKnowledgeRefreshPayload(value: unknown): CaseKnowledgeRefreshPayload | null {
  const record = readRecord(value);

  if (!record) {
    return null;
  }

  return {
    processingTimeNote: parseProcessingTimeNote(record.processingTimeNote),
    supportingContextNotes: readStringArray(record.supportingContextNotes).slice(0, 8),
    materialsGuidanceNotes: readGuidanceNotes(record.materialsGuidanceNotes).slice(0, 12),
    scenarioSpecificWarnings: readStringArray(record.scenarioSpecificWarnings).slice(0, 8),
    officialReferenceLabels: readStringArray(record.officialReferenceLabels).slice(0, 10),
    references: readReferences(record.references).slice(0, 10)
  };
}

function parseProcessingTimeNote(value: unknown): CaseKnowledgeProcessingTimeNote | null {
  const record = readRecord(value);

  if (!record) {
    return null;
  }

  const label = readString(record.label);
  const note = readString(record.note);
  const referenceLabel = readString(record.referenceLabel);
  const freshness = readString(record.freshness);

  if (!label || !note || !referenceLabel || freshness !== "live-check-required") {
    return null;
  }

  return {
    label,
    note,
    referenceLabel,
    freshness
  };
}

function readGuidanceNotes(value: unknown): CaseKnowledgeMaterialGuidanceNote[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    const record = readRecord(item);
    const documentKey = readString(record?.documentKey);
    const label = readString(record?.label);
    const note = readString(record?.note);
    const appliesToStatuses = Array.isArray(record?.appliesToStatuses)
      ? record.appliesToStatuses.flatMap((status) => (typeof status === "string" ? [status] : []))
      : [];

    if (!documentKey || !label || !note || appliesToStatuses.length === 0) {
      return [];
    }

    return [
      {
        documentKey,
        label,
        note,
        appliesToStatuses: appliesToStatuses as CaseKnowledgeMaterialGuidanceNote["appliesToStatuses"]
      }
    ];
  });
}

function readReferences(value: unknown): CaseKnowledgeReference[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    const record = readRecord(item);
    const label = readString(record?.label);
    const referenceType = readString(record?.referenceType);
    const trustLevel = readString(record?.trustLevel);
    const freshness = readString(record?.freshness);

    if (
      !label ||
      (referenceType !== "official-context" && referenceType !== "processing-time" && referenceType !== "materials-guidance") ||
      (trustLevel !== "official-context" && trustLevel !== "scenario-workflow" && trustLevel !== "case-derived") ||
      (freshness !== "static-adapter" && freshness !== "live-check-required")
    ) {
      return [];
    }

    return [
      {
        label,
        referenceType,
        trustLevel,
        freshness
      }
    ];
  });
}

function readRecord(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function readString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

function readStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => (typeof item === "string" && item.trim() ? [item.trim()] : []));
}
