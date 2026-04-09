import type { CaseReviewResult } from "@/lib/case-review";
import type {
  CaseIntakeNormalizationOutput,
  CaseMaterialInterpretationOutput,
  CaseMaterialSnapshot
} from "@/lib/case-ai";
import {
  getUseCaseDefinition,
  type CaseDocumentStatus,
  type CaseIntakeValues,
  type SupportedUseCaseSlug
} from "@/lib/case-workflows";

export type CaseKnowledgeTrustLevel = "official-context" | "scenario-workflow" | "case-derived";

export type CaseKnowledgeReference = {
  label: string;
  referenceType: "official-context" | "processing-time" | "materials-guidance";
  trustLevel: CaseKnowledgeTrustLevel;
  freshness: "static-adapter" | "live-check-required";
};

export type CaseKnowledgeProcessingTimeNote = {
  label: string;
  note: string;
  referenceLabel: string;
  freshness: "live-check-required";
};

export type CaseKnowledgeMaterialGuidanceNote = {
  documentKey: string;
  label: string;
  note: string;
  appliesToStatuses: CaseDocumentStatus[];
};

export type CaseKnowledgeContext = {
  status: "available" | "unavailable";
  source: "tideus-internal-knowledge-adapter";
  sourceVersion: typeof CASE_KNOWLEDGE_ADAPTER_VERSION;
  scenarioTag: SupportedUseCaseSlug;
  generatedAt: string;
  processingTimeNote: CaseKnowledgeProcessingTimeNote | null;
  supportingContextNotes: string[];
  materialsGuidanceNotes: CaseKnowledgeMaterialGuidanceNote[];
  scenarioSpecificWarnings: string[];
  officialReferenceLabels: string[];
  references: CaseKnowledgeReference[];
};

export type CaseKnowledgeInput = {
  useCaseSlug: SupportedUseCaseSlug;
  intake: CaseIntakeValues;
  documents: CaseMaterialSnapshot[];
  intakeNormalization: CaseIntakeNormalizationOutput | null;
  materialInterpretation: CaseMaterialInterpretationOutput | null;
};

export const CASE_KNOWLEDGE_ADAPTER_VERSION = "tideus-case-knowledge-adapter-v1";

export function buildCaseKnowledgeContext(input: CaseKnowledgeInput): CaseKnowledgeContext {
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

  const references = getScenarioReferences(input.useCaseSlug);
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
    supportingContextNotes: buildSupportingContextNotes(input),
    materialsGuidanceNotes: buildMaterialsGuidanceNotes(input),
    scenarioSpecificWarnings: buildScenarioSpecificWarnings(input),
    officialReferenceLabels: references.map((item) => item.label),
    references
  };
}

export function applyCaseKnowledgeToReview(review: CaseReviewResult, knowledgeContext: CaseKnowledgeContext): CaseReviewResult {
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
    nextSteps
  };
}

