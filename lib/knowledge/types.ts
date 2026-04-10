import type {
  CaseDocumentStatus,
  CaseIntakeValues,
  SupportedUseCaseSlug
} from "@/lib/case-workflows";

export const CASE_KNOWLEDGE_ADAPTER_VERSION = "tideus-case-knowledge-adapter-v2";

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

export type CaseKnowledgeMaterialSnapshot = {
  id: string;
  documentKey: string;
  label: string;
  description: string;
  required: boolean;
  status: CaseDocumentStatus;
  materialReference: string | null;
  notes: string | null;
  fileName?: string | null;
  mimeType?: string | null;
};

export type CaseKnowledgeIntakeNormalization = {
  explanationSignals: {
    timelinePressure: boolean;
    fundingConcern: boolean;
    supportDependency: boolean;
    priorIssueMentioned: boolean;
    schoolProgressConcern: boolean;
    temporaryIntentConcern: boolean;
  };
  reviewNotes: string[];
};

export type CaseKnowledgeMaterialInterpretation = {
  summary: string;
  items: Array<{
    documentKey: string;
    label: string;
    issueFlags: string[];
    possibleIssues?: string[];
    likelySupportingDocsNeeded?: string[];
    interpretationNote: string;
    suggestedNextAction?: string;
  }>;
};

export type CaseKnowledgeInput = {
  useCaseSlug: SupportedUseCaseSlug;
  intake: CaseIntakeValues;
  documents: CaseKnowledgeMaterialSnapshot[];
  intakeNormalization: CaseKnowledgeIntakeNormalization | null;
  materialInterpretation: CaseKnowledgeMaterialInterpretation | null;
};

export type CaseScenarioKnowledge = {
  references: CaseKnowledgeReference[];
  supportingContextNotes: string[];
  materialsGuidanceNotes: CaseKnowledgeMaterialGuidanceNote[];
  scenarioSpecificWarnings: string[];
};
