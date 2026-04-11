import type { CaseReviewResult } from "@/lib/case-review";
import { getUseCaseDefinition, type CaseDocumentStatus } from "@/lib/case-workflows";
import { pickLocale } from "@/lib/i18n/workspace";
import {
  buildScenarioKnowledgeWarnings,
  buildSeedKnowledgePack,
  mergeKnowledgePacks
} from "@/lib/knowledge/packs";
import {
  getKnowledgeRefreshPayloadForLocale,
  readLatestKnowledgeRefreshSnapshot
} from "@/lib/knowledge/refresh";
import {
  CASE_KNOWLEDGE_ADAPTER_VERSION,
  CASE_KNOWLEDGE_PACK_VERSION,
  type CaseKnowledgeContext,
  type CaseKnowledgeInput,
  type CaseKnowledgeMaterialGuidanceNote,
  type CaseKnowledgeProcessingTimeNote
} from "@/lib/knowledge/types";

export { CASE_KNOWLEDGE_ADAPTER_VERSION };
export type {
  CaseKnowledgeContext,
  CaseKnowledgeInput,
  CaseKnowledgeMaterialGuidanceNote,
  CaseKnowledgeMaterialSnapshot,
  CaseKnowledgeProcessingTimeNote,
  CaseKnowledgeReference,
  CaseKnowledgeRefreshPayload,
  CaseKnowledgeRefreshSnapshot,
  CaseKnowledgeTrustLevel
} from "@/lib/knowledge/types";

export async function buildKnowledgeContext(input: CaseKnowledgeInput): Promise<CaseKnowledgeContext> {
  const definition = getUseCaseDefinition(input.useCaseSlug, input.language);
  const generatedAt = new Date().toISOString();

  if (!definition) {
    return {
      status: "unavailable",
      source: "tideus-internal-knowledge-adapter",
      sourceVersion: CASE_KNOWLEDGE_ADAPTER_VERSION,
      adapterVersion: CASE_KNOWLEDGE_ADAPTER_VERSION,
      sourceKind: "seed-pack",
      scenarioTag: input.useCaseSlug,
      language: input.language,
      packVersion: CASE_KNOWLEDGE_PACK_VERSION,
      packLabel: "unsupported-scenario",
      generatedAt,
      refreshedAt: null,
      processingTimeNote: null,
      supportingContextNotes: [],
      materialsGuidanceNotes: [],
      scenarioSpecificWarnings: [],
      officialReferenceLabels: [],
      references: []
    };
  }

  const seedPack = buildSeedKnowledgePack(input.useCaseSlug);
  const refreshedSnapshot = await readLatestKnowledgeRefreshSnapshot(input.useCaseSlug);
  const activePack = mergeKnowledgePacks(seedPack, refreshedSnapshot);
  const localizedKnowledge = getKnowledgeRefreshPayloadForLocale(activePack, input.language);

  if (!localizedKnowledge) {
    return {
      status: "unavailable",
      source: "tideus-internal-knowledge-adapter",
      sourceVersion: activePack.sourceVersion,
      adapterVersion: CASE_KNOWLEDGE_ADAPTER_VERSION,
      sourceKind: refreshedSnapshot ? "refreshed-pack" : "seed-pack",
      scenarioTag: input.useCaseSlug,
      language: input.language,
      packVersion: activePack.packVersion,
      packLabel: activePack.sourceLabel,
      generatedAt,
      refreshedAt: activePack.refreshedAt,
      processingTimeNote: null,
      supportingContextNotes: [],
      materialsGuidanceNotes: [],
      scenarioSpecificWarnings: [],
      officialReferenceLabels: [],
      references: []
    };
  }

  const references = localizedKnowledge.references;
  const processingTimeNote = localizedKnowledge.processingTimeNote;

  return {
    status: "available",
    source: "tideus-internal-knowledge-adapter",
    sourceVersion: activePack.sourceVersion,
    adapterVersion: CASE_KNOWLEDGE_ADAPTER_VERSION,
    sourceKind: refreshedSnapshot ? "refreshed-pack" : "seed-pack",
    scenarioTag: input.useCaseSlug,
    language: input.language,
    packVersion: activePack.packVersion,
    packLabel: activePack.sourceLabel,
    generatedAt,
    refreshedAt: activePack.refreshedAt,
    processingTimeNote,
    supportingContextNotes: dedupeStrings([
      pickLocale(
        input.language,
        "这些知识上下文只用于 Tideus 内部工作流生成，不会把产品扩展成公共门户、数据页或广泛搜索入口。",
        "這些知識上下文只用於 Tideus 內部工作流程生成，不會把產品擴展成公共入口、資料頁或廣泛搜尋入口。"
      ),
      ...localizedKnowledge.supportingContextNotes,
      input.intakeNormalization?.reviewNotes[0] ?? "",
      input.materialInterpretation?.items.some((item) => readMaterialIssues(item).length > 0)
        ? input.materialInterpretation.summary
        : ""
    ]).slice(0, 6),
    materialsGuidanceNotes: dedupeMaterialGuidanceNotes([
      ...localizedKnowledge.materialsGuidanceNotes,
      ...buildAiMaterialGuidanceNotes(input),
      ...buildMetadataMaterialGuidanceNotes(input)
    ]).slice(0, 10),
    scenarioSpecificWarnings: dedupeStrings([
      ...buildSharedScenarioWarnings(input),
      ...buildScenarioKnowledgeWarnings(input),
      ...localizedKnowledge.scenarioSpecificWarnings
    ]).slice(0, 6),
    officialReferenceLabels: dedupeStrings(
      localizedKnowledge.officialReferenceLabels.length > 0
        ? localizedKnowledge.officialReferenceLabels
        : references.map((item) => item.label)
    ).slice(0, 8),
    references
  };
}