export function summarizeCaseKnowledgeContext(context: CaseKnowledgeContext) {
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

function getScenarioReferences(useCaseSlug: SupportedUseCaseSlug): CaseKnowledgeReference[] {
  const shared: CaseKnowledgeReference[] = [
    {
      label: "IRCC: Check processing times",
      referenceType: "processing-time",
      trustLevel: "official-context",
      freshness: "live-check-required"
    }
  ];

  if (useCaseSlug === "visitor-record") {
    return [
      ...shared,
      {
        label: "IRCC: Extend your stay in Canada as a visitor",
        referenceType: "official-context",
        trustLevel: "official-context",
        freshness: "static-adapter"
      },
      {
        label: "IRCC: Visitor record application guide",
        referenceType: "materials-guidance",
        trustLevel: "official-context",
        freshness: "static-adapter"
      }
    ];
  }

  return [
    ...shared,
    {
      label: "IRCC: Extend your study permit",
      referenceType: "official-context",
      trustLevel: "official-context",
      freshness: "static-adapter"
    },
    {
      label: "IRCC: Study permit extension document checklist",
      referenceType: "materials-guidance",
      trustLevel: "official-context",
      freshness: "static-adapter"
    }
  ];
}

function buildSupportingContextNotes(input: CaseKnowledgeInput) {
  const notes = [
    "Knowledge context is internal to review generation and does not create a public portal, data page, or search surface.",
    input.intakeNormalization?.reviewNotes[0] ?? "",
    input.materialInterpretation?.items.some((item) => item.issueFlags.length > 0)
      ? input.materialInterpretation.summary
      : ""
  ];

  return dedupeStrings(notes).slice(0, 5);
}

function buildMaterialsGuidanceNotes(input: CaseKnowledgeInput): CaseKnowledgeMaterialGuidanceNote[] {
  const scenarioNotes = getScenarioMaterialsGuidance(input.useCaseSlug);
  const interpretationNotes = input.materialInterpretation
    ? input.materialInterpretation.items.flatMap((item) => {
        if (item.issueFlags.length === 0) {
          return [];
        }

        return [
          {
            documentKey: item.documentKey,
            label: item.label,
            note: `Material signal: ${item.interpretationNote}`,
            appliesToStatuses: ["missing", "collecting", "needs-refresh", "ready"] satisfies CaseDocumentStatus[]
          }
        ];
      })
    : [];
  const metadataNotes = input.documents.flatMap((item) => {
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

  return dedupeMaterialGuidanceNotes([...scenarioNotes, ...interpretationNotes, ...metadataNotes]).slice(0, 10);
}

function getScenarioMaterialsGuidance(useCaseSlug: SupportedUseCaseSlug): CaseKnowledgeMaterialGuidanceNote[] {
  if (useCaseSlug === "visitor-record") {
    return [
      {
        documentKey: "extension-explanation",
        label: "Extension explanation letter",
        note: "Internal context: the explanation should connect the extension reason, temporary intent, support record, and planned end point.",
        appliesToStatuses: ["missing", "collecting", "needs-refresh", "ready"]
      },
      {
        documentKey: "proof-of-funds",
        label: "Proof of funds",
        note: "Internal context: funding evidence should match the requested stay length and the support story used in the explanation.",
        appliesToStatuses: ["missing", "collecting", "needs-refresh", "ready"]
      },
      {
        documentKey: "temporary-intent-support",
        label: "Temporary intent support",
        note: "Internal context: temporary-intent support should make the visit look time-bound instead of open-ended.",
        appliesToStatuses: ["missing", "collecting", "needs-refresh", "ready"]
      }
    ];
  }

  return [
    {
      documentKey: "enrolment-letter",
      label: "Enrolment letter",
      note: "Internal context: enrolment proof should be current and align with the requested extension period.",
      appliesToStatuses: ["missing", "collecting", "needs-refresh", "ready"]
    },
    {
      documentKey: "transcript-or-progress",
      label: "Transcript or progress evidence",
      note: "Internal context: progress evidence should make academic standing or any study delay easy to understand.",
      appliesToStatuses: ["missing", "collecting", "needs-refresh", "ready"]
    },
    {
      documentKey: "proof-of-funds",
      label: "Proof of funds",
      note: "Internal context: funding evidence should support the remaining study period and living-cost position.",
      appliesToStatuses: ["missing", "collecting", "needs-refresh", "ready"]
    },
    {
      documentKey: "extension-explanation",
      label: "Extension explanation letter",
      note: "Internal context: the explanation should tie program timing, funding, current status, and the extension reason together.",
      appliesToStatuses: ["missing", "collecting", "needs-refresh", "ready"]
    }
  ];
}

function buildScenarioSpecificWarnings(input: CaseKnowledgeInput) {
  const { intake, useCaseSlug } = input;
  const warnings: string[] = [];

  if (intake.urgency === "under-30") {
    warnings.push("The status-expiry window is short, so official timing and remaining evidence work should be checked before handoff.");
  }

  if (intake.passportValidity === "under-6") {
    warnings.push("Passport validity may constrain the practical extension period or create an explanation issue.");
  }

  if (intake.refusalOrComplianceIssues === "yes" || input.intakeNormalization?.explanationSignals.priorIssueMentioned) {
    warnings.push("Prior refusal or compliance signals should stay visible as a professional-review item.");
  }

  if (useCaseSlug === "visitor-record") {
    if (intake.currentStatus && intake.currentStatus !== "visitor") {
      warnings.push("This Visitor Record workflow assumes visitor-status extension prep, so the current status should be confirmed.");
    }

    if (intake.scenarioProgressStatus === "weak" || input.intakeNormalization?.explanationSignals.temporaryIntentConcern) {
      warnings.push("Temporary intent is a scenario-specific pressure point and should be supported by clear facts, not generic explanation language.");
    }

    if (intake.applicationReason === "family-or-host" && intake.supportEvidenceStatus !== "ready") {
      warnings.push("Host or accommodation support is part of the case story but the support record is not yet clean.");
    }
  }

  if (useCaseSlug === "study-permit-extension") {
    if (intake.currentStatus && intake.currentStatus !== "student") {
      warnings.push("This Study Permit Extension workflow assumes in-status student extension prep, so the current status should be confirmed.");
    }

    if (intake.scenarioProgressStatus !== "good-standing" || input.intakeNormalization?.explanationSignals.schoolProgressConcern) {
      warnings.push("Academic standing, tuition, or progress issues should be explained directly before the package is treated as clean.");
    }

    if (intake.supportEvidenceStatus !== "ready") {
      warnings.push("Current enrolment evidence is central to this scenario and should be refreshed before final handoff.");
    }
  }

  return dedupeStrings(warnings).slice(0, 6);
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
