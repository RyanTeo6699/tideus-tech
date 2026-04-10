import type { CaseReviewResult } from "@/lib/case-review";
import {
  getUseCaseDefinition,
  type CaseDocumentStatus
} from "@/lib/case-workflows";
import { buildStudyPermitExtensionKnowledge } from "@/lib/knowledge/scenarios/study-permit-extension";
import { buildVisitorRecordKnowledge } from "@/lib/knowledge/scenarios/visitor-record";
import {
  CASE_KNOWLEDGE_ADAPTER_VERSION,
  type CaseKnowledgeContext,
  type CaseKnowledgeInput,
  type CaseKnowledgeMaterialGuidanceNote,
  type CaseKnowledgeProcessingTimeNote,
  type CaseScenarioKnowledge
} from "@/lib/knowledge/types";

export { CASE_KNOWLEDGE_ADAPTER_VERSION };
export type {
  CaseKnowledgeContext,
  CaseKnowledgeInput,
  CaseKnowledgeMaterialGuidanceNote,
  CaseKnowledgeMaterialSnapshot,
  CaseKnowledgeProcessingTimeNote,
  CaseKnowledgeReference,
  CaseKnowledgeTrustLevel
} from "@/lib/knowledge/types";

export function buildKnowledgeContext(input: CaseKnowledgeInput): CaseKnowledgeContext {
  const definition = getUseCaseDefinition(input.useCaseSlug);
  const generatedAt = new Date().toISOString();

  if (!definition) {
    return {
      status: "unavailable",
      source: "tideus-internal-knowledge-adapter",
      sourceVersion: CASE_KNOWLEDGE_ADAPTER_VERSION,
      scenarioTag: input.useCaseSlug,
      generatedAt,
      processingTimeNote: null,
      supportingContextNotes: [],
      materialsGuidanceNotes: [],
      scenarioSpecificWarnings: [],
      officialReferenceLabels: [],
      references: []
    };
  }

  const scenarioKnowledge = getScenarioKnowledge(input);
  const references = scenarioKnowledge.references;
  const processingTimeNote: CaseKnowledgeProcessingTimeNote = {
    label: "Official processing-time check required",
    note:
      "Use the current IRCC processing-time reference before final handoff; Tideus stores this as a workflow reminder, not as live government processing-time data.",
    referenceLabel: "IRCC: Check processing times",
    freshness: "live-check-required"
  };

  return {
    status: "available",
    source: "tideus-internal-knowledge-adapter",
    sourceVersion: CASE_KNOWLEDGE_ADAPTER_VERSION,
    scenarioTag: input.useCaseSlug,
    generatedAt,
    processingTimeNote,
    supportingContextNotes: dedupeStrings([
      "Knowledge context is internal to Tideus workflow generation and does not create a public portal, data page, or broad search surface.",
      ...scenarioKnowledge.supportingContextNotes,
      input.intakeNormalization?.reviewNotes[0] ?? "",
      input.materialInterpretation?.items.some((item) => readMaterialIssues(item).length > 0)
        ? input.materialInterpretation.summary
        : ""
    ]).slice(0, 6),
    materialsGuidanceNotes: dedupeMaterialGuidanceNotes([
      ...scenarioKnowledge.materialsGuidanceNotes,
      ...buildAiMaterialGuidanceNotes(input),
      ...buildMetadataMaterialGuidanceNotes(input)
    ]).slice(0, 10),
    scenarioSpecificWarnings: dedupeStrings([
      ...buildSharedScenarioWarnings(input),
      ...scenarioKnowledge.scenarioSpecificWarnings
    ]).slice(0, 6),
    officialReferenceLabels: references.map((item) => item.label),
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
    "Check and note the current IRCC processing-time reference before final handoff or professional review."
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
    scenarioTag: context.scenarioTag,
    generatedAt: context.generatedAt,
    processingTimeReferenceLabel: context.processingTimeNote?.referenceLabel ?? null,
    supportingContextNoteCount: context.supportingContextNotes.length,
    materialsGuidanceNoteCount: context.materialsGuidanceNotes.length,
    scenarioWarningCount: context.scenarioSpecificWarnings.length,
    officialReferenceCount: context.officialReferenceLabels.length
  };
}

function getScenarioKnowledge(input: CaseKnowledgeInput): CaseScenarioKnowledge {
  if (input.useCaseSlug === "visitor-record") {
    return buildVisitorRecordKnowledge(input);
  }

  return buildStudyPermitExtensionKnowledge(input);
}

function buildSharedScenarioWarnings(input: CaseKnowledgeInput) {
  const warnings: string[] = [];

  if (input.intake.urgency === "under-30") {
    warnings.push(
      "The status-expiry window is short, so official timing and remaining evidence work should be checked before handoff."
    );
  }

  if (input.intake.passportValidity === "under-6") {
    warnings.push("Passport validity may constrain the practical extension period or create an explanation issue.");
  }

  if (input.intake.refusalOrComplianceIssues === "yes" || input.intakeNormalization?.explanationSignals.priorIssueMentioned) {
    warnings.push("Prior refusal or compliance signals should stay visible as a professional-review item.");
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
        note: `Material signal: ${item.interpretationNote} ${item.suggestedNextAction ?? ""}`.trim(),
        appliesToStatuses: ["missing", "collecting", "needs-refresh", "ready"] satisfies CaseDocumentStatus[]
      }
    ];
  });
}

function buildMetadataMaterialGuidanceNotes(input: CaseKnowledgeInput): CaseKnowledgeMaterialGuidanceNote[] {
  return input.documents.flatMap((item) => {
    const text = `${item.materialReference ?? ""} ${item.notes ?? ""} ${item.fileName ?? ""}`.toLowerCase();

    if (!containsAny(text, ["expired", "old", "outdated", "unclear", "incomplete"])) {
      return [];
    }

    return [
      {
        documentKey: item.documentKey,
        label: item.label,
        note: "Material note indicates this item may need freshness or completeness review before handoff.",
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