export function applyKnowledgeToReview(review: CaseReviewResult, knowledgeContext: CaseKnowledgeContext): CaseReviewResult {
  if (knowledgeContext.status !== "available") {
    return review;
  }

  const checklist = review.checklist.map((item) => {
    const guidance = knowledgeContext.materialsGuidanceNotes.find(
      (note) => note.documentKey === item.key && note.appliesToStatuses.includes(item.status)
    );

    if (!guidance || item.detail.includes(guidance.note)) {
      return item;
    }

    return {
      ...item,
      detail: `${item.detail} ${guidance.note}`
    };
  });

  const nextSteps = dedupeStrings([
    ...review.nextSteps,
    pickLocale(
      knowledgeContext.language,
      "在最终交接或专业审查前，请先核对并记录最新的 IRCC 处理时间参考。",
      "在最終交接或專業審查前，請先核對並記錄最新的 IRCC 處理時間參考。"
    )
  ]).slice(0, 6);

  return {
    ...review,
    timelineNote: appendTimelineKnowledge(review.timelineNote, knowledgeContext.processingTimeNote),
    checklist,
    nextSteps,
    supportingContextNotes: dedupeStrings([
      ...review.supportingContextNotes,
      ...knowledgeContext.supportingContextNotes,
      ...knowledgeContext.scenarioSpecificWarnings
    ]).slice(0, 8),
    officialReferenceLabels: dedupeStrings([
      ...review.officialReferenceLabels,
      ...knowledgeContext.officialReferenceLabels
    ]).slice(0, 8)
  };
}

export function summarizeKnowledgeContext(context: CaseKnowledgeContext) {
  return {
    status: context.status,
    sourceVersion: context.sourceVersion,
    adapterVersion: context.adapterVersion,
    sourceKind: context.sourceKind,
    scenarioTag: context.scenarioTag,
    language: context.language,
    packVersion: context.packVersion,
    packLabel: context.packLabel,
    generatedAt: context.generatedAt,
    refreshedAt: context.refreshedAt,
    processingTimeReferenceLabel: context.processingTimeNote?.referenceLabel ?? null,
    supportingContextNoteCount: context.supportingContextNotes.length,
    materialsGuidanceNoteCount: context.materialsGuidanceNotes.length,
    scenarioWarningCount: context.scenarioSpecificWarnings.length,
    officialReferenceCount: context.officialReferenceLabels.length
  };
}

