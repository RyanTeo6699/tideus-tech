import type { SupportedUseCaseSlug } from "@/lib/case-workflows";
import { appLocales, defaultLocale, type AppLocale } from "@/lib/i18n/config";
import {
  CASE_KNOWLEDGE_PACK_VERSION,
  type CaseKnowledgeInput,
  type CaseKnowledgePack,
  type CaseKnowledgePackLocalePayload,
  type CaseKnowledgeRefreshSnapshot
} from "@/lib/knowledge/types";
import {
  buildStudyPermitExtensionKnowledgePackLocale,
  buildStudyPermitExtensionScenarioWarnings
} from "@/lib/knowledge/scenarios/study-permit-extension";
import {
  buildVisitorRecordKnowledgePackLocale,
  buildVisitorRecordScenarioWarnings
} from "@/lib/knowledge/scenarios/visitor-record";

const seedPackDefinitions = {
  "visitor-record": {
    sourceVersion: "visitor-record-seed-v1",
    sourceLabel: "tideus-visitor-record-seed-pack",
    refreshedAt: "2026-04-11T00:00:00.000Z",
    buildLocalePayload: buildVisitorRecordKnowledgePackLocale,
    buildScenarioWarnings: buildVisitorRecordScenarioWarnings
  },
  "study-permit-extension": {
    sourceVersion: "study-permit-extension-seed-v1",
    sourceLabel: "tideus-study-permit-extension-seed-pack",
    refreshedAt: "2026-04-11T00:00:00.000Z",
    buildLocalePayload: buildStudyPermitExtensionKnowledgePackLocale,
    buildScenarioWarnings: buildStudyPermitExtensionScenarioWarnings
  }
} as const satisfies Record<
  SupportedUseCaseSlug,
  {
    sourceVersion: string;
    sourceLabel: string;
    refreshedAt: string;
    buildLocalePayload: (locale: AppLocale) => CaseKnowledgePackLocalePayload;
    buildScenarioWarnings: (input: CaseKnowledgeInput) => string[];
  }
>;

export function buildSeedKnowledgePack(scenarioTag: SupportedUseCaseSlug): CaseKnowledgePack {
  const definition = seedPackDefinitions[scenarioTag];

  return {
    packVersion: CASE_KNOWLEDGE_PACK_VERSION,
    scenarioTag,
    sourceVersion: definition.sourceVersion,
    sourceLabel: definition.sourceLabel,
    refreshedAt: definition.refreshedAt,
    localizedKnowledge: {
      "zh-CN": definition.buildLocalePayload("zh-CN"),
      "zh-TW": definition.buildLocalePayload("zh-TW")
    }
  };
}

export function getKnowledgePackPayloadForLocale(
  pack: Pick<CaseKnowledgePack, "localizedKnowledge"> | null,
  locale: AppLocale = defaultLocale
): CaseKnowledgePackLocalePayload | null {
  if (!pack) {
    return null;
  }

  return pack.localizedKnowledge[locale] ?? pack.localizedKnowledge[defaultLocale] ?? null;
}

export function mergeKnowledgePacks(
  seedPack: CaseKnowledgePack,
  refreshedPack: CaseKnowledgeRefreshSnapshot | null
): CaseKnowledgePack {
  if (!refreshedPack || refreshedPack.scenarioTag !== seedPack.scenarioTag) {
    return seedPack;
  }

  return {
    packVersion: refreshedPack.packVersion,
    scenarioTag: seedPack.scenarioTag,
    sourceVersion: refreshedPack.sourceVersion || seedPack.sourceVersion,
    sourceLabel: refreshedPack.sourceLabel || seedPack.sourceLabel,
    refreshedAt: refreshedPack.refreshedAt || seedPack.refreshedAt,
    localizedKnowledge: {
      "zh-CN": mergeKnowledgePackLocalePayload(
        seedPack.localizedKnowledge["zh-CN"],
        refreshedPack.localizedKnowledge["zh-CN"] ?? null
      ),
      "zh-TW": mergeKnowledgePackLocalePayload(
        seedPack.localizedKnowledge["zh-TW"],
        refreshedPack.localizedKnowledge["zh-TW"] ?? null
      )
    }
  };
}

export function buildScenarioKnowledgeWarnings(input: CaseKnowledgeInput) {
  return seedPackDefinitions[input.useCaseSlug].buildScenarioWarnings(input);
}

function mergeKnowledgePackLocalePayload(
  seedPayload: CaseKnowledgePackLocalePayload,
  refreshedPayload: CaseKnowledgePackLocalePayload | null
): CaseKnowledgePackLocalePayload {
  if (!refreshedPayload) {
    return seedPayload;
  }

  return {
    processingTimeNote: refreshedPayload.processingTimeNote ?? seedPayload.processingTimeNote,
    supportingContextNotes:
      refreshedPayload.supportingContextNotes.length > 0
        ? refreshedPayload.supportingContextNotes
        : seedPayload.supportingContextNotes,
    materialsGuidanceNotes:
      refreshedPayload.materialsGuidanceNotes.length > 0
        ? refreshedPayload.materialsGuidanceNotes
        : seedPayload.materialsGuidanceNotes,
    scenarioSpecificWarnings:
      refreshedPayload.scenarioSpecificWarnings.length > 0
        ? refreshedPayload.scenarioSpecificWarnings
        : seedPayload.scenarioSpecificWarnings,
    officialReferenceLabels:
      refreshedPayload.officialReferenceLabels.length > 0
        ? refreshedPayload.officialReferenceLabels
        : seedPayload.officialReferenceLabels,
    references: refreshedPayload.references.length > 0 ? refreshedPayload.references : seedPayload.references
  };
}

export { appLocales };