function buildSharedScenarioWarnings(input: CaseKnowledgeInput) {
  const warnings: string[] = [];

  if (input.intake.urgency === "under-30") {
    warnings.push(
      pickLocale(
        input.language,
        "当前身份到期窗口较短，因此在交接前应优先核对官方时间与剩余证据工作。",
        "目前身分到期窗口較短，因此在交接前應優先核對官方時間與剩餘證據工作。"
      )
    );
  }

  if (input.intake.passportValidity === "under-6") {
    warnings.push(
      pickLocale(
        input.language,
        "护照有效期可能限制可获批的实际延期时长，或形成额外解释压力。",
        "護照效期可能限制可獲批的實際延期時長，或形成額外解釋壓力。"
      )
    );
  }

  if (input.intake.refusalOrComplianceIssues === "yes" || input.intakeNormalization?.explanationSignals.priorIssueMentioned) {
    warnings.push(
      pickLocale(
        input.language,
        "曾有拒签或合规问题的信号应继续保持可见，并保留为人工复核项目。",
        "曾有拒簽或合規問題的訊號應繼續保持可見，並保留為人工複核項目。"
      )
    );
  }

  return warnings;
}

function buildAiMaterialGuidanceNotes(input: CaseKnowledgeInput): CaseKnowledgeMaterialGuidanceNote[] {
  if (!input.materialInterpretation) {
    return [];
  }

  return input.materialInterpretation.items.flatMap((item) => {
    const issues = readMaterialIssues(item);

    if (issues.length === 0) {
      return [];
    }

    return [
      {
        documentKey: item.documentKey,
        label: item.label,
        note: pickLocale(
          input.language,
          `材料信号：${item.interpretationNote} ${item.suggestedNextAction ?? ""}`.trim(),
          `材料訊號：${item.interpretationNote} ${item.suggestedNextAction ?? ""}`.trim()
        ),
        appliesToStatuses: ["missing", "collecting", "needs-refresh", "ready"] satisfies CaseDocumentStatus[]
      }
    ];
  });
}

function buildMetadataMaterialGuidanceNotes(input: CaseKnowledgeInput): CaseKnowledgeMaterialGuidanceNote[] {
  return input.documents.flatMap((item) => {
    const text = `${item.materialReference ?? ""} ${item.notes ?? ""} ${item.fileName ?? ""}`.toLowerCase();

    if (!containsAny(text, ["expired", "old", "outdated", "unclear", "incomplete", "过期", "過期", "旧", "舊", "不清楚", "不完整"])) {
      return [];
    }

    return [
      {
        documentKey: item.documentKey,
        label: item.label,
        note: pickLocale(
          input.language,
          "材料备注显示，这一项在交接前可能仍需要确认新鲜度或完整性。",
          "材料備註顯示，這一項在交接前可能仍需要確認新鮮度或完整性。"
        ),
        appliesToStatuses: ["collecting", "needs-refresh", "ready"] satisfies CaseDocumentStatus[]
      }
    ];
  });
}

function appendTimelineKnowledge(
  timelineNote: string,
  processingTimeNote: CaseKnowledgeProcessingTimeNote | null
) {
  if (!processingTimeNote || timelineNote.includes(processingTimeNote.referenceLabel)) {
    return timelineNote;
  }

  return `${timelineNote} ${processingTimeNote.note}`;
}

function dedupeMaterialGuidanceNotes(notes: CaseKnowledgeMaterialGuidanceNote[]) {
  return notes.filter(
    (item, index) =>
      notes.findIndex((entry) => entry.documentKey === item.documentKey && entry.note === item.note) === index
  );
}

function dedupeStrings(items: string[]) {
  return items.map((item) => item.trim()).filter(Boolean).filter((item, index, array) => array.indexOf(item) === index);
}

function containsAny(input: string, fragments: string[]) {
  return fragments.some((fragment) => input.includes(fragment));
}

function readMaterialIssues(item: { issueFlags: string[]; possibleIssues?: string[] }) {
  return dedupeStrings([...(item.possibleIssues ?? []), ...item.issueFlags]);
}
