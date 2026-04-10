import OpenAI from "openai";

import type { Json, Tables } from "@/lib/database.types";
import type { CaseReviewResult, CaseRiskFlag } from "@/lib/case-review";
import type { CaseKnowledgeContext } from "@/lib/knowledge/types";
import {
  getCaseIntakeFields,
  getUseCaseDefinition,
  type CaseDocumentStatus,
  type CaseIntakeValues,
  type CaseReadinessStatus,
  type SupportedUseCaseSlug
} from "@/lib/case-workflows";

export type CaseAiSource = "openai" | "deterministic-fallback";

export type CaseAiEnvelope<T> = {
  source: CaseAiSource;
  promptVersion: string;
  model: string | null;
  generatedAt: string;
  inputSnapshot: Json;
  output: T;
  fallbackReason: string | null;
};

export type CaseIntakeNormalizationOutput = {
  inferredFields: Partial<Record<Exclude<keyof CaseIntakeValues, "title" | "notes">, string>>;
  explanationSignals: {
    timelinePressure: boolean;
    fundingConcern: boolean;
    supportDependency: boolean;
    priorIssueMentioned: boolean;
    schoolProgressConcern: boolean;
    temporaryIntentConcern: boolean;
  };
  extractedFacts: Array<{
    label: string;
    value: string;
    confidence: number;
  }>;
  reviewNotes: string[];
};

export type CaseMaterialInterpretationItem = {
  documentId: string;
  documentKey: string;
  label: string;
  likelyDocumentType: string;
  suggestedStatus: CaseDocumentStatus;
  issueFlags: string[];
  possibleIssues: string[];
  likelySupportingDocsNeeded: string[];
  recommendedMaterialStatus: CaseDocumentStatus;
  confidence: number;
  interpretationNote: string;
  suggestedNextAction: string;
  reasoningSummary: string;
};

export type CaseMaterialInterpretationOutput = {
  summary: string;
  items: CaseMaterialInterpretationItem[];
};

export type CaseMaterialWorkspaceActionType =
  | "explain-missing"
  | "explain-review-needed"
  | "suggest-next-action"
  | "suggest-regenerate-review"
  | "suggest-supporting-docs";

export type CaseMaterialWorkspaceActionOutput = {
  documentId: string;
  documentKey: string;
  label: string;
  likelyDocumentType: string;
  confidence: number;
  possibleIssues: string[];
  likelySupportingDocsNeeded: string[];
  recommendedMaterialStatus: CaseDocumentStatus;
  suggestedNextAction: string;
  reasoningSummary: string;
  regenerateReviewRecommendation: "not-needed" | "consider-after-material-update" | "recommended-now";
  readinessImpact: "no-visible-impact" | "may-reduce-missing-items" | "may-reduce-risk" | "may-improve-handoff-quality" | "needs-review-before-impact";
};

export type CaseReviewDelta = {
  improvedAreas: string[];
  remainingGaps: string[];
  newRisks: string[];
  removedRisks: string[];
  priorityActions: string[];
};

export type CaseHandoffIntelligence = {
  externalSummary: string;
  reviewReadyStatus: CaseReadinessStatus;
  issuesNeedingHumanReview: string[];
  supportingNotes: string[];
  escalationTriggers: string[];
};

export type CaseQuestionTrackerAction = {
  label: string;
  detail: string;
  priority: "low" | "medium" | "high";
  actionType: "collect-material" | "verify-deadline" | "draft-explanation" | "review-risk" | "generate-checklist" | "continue-workspace";
  documentKey: string;
};

export type CaseQuestionAnswer = {
  summary: string;
  whyThisMatters: string;
  supportingContextNotes: string[];
  scenarioSpecificWarnings: string[];
  nextSteps: string[];
  trackerActions: CaseQuestionTrackerAction[];
};

export type CaseReviewAiInput = {
  useCaseSlug: SupportedUseCaseSlug;
  intake: CaseIntakeValues;
  documents: CaseMaterialSnapshot[];
  baselineReview: CaseReviewResult;
  intakeNormalization: CaseIntakeNormalizationOutput | null;
  materialInterpretation: CaseMaterialInterpretationOutput | null;
  knowledgeContext: CaseKnowledgeContext | null;
};

export type CaseMaterialWorkspaceActionInput = {
  useCaseSlug: SupportedUseCaseSlug;
  actionType: CaseMaterialWorkspaceActionType;
  document: CaseMaterialSnapshot;
  documents: CaseMaterialSnapshot[];
  latestReview: CaseReviewResult | null;
  knowledgeContext: CaseKnowledgeContext | null;
  materialInterpretation: CaseMaterialInterpretationOutput | null;
};

export type CaseMaterialSnapshot = {
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

export type CaseReviewDeltaInput = {
  useCaseSlug: SupportedUseCaseSlug;
  previousReview: CaseReviewResult;
  latestReview: CaseReviewResult;
};

export type CaseHandoffIntelligenceInput = {
  useCaseSlug: SupportedUseCaseSlug;
  caseTitle: string;
  reviewVersion: number;
  latestReview: CaseReviewResult;
  knowledgeContext: CaseKnowledgeContext | null;
};

export type CaseQuestionAiInput = {
  useCaseSlug: SupportedUseCaseSlug;
  question: string;
  knowledgeContext: CaseKnowledgeContext | null;
  caseContext?: {
    caseId?: string | null;
    caseTitle?: string | null;
    caseStatus?: string | null;
    latestReview?: CaseReviewResult | null;
    previousReview?: CaseReviewResult | null;
    reviewDelta?: CaseReviewDelta | null;
    documents?: CaseMaterialSnapshot[];
  };
};

const DEFAULT_OPENAI_MODEL = "gpt-5-mini";
const OPENAI_TIMEOUT_MS = 12_000;

export const caseAiPromptVersions = {
  intakeNormalization: "case-intake-normalization-v1",
  materialInterpretation: "case-material-interpretation-v2",
  materialWorkspaceAction: "case-material-workspace-action-v1",
  reviewEnrichment: "case-review-enrichment-v2",
  reviewDelta: "case-review-delta-v1",
  caseQuestionAnswer: "case-question-answer-v1",
  handoffIntelligence: "case-handoff-intelligence-v1"
} as const;

const readinessStatuses = ["not-ready", "needs-attention", "almost-ready", "review-ready"] as const;
const documentStatuses = ["missing", "collecting", "needs-refresh", "ready", "not-applicable"] as const;
const riskSeverities = ["low", "medium", "high"] as const;
const caseQuestionTrackerActionTypes = [
  "collect-material",
  "verify-deadline",
  "draft-explanation",
  "review-risk",
  "generate-checklist",
  "continue-workspace"
] as const;

const intakeNormalizationResponseFormat = {
  type: "json_schema",
  name: "case_intake_normalization",
  strict: true,
  schema: {
    type: "object",
    properties: {
      inferredFields: {
        type: "object",
        properties: {
          currentStatus: { type: "string" },
          currentPermitExpiry: { type: "string" },
          urgency: { type: "string" },
          passportValidity: { type: "string" },
          proofOfFundsStatus: { type: "string" },
          refusalOrComplianceIssues: { type: "string" },
          applicationReason: { type: "string" },
          supportEntityName: { type: "string" },
          supportEvidenceStatus: { type: "string" },
          scenarioProgressStatus: { type: "string" }
        },
        required: [
          "currentStatus",
          "currentPermitExpiry",
          "urgency",
          "passportValidity",
          "proofOfFundsStatus",
          "refusalOrComplianceIssues",
          "applicationReason",
          "supportEntityName",
          "supportEvidenceStatus",
          "scenarioProgressStatus"
        ],
        additionalProperties: false
      },
      explanationSignals: {
        type: "object",
        properties: {
          timelinePressure: { type: "boolean" },
          fundingConcern: { type: "boolean" },
          supportDependency: { type: "boolean" },
          priorIssueMentioned: { type: "boolean" },
          schoolProgressConcern: { type: "boolean" },
          temporaryIntentConcern: { type: "boolean" }
        },
        required: [
          "timelinePressure",
          "fundingConcern",
          "supportDependency",
          "priorIssueMentioned",
          "schoolProgressConcern",
          "temporaryIntentConcern"
        ],
        additionalProperties: false
      },
      extractedFacts: {
        type: "array",
        maxItems: 6,
        items: {
          type: "object",
          properties: {
            label: { type: "string" },
            value: { type: "string" },
            confidence: { type: "number" }
          },
          required: ["label", "value", "confidence"],
          additionalProperties: false
        }
      },
      reviewNotes: {
        type: "array",
        maxItems: 5,
        items: { type: "string" }
      }
    },
    required: ["inferredFields", "explanationSignals", "extractedFacts", "reviewNotes"],
    additionalProperties: false
  }
} as const;

const materialInterpretationResponseFormat = {
  type: "json_schema",
  name: "case_material_interpretation",
  strict: true,
  schema: {
    type: "object",
    properties: {
      summary: { type: "string" },
      items: {
        type: "array",
        maxItems: 12,
        items: {
          type: "object",
          properties: {
            documentId: { type: "string" },
            documentKey: { type: "string" },
            label: { type: "string" },
            likelyDocumentType: { type: "string" },
            suggestedStatus: {
              type: "string",
              enum: ["missing", "collecting", "needs-refresh", "ready", "not-applicable"]
            },
            issueFlags: {
              type: "array",
              maxItems: 4,
              items: { type: "string" }
            },
            possibleIssues: {
              type: "array",
              maxItems: 5,
              items: { type: "string" }
            },
            likelySupportingDocsNeeded: {
              type: "array",
              maxItems: 5,
              items: { type: "string" }
            },
            recommendedMaterialStatus: {
              type: "string",
              enum: ["missing", "collecting", "needs-refresh", "ready", "not-applicable"]
            },
            confidence: { type: "number" },
            interpretationNote: { type: "string" },
            suggestedNextAction: { type: "string" },
            reasoningSummary: { type: "string" }
          },
          required: [
            "documentId",
            "documentKey",
            "label",
            "likelyDocumentType",
            "suggestedStatus",
            "issueFlags",
            "possibleIssues",
            "likelySupportingDocsNeeded",
            "recommendedMaterialStatus",
            "confidence",
            "interpretationNote",
            "suggestedNextAction",
            "reasoningSummary"
          ],
          additionalProperties: false
        }
      }
    },
    required: ["summary", "items"],
    additionalProperties: false
  }
} as const;

const materialWorkspaceActionResponseFormat = {
  type: "json_schema",
  name: "case_material_workspace_action",
  strict: true,
  schema: {
    type: "object",
    properties: {
      documentId: { type: "string" },
      documentKey: { type: "string" },
      label: { type: "string" },
      likelyDocumentType: { type: "string" },
      confidence: { type: "number" },
      possibleIssues: {
        type: "array",
        maxItems: 5,
        items: { type: "string" }
      },
      likelySupportingDocsNeeded: {
        type: "array",
        maxItems: 5,
        items: { type: "string" }
      },
      recommendedMaterialStatus: {
        type: "string",
        enum: ["missing", "collecting", "needs-refresh", "ready", "not-applicable"]
      },
      suggestedNextAction: { type: "string" },
      reasoningSummary: { type: "string" },
      regenerateReviewRecommendation: {
        type: "string",
        enum: ["not-needed", "consider-after-material-update", "recommended-now"]
      },
      readinessImpact: {
        type: "string",
        enum: [
          "no-visible-impact",
          "may-reduce-missing-items",
          "may-reduce-risk",
          "may-improve-handoff-quality",
          "needs-review-before-impact"
        ]
      }
    },
    required: [
      "documentId",
      "documentKey",
      "label",
      "likelyDocumentType",
      "confidence",
      "possibleIssues",
      "likelySupportingDocsNeeded",
      "recommendedMaterialStatus",
      "suggestedNextAction",
      "reasoningSummary",
      "regenerateReviewRecommendation",
      "readinessImpact"
    ],
    additionalProperties: false
  }
} as const;

const reviewEnrichmentResponseFormat = {
  type: "json_schema",
  name: "case_review_enrichment",
  strict: true,
  schema: {
    type: "object",
    properties: {
      readinessStatus: {
        type: "string",
        enum: ["not-ready", "needs-attention", "almost-ready", "review-ready"]
      },
      readinessSummary: { type: "string" },
      summary: { type: "string" },
      timelineNote: { type: "string" },
      checklist: {
        type: "array",
        maxItems: 12,
        items: {
          type: "object",
          properties: {
            key: { type: "string" },
            label: { type: "string" },
            detail: { type: "string" },
            status: {
              type: "string",
              enum: ["missing", "collecting", "needs-refresh", "ready", "not-applicable"]
            },
            materialReference: { type: "string" }
          },
          required: ["key", "label", "detail", "status", "materialReference"],
          additionalProperties: false
        }
      },
      missingItems: {
        type: "array",
        maxItems: 12,
        items: { type: "string" }
      },
      riskFlags: {
        type: "array",
        maxItems: 10,
        items: {
          type: "object",
          properties: {
            label: { type: "string" },
            severity: {
              type: "string",
              enum: ["low", "medium", "high"]
            },
            detail: { type: "string" }
          },
          required: ["label", "severity", "detail"],
          additionalProperties: false
        }
      },
      nextSteps: {
        type: "array",
        maxItems: 6,
        items: { type: "string" }
      },
      supportingContextNotes: {
        type: "array",
        maxItems: 8,
        items: { type: "string" }
      },
      officialReferenceLabels: {
        type: "array",
        maxItems: 8,
        items: { type: "string" }
      }
    },
    required: [
      "readinessStatus",
      "readinessSummary",
      "summary",
      "timelineNote",
      "checklist",
      "missingItems",
      "riskFlags",
      "nextSteps",
      "supportingContextNotes",
      "officialReferenceLabels"
    ],
    additionalProperties: false
  }
} as const;

const reviewDeltaResponseFormat = {
  type: "json_schema",
  name: "case_review_delta",
  strict: true,
  schema: {
    type: "object",
    properties: {
      improvedAreas: {
        type: "array",
        maxItems: 5,
        items: { type: "string" }
      },
      remainingGaps: {
        type: "array",
        maxItems: 5,
        items: { type: "string" }
      },
      newRisks: {
        type: "array",
        maxItems: 5,
        items: { type: "string" }
      },
      removedRisks: {
        type: "array",
        maxItems: 5,
        items: { type: "string" }
      },
      priorityActions: {
        type: "array",
        maxItems: 5,
        items: { type: "string" }
      }
    },
    required: ["improvedAreas", "remainingGaps", "newRisks", "removedRisks", "priorityActions"],
    additionalProperties: false
  }
} as const;

const handoffIntelligenceResponseFormat = {
  type: "json_schema",
  name: "case_handoff_intelligence",
  strict: true,
  schema: {
    type: "object",
    properties: {
      externalSummary: { type: "string" },
      reviewReadyStatus: {
        type: "string",
        enum: ["not-ready", "needs-attention", "almost-ready", "review-ready"]
      },
      issuesNeedingHumanReview: {
        type: "array",
        maxItems: 8,
        items: { type: "string" }
      },
      supportingNotes: {
        type: "array",
        maxItems: 8,
        items: { type: "string" }
      },
      escalationTriggers: {
        type: "array",
        maxItems: 6,
        items: { type: "string" }
      }
    },
    required: [
      "externalSummary",
      "reviewReadyStatus",
      "issuesNeedingHumanReview",
      "supportingNotes",
      "escalationTriggers"
    ],
    additionalProperties: false
  }
} as const;

const caseQuestionAnswerResponseFormat = {
  type: "json_schema",
  name: "case_question_answer",
  strict: true,
  schema: {
    type: "object",
    properties: {
      summary: { type: "string" },
      whyThisMatters: { type: "string" },
      supportingContextNotes: {
        type: "array",
        maxItems: 6,
        items: { type: "string" }
      },
      scenarioSpecificWarnings: {
        type: "array",
        maxItems: 6,
        items: { type: "string" }
      },
      nextSteps: {
        type: "array",
        maxItems: 6,
        items: { type: "string" }
      },
      trackerActions: {
        type: "array",
        maxItems: 6,
        items: {
          type: "object",
          properties: {
            label: { type: "string" },
            detail: { type: "string" },
            priority: {
              type: "string",
              enum: ["low", "medium", "high"]
            },
            actionType: {
              type: "string",
              enum: [
                "collect-material",
                "verify-deadline",
                "draft-explanation",
                "review-risk",
                "generate-checklist",
                "continue-workspace"
              ]
            },
            documentKey: { type: "string" }
          },
          required: ["label", "detail", "priority", "actionType", "documentKey"],
          additionalProperties: false
        }
      }
    },
    required: [
      "summary",
      "whyThisMatters",
      "supportingContextNotes",
      "scenarioSpecificWarnings",
      "nextSteps",
      "trackerActions"
    ],
    additionalProperties: false
  }
} as const;

let cachedClient: OpenAI | null | undefined;

export async function normalizeCaseIntakeWithAi(
  useCaseSlug: SupportedUseCaseSlug,
  intake: CaseIntakeValues
): Promise<CaseAiEnvelope<CaseIntakeNormalizationOutput>> {
  const inputSnapshot = buildIntakeNormalizationSnapshot(useCaseSlug, intake);
  const fallback = (reason: string) =>
    buildEnvelope({
      source: "deterministic-fallback",
      promptVersion: caseAiPromptVersions.intakeNormalization,
      inputSnapshot,
      output: buildDeterministicIntakeNormalization(useCaseSlug, intake),
      fallbackReason: reason
    });

  if (!intake.notes.trim()) {
    return fallback("No freeform intake notes were provided.");
  }

  const client = getOpenAIClient();

  if (!client) {
    return fallback("OpenAI API key not configured.");
  }

  const model = getOpenAIModel();

  try {
    const response = (await Promise.race([
      client.responses.create({
        model,
        store: false,
        input: buildIntakeNormalizationPrompt(useCaseSlug, intake),
        text: {
          format: intakeNormalizationResponseFormat
        }
      }),
      rejectAfter(OPENAI_TIMEOUT_MS, "OpenAI intake normalization request timed out.")
    ])) as {
      output_text?: string | null;
    };
    const parsed = safeParseJson(response.output_text);
    const output = parseIntakeNormalizationOutput(parsed, useCaseSlug);

    if (!output) {
      return fallback("OpenAI intake normalization response did not match the required schema.");
    }

    return buildEnvelope({
      source: "openai",
      promptVersion: caseAiPromptVersions.intakeNormalization,
      model,
      inputSnapshot,
      output,
      fallbackReason: null
    });
  } catch (error) {
    return fallback(error instanceof Error ? error.message : "OpenAI intake normalization request failed.");
  }
}

export async function interpretCaseMaterialsWithAi(
  useCaseSlug: SupportedUseCaseSlug,
  documents: CaseMaterialSnapshot[]
): Promise<CaseAiEnvelope<CaseMaterialInterpretationOutput>> {
  const inputSnapshot = buildMaterialInterpretationSnapshot(useCaseSlug, documents);
  const fallback = (reason: string) =>
    buildEnvelope({
      source: "deterministic-fallback",
      promptVersion: caseAiPromptVersions.materialInterpretation,
      inputSnapshot,
      output: buildDeterministicMaterialInterpretation(documents),
      fallbackReason: reason
    });

  const hasMaterialContext = documents.some((item) => item.materialReference || item.notes || item.fileName);

  if (!hasMaterialContext) {
    return fallback("No material reference, file name, or material notes were provided.");
  }

  const client = getOpenAIClient();

  if (!client) {
    return fallback("OpenAI API key not configured.");
  }

  const model = getOpenAIModel();

  try {
    const response = (await Promise.race([
      client.responses.create({
        model,
        store: false,
        input: buildMaterialInterpretationPrompt(useCaseSlug, documents),
        text: {
          format: materialInterpretationResponseFormat
        }
      }),
      rejectAfter(OPENAI_TIMEOUT_MS, "OpenAI material interpretation request timed out.")
    ])) as {
      output_text?: string | null;
    };
    const parsed = safeParseJson(response.output_text);
    const output = parseMaterialInterpretationOutput(parsed, documents);

    if (!output) {
      return fallback("OpenAI material interpretation response did not match the required schema.");
    }

    return buildEnvelope({
      source: "openai",
      promptVersion: caseAiPromptVersions.materialInterpretation,
      model,
      inputSnapshot,
      output,
      fallbackReason: null
    });
  } catch (error) {
    return fallback(error instanceof Error ? error.message : "OpenAI material interpretation request failed.");
  }
}

export async function buildCaseMaterialWorkspaceActionWithAi(
  input: CaseMaterialWorkspaceActionInput
): Promise<CaseAiEnvelope<CaseMaterialWorkspaceActionOutput>> {
  const inputSnapshot = buildMaterialWorkspaceActionSnapshot(input);
  const baselineAction = buildDeterministicMaterialWorkspaceAction(input);
  const fallback = (reason: string) =>
    buildEnvelope({
      source: "deterministic-fallback",
      promptVersion: caseAiPromptVersions.materialWorkspaceAction,
      inputSnapshot,
      output: baselineAction,
      fallbackReason: reason
    });
  const client = getOpenAIClient();

  if (!client) {
    return fallback("OpenAI API key not configured.");
  }

  const model = getOpenAIModel();

  try {
    const response = (await Promise.race([
      client.responses.create({
        model,
        store: false,
        input: buildMaterialWorkspaceActionPrompt(input, baselineAction),
        text: {
          format: materialWorkspaceActionResponseFormat
        }
      }),
      rejectAfter(OPENAI_TIMEOUT_MS, "OpenAI material workspace action request timed out.")
    ])) as {
      output_text?: string | null;
    };
    const parsed = safeParseJson(response.output_text);
    const aiAction = parseMaterialWorkspaceActionOutput(parsed, input.document);

    if (!aiAction) {
      return fallback("OpenAI material workspace action response did not match the required schema.");
    }

    return buildEnvelope({
      source: "openai",
      promptVersion: caseAiPromptVersions.materialWorkspaceAction,
      model,
      inputSnapshot,
      output: mergeMaterialWorkspaceActionOutputs(baselineAction, aiAction),
      fallbackReason: null
    });
  } catch (error) {
    return fallback(error instanceof Error ? error.message : "OpenAI material workspace action request failed.");
  }
}

export async function enrichCaseReviewWithAi(input: CaseReviewAiInput): Promise<{
  review: CaseReviewResult;
  trace: CaseAiEnvelope<CaseReviewResult>;
}> {
  const inputSnapshot = buildReviewEnrichmentSnapshot(input);
  const fallback = (reason: string) => ({
    review: input.baselineReview,
    trace: buildEnvelope({
      source: "deterministic-fallback",
      promptVersion: caseAiPromptVersions.reviewEnrichment,
      inputSnapshot,
      output: input.baselineReview,
      fallbackReason: reason
    })
  });
  const client = getOpenAIClient();

  if (!client) {
    return fallback("OpenAI API key not configured.");
  }

  const model = getOpenAIModel();

  try {
    const response = (await Promise.race([
      client.responses.create({
        model,
        store: false,
        input: buildReviewEnrichmentPrompt(input),
        text: {
          format: reviewEnrichmentResponseFormat
        }
      }),
      rejectAfter(OPENAI_TIMEOUT_MS, "OpenAI review enrichment request timed out.")
    ])) as {
      output_text?: string | null;
    };
    const parsed = safeParseJson(response.output_text);
    const aiReview = parseCaseReviewOutput(parsed, input.baselineReview);

    if (!aiReview) {
      return fallback("OpenAI review enrichment response did not match the required schema.");
    }

    const review = mergeCaseReviewOutputs(input.baselineReview, aiReview);

    return {
      review,
      trace: buildEnvelope({
        source: "openai",
        promptVersion: caseAiPromptVersions.reviewEnrichment,
        model,
        inputSnapshot,
        output: review,
        fallbackReason: null
      })
    };
  } catch (error) {
    return fallback(error instanceof Error ? error.message : "OpenAI review enrichment request failed.");
  }
}

export async function buildCaseReviewDeltaWithAi(input: CaseReviewDeltaInput): Promise<CaseAiEnvelope<CaseReviewDelta>> {
  const inputSnapshot = buildReviewDeltaSnapshot(input);
  const baselineDelta = buildDeterministicReviewDelta(input.previousReview, input.latestReview);
  const fallback = (reason: string) =>
    buildEnvelope({
      source: "deterministic-fallback",
      promptVersion: caseAiPromptVersions.reviewDelta,
      inputSnapshot,
      output: baselineDelta,
      fallbackReason: reason
    });
  const client = getOpenAIClient();

  if (!client) {
    return fallback("OpenAI API key not configured.");
  }

  const model = getOpenAIModel();

  try {
    const response = (await Promise.race([
      client.responses.create({
        model,
        store: false,
        input: buildReviewDeltaPrompt(input, baselineDelta),
        text: {
          format: reviewDeltaResponseFormat
        }
      }),
      rejectAfter(OPENAI_TIMEOUT_MS, "OpenAI review delta request timed out.")
    ])) as {
      output_text?: string | null;
    };
    const parsed = safeParseJson(response.output_text);
    const aiDelta = parseReviewDeltaOutput(parsed);

    if (!aiDelta) {
      return fallback("OpenAI review delta response did not match the required schema.");
    }

    return buildEnvelope({
      source: "openai",
      promptVersion: caseAiPromptVersions.reviewDelta,
      model,
      inputSnapshot,
      output: mergeReviewDeltaOutputs(baselineDelta, aiDelta),
      fallbackReason: null
    });
  } catch (error) {
    return fallback(error instanceof Error ? error.message : "OpenAI review delta request failed.");
  }
}

export async function buildCaseHandoffIntelligenceWithAi(
  input: CaseHandoffIntelligenceInput
): Promise<CaseAiEnvelope<CaseHandoffIntelligence>> {
  const inputSnapshot = buildHandoffIntelligenceSnapshot(input);
  const baselineHandoff = buildDeterministicHandoffIntelligence(input);
  const fallback = (reason: string) =>
    buildEnvelope({
      source: "deterministic-fallback",
      promptVersion: caseAiPromptVersions.handoffIntelligence,
      inputSnapshot,
      output: baselineHandoff,
      fallbackReason: reason
    });
  const client = getOpenAIClient();

  if (!client) {
    return fallback("OpenAI API key not configured.");
  }

  const model = getOpenAIModel();

  try {
    const response = (await Promise.race([
      client.responses.create({
        model,
        store: false,
        input: buildHandoffIntelligencePrompt(input, baselineHandoff),
        text: {
          format: handoffIntelligenceResponseFormat
        }
      }),
      rejectAfter(OPENAI_TIMEOUT_MS, "OpenAI handoff intelligence request timed out.")
    ])) as {
      output_text?: string | null;
    };
    const parsed = safeParseJson(response.output_text);
    const aiHandoff = parseHandoffIntelligenceOutput(parsed);

    if (!aiHandoff) {
      return fallback("OpenAI handoff intelligence response did not match the required schema.");
    }

    return buildEnvelope({
      source: "openai",
      promptVersion: caseAiPromptVersions.handoffIntelligence,
      model,
      inputSnapshot,
      output: mergeHandoffIntelligenceOutputs(baselineHandoff, aiHandoff),
      fallbackReason: null
    });
  } catch (error) {
    return fallback(error instanceof Error ? error.message : "OpenAI handoff intelligence request failed.");
  }
}

export async function answerCaseQuestionWithAi(input: CaseQuestionAiInput): Promise<CaseAiEnvelope<CaseQuestionAnswer>> {
  const inputSnapshot = buildCaseQuestionSnapshot(input);
  const baselineAnswer = buildDeterministicCaseQuestionAnswer(input);
  const fallback = (reason: string) =>
    buildEnvelope({
      source: "deterministic-fallback",
      promptVersion: caseAiPromptVersions.caseQuestionAnswer,
      inputSnapshot,
      output: baselineAnswer,
      fallbackReason: reason
    });
  const client = getOpenAIClient();

  if (!client) {
    return fallback("OpenAI API key not configured.");
  }

  const model = getOpenAIModel();

  try {
    const response = (await Promise.race([
      client.responses.create({
        model,
        store: false,
        input: buildCaseQuestionPrompt(input, baselineAnswer),
        text: {
          format: caseQuestionAnswerResponseFormat
        }
      }),
      rejectAfter(OPENAI_TIMEOUT_MS, "OpenAI case question request timed out.")
    ])) as {
      output_text?: string | null;
    };
    const parsed = safeParseJson(response.output_text);
    const aiAnswer = parseCaseQuestionAnswerOutput(parsed);

    if (!aiAnswer) {
      return fallback("OpenAI case question response did not match the required schema.");
    }

    return buildEnvelope({
      source: "openai",
      promptVersion: caseAiPromptVersions.caseQuestionAnswer,
      model,
      inputSnapshot,
      output: mergeCaseQuestionAnswers(baselineAnswer, aiAnswer),
      fallbackReason: null
    });
  } catch (error) {
    return fallback(error instanceof Error ? error.message : "OpenAI case question request failed.");
  }
}

export function parseStoredIntakeNormalization(metadata: Json | null | undefined) {
  const output = readStoredAiOutput(metadata, "intakeNormalization");
  return parseIntakeNormalizationOutput(output, null);
}

export function parseStoredMaterialInterpretation(metadata: Json | null | undefined) {
  const output = readStoredAiOutput(metadata, "materialInterpretation");
  return parseMaterialInterpretationOutput(output, null);
}

export function parseStoredReviewDelta(metadata: Json | null | undefined) {
  const output = readStoredAiOutput(metadata, "reviewDelta");
  return parseReviewDeltaOutput(output);
}

export function parseStoredHandoffIntelligence(metadata: Json | null | undefined) {
  const output = readStoredAiOutput(metadata, "handoffIntelligence");
  return parseHandoffIntelligenceOutput(output);
}

function buildEnvelope<T>({
  source,
  promptVersion,
  model = null,
  inputSnapshot,
  output,
  fallbackReason
}: {
  source: CaseAiSource;
  promptVersion: string;
  model?: string | null;
  inputSnapshot: Json;
  output: T;
  fallbackReason: string | null;
}): CaseAiEnvelope<T> {
  return {
    source,
    promptVersion,
    model,
    generatedAt: new Date().toISOString(),
    inputSnapshot,
    output,
    fallbackReason
  };
}

function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY?.trim()) {
    return null;
  }

  if (cachedClient === undefined) {
    cachedClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  return cachedClient;
}

function getOpenAIModel() {
  return process.env.OPENAI_MODEL?.trim() || DEFAULT_OPENAI_MODEL;
}

function buildIntakeNormalizationPrompt(useCaseSlug: SupportedUseCaseSlug, intake: CaseIntakeValues) {
  const useCase = getUseCaseDefinition(useCaseSlug);
  const allowedFieldValues = getAllowedIntakeValues(useCaseSlug);

  return [
    "You normalize case intake notes for Tideus, a narrow Canada temporary resident case-prep workflow workspace.",
    "Return only structured fields that can improve the case workflow. Do not provide legal advice.",
    "Use only the user's intake values and freeform notes. If a field cannot be inferred, return an empty string for that field.",
    "Only use allowed enum values for inferred fields.",
    "",
    `Use case: ${useCase?.shortTitle ?? useCaseSlug}`,
    "Allowed inferred field values:",
    JSON.stringify(allowedFieldValues),
    "",
    "Current intake:",
    JSON.stringify(buildIntakeNormalizationSnapshot(useCaseSlug, intake))
  ].join("\n");
}

function buildMaterialInterpretationPrompt(useCaseSlug: SupportedUseCaseSlug, documents: CaseMaterialSnapshot[]) {
  const useCase = getUseCaseDefinition(useCaseSlug);

  return [
    "You interpret lightweight material metadata for Tideus case workflow quality.",
    "Do not perform OCR or claim to read uploaded file contents. Use only labels, file names, material references, statuses, and user notes.",
    "Return workflow-oriented classification signals only: likely document type, possible issues, likely supporting documents, recommended status, confidence, next action, and a short reasoning summary.",
    "Do not change the user's case. Do not provide legal advice.",
    "",
    `Use case: ${useCase?.shortTitle ?? useCaseSlug}`,
    "Material metadata:",
    JSON.stringify(buildMaterialInterpretationSnapshot(useCaseSlug, documents))
  ].join("\n");
}

function buildMaterialWorkspaceActionPrompt(
  input: CaseMaterialWorkspaceActionInput,
  baselineAction: CaseMaterialWorkspaceActionOutput
) {
  const useCase = getUseCaseDefinition(input.useCaseSlug);

  return [
    "You support a Tideus case workspace material action.",
    "This is not chat, OCR, a public portal, or legal advice. Return only the structured schema.",
    "Use only the selected material metadata, current checklist state, latest review signals, and internal knowledge context.",
    "Keep the output concise and task-oriented so the user can decide whether to update materials or regenerate review.",
    "Do not claim to inspect file contents. File names and user notes are metadata only.",
    "",
    `Use case: ${useCase?.shortTitle ?? input.useCaseSlug}`,
    `Requested action: ${input.actionType}`,
    "Input snapshot:",
    JSON.stringify(buildMaterialWorkspaceActionSnapshot(input)),
    "",
    "Deterministic baseline action:",
    JSON.stringify(baselineAction)
  ].join("\n");
}

function buildReviewEnrichmentPrompt(input: CaseReviewAiInput) {
  const useCase = getUseCaseDefinition(input.useCaseSlug);

  return [
    "You improve a structured Tideus case review from deterministic workflow output.",
    "You must keep the output structured. Do not write an essay or chat response.",
    "The deterministic review is the baseline. You may tighten language, add workflow-specific gaps, and add risk/next-step detail.",
    "The optional knowledgeContext is internal workflow intelligence. Use it only to sharpen scenario warnings, processing-time reminders, materials guidance, and official-reference labels.",
    "Do not turn knowledgeContext into a public search answer, broad policy essay, or generic immigration advice.",
    "Do not make the readiness status more optimistic than the deterministic baseline. Preserve checklist keys and statuses.",
    "Do not provide legal advice and do not introduce unsupported use cases.",
    "",
    `Use case: ${useCase?.shortTitle ?? input.useCaseSlug}`,
    "Input snapshot:",
    JSON.stringify(buildReviewEnrichmentSnapshot(input))
  ].join("\n");
}

function buildReviewDeltaPrompt(input: CaseReviewDeltaInput, baselineDelta: CaseReviewDelta) {
  const useCase = getUseCaseDefinition(input.useCaseSlug);

  return [
    "You summarize the delta between two saved Tideus case review versions.",
    "Return only structured, workflow-oriented differences. Do not write a chat response.",
    "Use the deterministic delta as the baseline and tighten wording where helpful.",
    "Do not invent facts that are not visible in the two review versions.",
    "",
    `Use case: ${useCase?.shortTitle ?? input.useCaseSlug}`,
    "Input snapshot:",
    JSON.stringify({
      previousReview: summarizeReviewForPrompt(input.previousReview),
      latestReview: summarizeReviewForPrompt(input.latestReview),
      baselineDelta
    })
  ].join("\n");
}

function buildCaseQuestionPrompt(input: CaseQuestionAiInput, baselineAnswer: CaseQuestionAnswer) {
  const useCase = getUseCaseDefinition(input.useCaseSlug);

  return [
    "You answer a Tideus case-prep question inside a narrow workflow engine.",
    "This is not generic chat, broad immigration planning, public data search, or legal advice.",
    "Return only the structured fields requested by the schema.",
    "Ground the answer in the supported scenario, current case state when present, deterministic review signals, and internal knowledgeContext.",
    "Keep the answer task-oriented so it can become workspace tracker actions.",
    "If the question asks for legal advice or unsupported scope, keep the answer bounded and route the user to case organization or professional review.",
    "Do not introduce unsupported use cases.",
    "",
    `Use case: ${useCase?.shortTitle ?? input.useCaseSlug}`,
    "Question:",
    input.question,
    "",
    "Input snapshot:",
    JSON.stringify(buildCaseQuestionSnapshot(input)),
    "",
    "Deterministic baseline answer:",
    JSON.stringify(baselineAnswer)
  ].join("\n");
}

function buildHandoffIntelligencePrompt(
  input: CaseHandoffIntelligenceInput,
  baselineHandoff: CaseHandoffIntelligence
) {
  const useCase = getUseCaseDefinition(input.useCaseSlug);

  return [
    "You strengthen a Tideus export packet for self-review or external professional review.",
    "Return only structured handoff fields. Do not write a chat response, policy essay, or legal advice.",
    "Use the deterministic baseline as the floor. You may tighten language, but do not hide risks, missing items, or escalation triggers.",
    "Keep the output practical for a reviewer who needs to scan the case quickly.",
    "",
    `Use case: ${useCase?.shortTitle ?? input.useCaseSlug}`,
    "Input snapshot:",
    JSON.stringify(buildHandoffIntelligenceSnapshot(input)),
    "",
    "Deterministic baseline handoff:",
    JSON.stringify(baselineHandoff)
  ].join("\n");
}

function buildDeterministicIntakeNormalization(
  useCaseSlug: SupportedUseCaseSlug,
  intake: CaseIntakeValues
): CaseIntakeNormalizationOutput {
  const notes = intake.notes.toLowerCase();
  const inferredFields: CaseIntakeNormalizationOutput["inferredFields"] = {};

  if (!intake.refusalOrComplianceIssues && notesContain(notes, ["refusal", "refused", "overstay", "compliance"])) {
    inferredFields.refusalOrComplianceIssues = "yes";
  }

  if (!intake.proofOfFundsStatus && notesContain(notes, ["bank", "fund", "money", "tuition", "support"])) {
    inferredFields.proofOfFundsStatus = "partial";
  }

  if (!intake.supportEvidenceStatus && notesContain(notes, ["host", "invitation", "accommodation", "school", "enrolment", "letter"])) {
    inferredFields.supportEvidenceStatus = "partial";
  }

  if (useCaseSlug === "visitor-record" && !intake.scenarioProgressStatus && notesContain(notes, ["temporary", "leave", "return", "visit"])) {
    inferredFields.scenarioProgressStatus = "partial";
  }

  if (
    useCaseSlug === "study-permit-extension" &&
    !intake.scenarioProgressStatus &&
    notesContain(notes, ["tuition", "grades", "standing", "transcript", "registration"])
  ) {
    inferredFields.scenarioProgressStatus = "needs-explanation";
  }

  return {
    inferredFields,
    explanationSignals: {
      timelinePressure: intake.urgency === "under-30" || notesContain(notes, ["urgent", "soon", "expire", "deadline"]),
      fundingConcern:
        intake.proofOfFundsStatus === "missing" ||
        intake.proofOfFundsStatus === "partial" ||
        notesContain(notes, ["fund", "money", "budget", "tuition", "bank"]),
      supportDependency: Boolean(intake.supportEntityName.trim()) || notesContain(notes, ["host", "family", "school", "employer", "support"]),
      priorIssueMentioned: intake.refusalOrComplianceIssues === "yes" || notesContain(notes, ["refusal", "refused", "overstay", "compliance"]),
      schoolProgressConcern:
        useCaseSlug === "study-permit-extension" &&
        (intake.scenarioProgressStatus === "at-risk" ||
          notesContain(notes, ["grades", "failed", "probation", "tuition", "registration", "standing"])),
      temporaryIntentConcern:
        useCaseSlug === "visitor-record" &&
        (intake.scenarioProgressStatus === "weak" || notesContain(notes, ["temporary intent", "return", "leave canada", "ties"]))
    },
    extractedFacts: buildDeterministicExtractedFacts(intake),
    reviewNotes: buildDeterministicReviewNotes(useCaseSlug, intake)
  };
}

function buildDeterministicMaterialInterpretation(documents: CaseMaterialSnapshot[]): CaseMaterialInterpretationOutput {
  const items = documents.map((item) => {
    const noteText = `${item.materialReference ?? ""} ${item.notes ?? ""} ${item.fileName ?? ""}`.toLowerCase();
    const possibleIssues = dedupeStrings(
      [
        item.status === "missing" && item.required ? "required-material-missing" : "",
        item.status === "needs-refresh" ? "refresh-needed" : "",
        item.status === "collecting" ? "still-being-collected" : "",
        notesContain(noteText, ["expired", "old", "outdated"]) ? "possibly-stale" : "",
        notesContain(noteText, ["unclear", "incomplete", "missing"]) ? "note-indicates-gap" : ""
      ].filter(Boolean)
    );
    const likelySupportingDocsNeeded = buildLikelySupportingDocuments(item, possibleIssues);
    const recommendedMaterialStatus = chooseRecommendedMaterialStatus(item, possibleIssues);
    const suggestedNextAction = buildMaterialSuggestedNextAction(item, possibleIssues, likelySupportingDocsNeeded);

    return {
      documentId: item.id,
      documentKey: item.documentKey,
      label: item.label,
      likelyDocumentType: item.label,
      suggestedStatus: recommendedMaterialStatus,
      issueFlags: possibleIssues,
      possibleIssues,
      likelySupportingDocsNeeded,
      recommendedMaterialStatus,
      confidence: possibleIssues.length > 0 ? 0.68 : 0.55,
      interpretationNote:
        possibleIssues.length > 0
          ? `${item.label} has workflow signals that should stay visible in the next review pass.`
          : `${item.label} is classified from the expected checklist label and current material metadata.`,
      suggestedNextAction,
      reasoningSummary:
        possibleIssues.length > 0
          ? "The current status, file metadata, or note suggests this material still needs case-work attention."
          : "No obvious metadata issue is visible; keep this item tied to the next structured review."
    };
  });

  return {
    summary:
      items.some((item) => item.possibleIssues.length > 0)
        ? "Material metadata includes issue signals that should inform the next structured review."
        : "Material metadata was classified against the expected checklist without additional issue signals.",
    items
  };
}

function buildDeterministicMaterialWorkspaceAction(input: CaseMaterialWorkspaceActionInput): CaseMaterialWorkspaceActionOutput {
  const interpretedItem = input.materialInterpretation?.items.find((item) => item.documentId === input.document.id) ?? null;
  const possibleIssues =
    interpretedItem?.possibleIssues.length
      ? interpretedItem.possibleIssues
      : buildMaterialPossibleIssues(input.document);
  const likelySupportingDocsNeeded =
    interpretedItem?.likelySupportingDocsNeeded.length
      ? interpretedItem.likelySupportingDocsNeeded
      : buildLikelySupportingDocuments(input.document, possibleIssues);
  const recommendedMaterialStatus =
    interpretedItem?.recommendedMaterialStatus ?? chooseRecommendedMaterialStatus(input.document, possibleIssues);
  const latestMissingMatch = input.latestReview?.missingItems.some((item) =>
    item.toLowerCase().includes(input.document.label.toLowerCase())
  ) ?? false;
  const latestRiskMatch = input.latestReview?.riskFlags.some((item) =>
    `${item.label} ${item.detail}`.toLowerCase().includes(input.document.label.toLowerCase())
  ) ?? false;
  const regenerateReviewRecommendation = chooseRegenerateReviewRecommendation({
    document: input.document,
    recommendedMaterialStatus,
    possibleIssues,
    latestMissingMatch,
    latestRiskMatch
  });

  return {
    documentId: input.document.id,
    documentKey: input.document.documentKey,
    label: input.document.label,
    likelyDocumentType: interpretedItem?.likelyDocumentType ?? input.document.label,
    confidence: interpretedItem?.confidence ?? (possibleIssues.length > 0 ? 0.68 : 0.55),
    possibleIssues,
    likelySupportingDocsNeeded,
    recommendedMaterialStatus,
    suggestedNextAction:
      interpretedItem?.suggestedNextAction ||
      buildWorkspaceSuggestedNextAction(input.actionType, input.document, possibleIssues, likelySupportingDocsNeeded, regenerateReviewRecommendation),
    reasoningSummary:
      interpretedItem?.reasoningSummary ||
      buildWorkspaceReasoningSummary(input.actionType, input.document, latestMissingMatch, latestRiskMatch, possibleIssues),
    regenerateReviewRecommendation,
    readinessImpact: chooseReadinessImpact({
      document: input.document,
      possibleIssues,
      latestMissingMatch,
      latestRiskMatch,
      regenerateReviewRecommendation
    })
  };
}

function buildMaterialPossibleIssues(item: CaseMaterialSnapshot) {
  const noteText = `${item.materialReference ?? ""} ${item.notes ?? ""} ${item.fileName ?? ""}`.toLowerCase();

  return dedupeStrings(
    [
      item.status === "missing" && item.required ? "required-material-missing" : "",
      item.status === "needs-refresh" ? "refresh-needed-before-handoff" : "",
      item.status === "collecting" ? "collection-not-finished" : "",
      item.status === "ready" && !item.fileName && !item.materialReference ? "ready-status-without-reference" : "",
      notesContain(noteText, ["expired", "old", "outdated"]) ? "possible-stale-document" : "",
      notesContain(noteText, ["unclear", "incomplete", "missing"]) ? "note-suggests-completeness-gap" : ""
    ].filter(Boolean)
  ).slice(0, 5);
}

function buildLikelySupportingDocuments(item: CaseMaterialSnapshot, possibleIssues: string[]) {
  const lowerLabel = item.label.toLowerCase();
  const support: string[] = [];

  if (lowerLabel.includes("fund")) {
    support.push("Recent bank statements or financial support evidence");
  }

  if (lowerLabel.includes("passport")) {
    support.push("Current passport bio page and any renewed passport details");
  }

  if (lowerLabel.includes("explanation") || lowerLabel.includes("intent") || lowerLabel.includes("reason")) {
    support.push("Short explanation note aligned to the current scenario");
  }

  if (lowerLabel.includes("enrolment") || lowerLabel.includes("school") || lowerLabel.includes("study")) {
    support.push("Current enrolment confirmation or school letter");
  }

  if (lowerLabel.includes("transcript") || lowerLabel.includes("progress")) {
    support.push("Recent transcript, progress letter, or registration proof");
  }

  if (lowerLabel.includes("host") || lowerLabel.includes("accommodation")) {
    support.push("Host letter, accommodation confirmation, or supporting relationship context");
  }

  if (possibleIssues.some((item) => item.includes("stale") || item.includes("refresh"))) {
    support.push("Updated version of the same material");
  }

  return dedupeStrings(support).slice(0, 5);
}

function chooseRecommendedMaterialStatus(item: CaseMaterialSnapshot, possibleIssues: string[]): CaseDocumentStatus {
  if (item.status === "not-applicable") {
    return "not-applicable";
  }

  if (possibleIssues.some((issue) => issue.includes("stale") || issue.includes("refresh") || issue.includes("completeness"))) {
    return "needs-refresh";
  }

  if (item.fileName || item.materialReference) {
    return item.status === "missing" ? "collecting" : item.status;
  }

  return item.required ? "missing" : item.status;
}

function buildMaterialSuggestedNextAction(
  item: CaseMaterialSnapshot,
  possibleIssues: string[],
  likelySupportingDocsNeeded: string[]
) {
  if (item.status === "missing") {
    return `Collect or attach ${item.label}, then update the material status before regenerating the review.`;
  }

  if (possibleIssues.some((issue) => issue.includes("stale") || issue.includes("refresh"))) {
    return `Refresh ${item.label} or add a note explaining why the current version is still usable.`;
  }

  if (likelySupportingDocsNeeded.length > 0 && item.status !== "ready") {
    return `Add supporting context for ${item.label}: ${likelySupportingDocsNeeded[0]}.`;
  }

  return `Keep ${item.label} visible in the package and regenerate review after material changes are saved.`;
}

function buildWorkspaceSuggestedNextAction(
  actionType: CaseMaterialWorkspaceActionType,
  item: CaseMaterialSnapshot,
  possibleIssues: string[],
  likelySupportingDocsNeeded: string[],
  regenerateReviewRecommendation: CaseMaterialWorkspaceActionOutput["regenerateReviewRecommendation"]
) {
  if (actionType === "suggest-supporting-docs" && likelySupportingDocsNeeded.length > 0) {
    return `Add or verify: ${likelySupportingDocsNeeded.join("; ")}.`;
  }

  if (actionType === "suggest-regenerate-review" || regenerateReviewRecommendation === "recommended-now") {
    return "Regenerate the review after saving this material state so readiness, missing items, and risk flags reflect the current package.";
  }

  if (actionType === "explain-missing" || item.status === "missing") {
    return `Treat ${item.label} as the next collection task unless it is not applicable to this case.`;
  }

  if (possibleIssues.length > 0) {
    return `Resolve the visible issue first: ${possibleIssues[0]}.`;
  }

  return `Confirm ${item.label} is correctly marked, then continue with the next incomplete required material.`;
}

function buildWorkspaceReasoningSummary(
  actionType: CaseMaterialWorkspaceActionType,
  item: CaseMaterialSnapshot,
  latestMissingMatch: boolean,
  latestRiskMatch: boolean,
  possibleIssues: string[]
) {
  if (latestMissingMatch) {
    return "The latest saved review still treats this material area as missing, so the next useful action is to close or explain that gap.";
  }

  if (latestRiskMatch) {
    return "The latest saved review still has a risk signal connected to this material area, so the item should remain visible before handoff.";
  }

  if (possibleIssues.length > 0) {
    return "The material metadata has workflow issue signals that should be addressed before relying on the item in a clean review.";
  }

  if (actionType === "suggest-regenerate-review") {
    return "Review regeneration is most useful after saved material statuses, notes, or attached files change.";
  }

  return "The recommendation is based on the selected checklist item, saved material metadata, and current review context.";
}

function chooseRegenerateReviewRecommendation({
  document,
  recommendedMaterialStatus,
  possibleIssues,
  latestMissingMatch,
  latestRiskMatch
}: {
  document: CaseMaterialSnapshot;
  recommendedMaterialStatus: CaseDocumentStatus;
  possibleIssues: string[];
  latestMissingMatch: boolean;
  latestRiskMatch: boolean;
}): CaseMaterialWorkspaceActionOutput["regenerateReviewRecommendation"] {
  if (
    document.status !== recommendedMaterialStatus ||
    latestMissingMatch ||
    latestRiskMatch ||
    (document.required && document.status === "ready" && possibleIssues.length === 0)
  ) {
    return "recommended-now";
  }

  if (possibleIssues.length > 0 || document.status === "collecting" || document.status === "needs-refresh") {
    return "consider-after-material-update";
  }

  return "not-needed";
}

function chooseReadinessImpact({
  document,
  possibleIssues,
  latestMissingMatch,
  latestRiskMatch,
  regenerateReviewRecommendation
}: {
  document: CaseMaterialSnapshot;
  possibleIssues: string[];
  latestMissingMatch: boolean;
  latestRiskMatch: boolean;
  regenerateReviewRecommendation: CaseMaterialWorkspaceActionOutput["regenerateReviewRecommendation"];
}): CaseMaterialWorkspaceActionOutput["readinessImpact"] {
  if (latestRiskMatch) {
    return "may-reduce-risk";
  }

  if (latestMissingMatch || (document.required && document.status === "ready")) {
    return "may-reduce-missing-items";
  }

  if (possibleIssues.length > 0) {
    return "needs-review-before-impact";
  }

  if (regenerateReviewRecommendation !== "not-needed") {
    return "may-improve-handoff-quality";
  }

  return "no-visible-impact";
}

function buildDeterministicReviewDelta(previousReview: CaseReviewResult, latestReview: CaseReviewResult): CaseReviewDelta {
  const previousMissing = new Set(previousReview.missingItems);
  const latestMissing = new Set(latestReview.missingItems);
  const previousRisks = new Set(previousReview.riskFlags.map((item) => item.label));
  const latestRisks = new Set(latestReview.riskFlags.map((item) => item.label));
  const removedMissing = previousReview.missingItems.filter((item) => !latestMissing.has(item));
  const removedRisks = previousReview.riskFlags.filter((item) => !latestRisks.has(item.label)).map((item) => item.label);
  const newRisks = latestReview.riskFlags.filter((item) => !previousRisks.has(item.label)).map((item) => item.label);
  const previousReady = previousReview.checklist.filter((item) => item.status === "ready" || item.status === "not-applicable").length;
  const latestReady = latestReview.checklist.filter((item) => item.status === "ready" || item.status === "not-applicable").length;
  const improvedAreas = dedupeStrings(
    [
      readinessRank[latestReview.readinessStatus] > readinessRank[previousReview.readinessStatus]
        ? `Readiness moved from ${previousReview.readinessStatus} to ${latestReview.readinessStatus}.`
        : "",
      latestReady > previousReady ? `${latestReady - previousReady} additional checklist item${latestReady - previousReady === 1 ? "" : "s"} moved to ready or not applicable.` : "",
      ...removedMissing.map((item) => `${item} is no longer listed as missing.`),
      ...removedRisks.map((item) => `${item} is no longer visible as a risk flag.`)
    ].filter(Boolean)
  ).slice(0, 5);
  const remainingGaps = dedupeStrings([
    ...latestReview.missingItems.map((item) => `Missing item: ${item}`),
    ...latestReview.riskFlags.map((item) => `${item.severity} risk: ${item.label}`)
  ]).slice(0, 5);

  return {
    improvedAreas: improvedAreas.length > 0 ? improvedAreas : ["No material improvement is visible between the two saved review versions."],
    remainingGaps: remainingGaps.length > 0 ? remainingGaps : ["No major remaining gaps are visible in the latest saved review."],
    newRisks: newRisks.length > 0 ? newRisks : ["No new risk flags were introduced in the latest saved review."],
    removedRisks: removedRisks.length > 0 ? removedRisks.map((item) => `${item} is no longer visible as a risk flag.`) : ["No prior risk flags were removed in this review version."],
    priorityActions: latestReview.nextSteps.slice(0, 5)
  };
}

function buildDeterministicHandoffIntelligence(input: CaseHandoffIntelligenceInput): CaseHandoffIntelligence {
  const { latestReview } = input;
  const highRiskFlags = latestReview.riskFlags.filter((item) => item.severity === "high");
  const humanReviewIssues = dedupeStrings([
    ...latestReview.missingItems.map((item) => `Missing item needing review: ${item}`),
    ...latestReview.riskFlags
      .filter((item) => item.severity === "high" || item.severity === "medium")
      .map((item) => `${item.severity} risk: ${item.label}. ${item.detail}`)
  ]).slice(0, 8);
  const escalationTriggers = dedupeStrings([
    latestReview.readinessStatus === "not-ready" ? "Readiness is not-ready." : "",
    highRiskFlags.length > 0 ? `${highRiskFlags.length} high-risk flag${highRiskFlags.length === 1 ? "" : "s"} remain visible.` : "",
    latestReview.missingItems.length > 0 ? `${latestReview.missingItems.length} missing item${latestReview.missingItems.length === 1 ? "" : "s"} remain unresolved.` : "",
    ...latestReview.riskFlags
      .filter((item) => item.severity === "high")
      .map((item) => item.label)
  ]).slice(0, 6);

  return {
    externalSummary:
      `${input.caseTitle} is a ${getUseCaseDefinition(input.useCaseSlug)?.shortTitle ?? input.useCaseSlug} workspace export from review version ${input.reviewVersion}. ${latestReview.summary}`,
    reviewReadyStatus: latestReview.readinessStatus,
    issuesNeedingHumanReview: humanReviewIssues.length > 0
      ? humanReviewIssues
      : ["No major missing items or medium/high risk flags are visible in this saved review version."],
    supportingNotes: dedupeStrings([
      latestReview.readinessSummary,
      latestReview.timelineNote,
      ...latestReview.supportingContextNotes,
      ...latestReview.officialReferenceLabels.map((item) => `Reference label: ${item}`)
    ]).slice(0, 8),
    escalationTriggers: escalationTriggers.length > 0
      ? escalationTriggers
      : ["No automatic escalation trigger is visible in this saved review version."]
  };
}

function buildDeterministicCaseQuestionAnswer(input: CaseQuestionAiInput): CaseQuestionAnswer {
  const useCase = getUseCaseDefinition(input.useCaseSlug);
  const latestReview = input.caseContext?.latestReview ?? null;
  const previousReview = input.caseContext?.previousReview ?? null;
  const reviewDelta = input.caseContext?.reviewDelta ?? null;
  const question = input.question.toLowerCase();
  const missingItems = latestReview?.missingItems ?? [];
  const riskFlags = latestReview?.riskFlags ?? [];
  const priorityNextSteps = latestReview?.nextSteps ?? buildDefaultScenarioNextSteps(input.useCaseSlug);
  const askedAboutMissing = notesContain(question, ["missing", "need", "still", "gap", "document"]);
  const askedAboutRisk = notesContain(question, ["risk", "problem", "concern", "weak", "refusal"]);
  const askedAboutChange = notesContain(question, ["changed", "change", "delta", "since", "previous", "last review"]);
  const askedAboutNext = notesContain(question, ["next", "do now", "action", "priority"]);
  const summary = buildDeterministicQuestionSummary({
    useCaseTitle: useCase?.shortTitle ?? input.useCaseSlug,
    hasCaseContext: Boolean(input.caseContext?.caseId || input.caseContext?.caseTitle),
    askedAboutMissing,
    askedAboutRisk,
    askedAboutChange,
    missingItems,
    riskFlags,
    reviewDelta
  });
  const supportingContextNotes = dedupeStrings([
    ...(input.knowledgeContext?.supportingContextNotes ?? []),
    input.knowledgeContext?.processingTimeNote?.note ?? "",
    latestReview?.timelineNote ?? ""
  ]).slice(0, 6);
  const scenarioSpecificWarnings = dedupeStrings([
    ...(input.knowledgeContext?.scenarioSpecificWarnings ?? []),
    ...riskFlags.slice(0, 3).map((item) => `${item.severity} risk: ${item.label}. ${item.detail}`)
  ]).slice(0, 6);
  const nextSteps = dedupeStrings([
    ...(askedAboutChange && reviewDelta ? reviewDelta.priorityActions : []),
    ...(askedAboutMissing ? missingItems.map((item) => `Confirm or collect ${item}.`) : []),
    ...(askedAboutRisk ? riskFlags.slice(0, 3).map((item) => `Address the ${item.label.toLowerCase()} risk before treating the package as handoff-ready.`) : []),
    ...(askedAboutNext ? priorityNextSteps : []),
    ...priorityNextSteps,
    "Save this question to the workspace if it should become part of the case tracker."
  ]).slice(0, 6);

  return {
    summary,
    whyThisMatters: latestReview
      ? "This matters because the saved case review is driven by readiness, materials state, risks, and next steps. Keeping the answer structured lets the workspace turn it into package work instead of a one-off chat note."
      : "This matters because a question only becomes useful in Tideus when it turns into intake facts, expected materials, checklist work, or a saved case review path.",
    supportingContextNotes,
    scenarioSpecificWarnings,
    nextSteps,
    trackerActions: buildDeterministicTrackerActions(input, missingItems, riskFlags, nextSteps)
  };
}

function buildDeterministicQuestionSummary({
  useCaseTitle,
  hasCaseContext,
  askedAboutMissing,
  askedAboutRisk,
  askedAboutChange,
  missingItems,
  riskFlags,
  reviewDelta
}: {
  useCaseTitle: string;
  hasCaseContext: boolean;
  askedAboutMissing: boolean;
  askedAboutRisk: boolean;
  askedAboutChange: boolean;
  missingItems: string[];
  riskFlags: CaseRiskFlag[];
  reviewDelta: CaseReviewDelta | null;
}) {
  if (askedAboutChange && reviewDelta) {
    return `The latest ${useCaseTitle} review should be read against the previous version through improved areas, remaining gaps, new risks, and priority actions.`;
  }

  if (askedAboutMissing) {
    return missingItems.length > 0
      ? `The current ${useCaseTitle} workspace still shows ${missingItems.length} missing item${missingItems.length === 1 ? "" : "s"} that should drive the next work block.`
      : `The current ${useCaseTitle} workspace does not show required items marked missing, so the next pass should focus on freshness, risk, and explanation quality.`;
  }

  if (askedAboutRisk) {
    return riskFlags.length > 0
      ? `The current ${useCaseTitle} workspace shows ${riskFlags.length} risk flag${riskFlags.length === 1 ? "" : "s"} that should stay visible before handoff.`
      : `The current ${useCaseTitle} workspace does not show major risk flags, but the case still needs a structured final review before filing decisions.`;
  }

  return hasCaseContext
    ? `This ${useCaseTitle} answer is grounded in the current case workspace and should be handled as structured case work, not a separate chat thread.`
    : `This ${useCaseTitle} answer should be converted into a saved workspace if the question affects materials, checklist work, timeline, or handoff quality.`;
}

function buildDefaultScenarioNextSteps(useCaseSlug: SupportedUseCaseSlug) {
  if (useCaseSlug === "visitor-record") {
    return [
      "Capture the current status expiry date and passport validity before relying on the answer.",
      "Check the extension explanation, funding proof, and temporary-intent support together.",
      "Create a workspace checklist if the question affects evidence or handoff readiness."
    ];
  }

  return [
    "Capture the current study permit expiry date and school context before relying on the answer.",
    "Check enrolment proof, progress evidence, funding proof, and the extension explanation together.",
    "Create a workspace checklist if the question affects evidence or handoff readiness."
  ];
}

function buildDeterministicTrackerActions(
  input: CaseQuestionAiInput,
  missingItems: string[],
  riskFlags: CaseRiskFlag[],
  nextSteps: string[]
): CaseQuestionTrackerAction[] {
  const missingActions = missingItems.slice(0, 3).map((item) => ({
    label: `Collect ${item}`,
    detail: `Add or mark the ${item} material in the workspace so the next review can use it.`,
    priority: "high" as const,
    actionType: "collect-material" as const,
    documentKey: findDocumentKeyByLabel(input.caseContext?.documents ?? [], item)
  }));
  const riskActions = riskFlags.slice(0, 2).map((item) => ({
    label: `Review ${item.label}`,
    detail: item.detail,
    priority: item.severity,
    actionType: "review-risk" as const,
    documentKey: ""
  }));
  const defaultActions: CaseQuestionTrackerAction[] = [
    {
      label: "Generate or refresh checklist",
      detail: "Turn this question into a case workspace checklist so materials and next steps stay attached to the case.",
      priority: "medium",
      actionType: "generate-checklist",
      documentKey: ""
    },
    {
      label: "Continue in workspace",
      detail: nextSteps[0] ?? "Open the case workspace and make the next evidence step visible.",
      priority: "medium",
      actionType: "continue-workspace",
      documentKey: ""
    }
  ];

  return [...missingActions, ...riskActions, ...defaultActions].slice(0, 6);
}

function findDocumentKeyByLabel(documents: CaseMaterialSnapshot[], label: string) {
  const normalizedLabel = label.toLowerCase();
  return documents.find((item) => item.label.toLowerCase() === normalizedLabel)?.documentKey ?? "";
}

function parseIntakeNormalizationOutput(value: unknown, useCaseSlug: SupportedUseCaseSlug | null): CaseIntakeNormalizationOutput | null {
  if (!isRecord(value) || !isRecord(value.inferredFields) || !isRecord(value.explanationSignals)) {
    return null;
  }

  const fields = useCaseSlug ? getCaseIntakeFields(getUseCaseDefinition(useCaseSlug)!) : null;
  const inferredFields: CaseIntakeNormalizationOutput["inferredFields"] = {};

  for (const [key, rawValue] of Object.entries(value.inferredFields)) {
    if (!isIntakeInferenceField(key) || typeof rawValue !== "string" || !rawValue.trim()) {
      continue;
    }

    const normalizedValue = rawValue.trim();
    const field = fields?.find((item) => item.name === key);

    if (field?.type === "select" && field.options && !field.options.some((option) => option.value === normalizedValue)) {
      continue;
    }

    if (field?.type === "date" && !/^\d{4}-\d{2}-\d{2}$/.test(normalizedValue)) {
      continue;
    }

    inferredFields[key] = normalizedValue;
  }

  const explanationSignals = {
    timelinePressure: value.explanationSignals.timelinePressure === true,
    fundingConcern: value.explanationSignals.fundingConcern === true,
    supportDependency: value.explanationSignals.supportDependency === true,
    priorIssueMentioned: value.explanationSignals.priorIssueMentioned === true,
    schoolProgressConcern: value.explanationSignals.schoolProgressConcern === true,
    temporaryIntentConcern: value.explanationSignals.temporaryIntentConcern === true
  };
  const extractedFacts = readRecordArray(value.extractedFacts)
    .flatMap((item) => {
      const label = readTrimmedString(item.label);
      const factValue = readTrimmedString(item.value);

      if (!label || !factValue) {
        return [];
      }

      return [
        {
          label,
          value: factValue,
          confidence: clampConfidence(typeof item.confidence === "number" ? item.confidence : 0.5)
        }
      ];
    })
    .slice(0, 6);
  const reviewNotes = readStringArray(value.reviewNotes).slice(0, 5);

  return {
    inferredFields,
    explanationSignals,
    extractedFacts,
    reviewNotes
  };
}

function parseMaterialInterpretationOutput(
  value: unknown,
  documents: CaseMaterialSnapshot[] | null
): CaseMaterialInterpretationOutput | null {
  if (!isRecord(value)) {
    return null;
  }

  const summary = readTrimmedString(value.summary);
  const documentMap = documents ? new Map(documents.map((item) => [item.id, item])) : null;
  const items = readRecordArray(value.items)
    .flatMap((item) => {
      const documentId = readTrimmedString(item.documentId);
      const matchedDocument = documentId && documentMap ? documentMap.get(documentId) : null;
      const documentKey = matchedDocument?.documentKey ?? readTrimmedString(item.documentKey);
      const label = matchedDocument?.label ?? readTrimmedString(item.label);
      const likelyDocumentType = readTrimmedString(item.likelyDocumentType);
      const suggestedStatus = typeof item.suggestedStatus === "string" && isDocumentStatus(item.suggestedStatus) ? item.suggestedStatus : null;
      const recommendedMaterialStatus =
        typeof item.recommendedMaterialStatus === "string" && isDocumentStatus(item.recommendedMaterialStatus)
          ? item.recommendedMaterialStatus
          : suggestedStatus;
      const interpretationNote = readTrimmedString(item.interpretationNote);
      const possibleIssues = dedupeStrings([
        ...readStringArray(item.possibleIssues),
        ...readStringArray(item.issueFlags)
      ]).slice(0, 5);
      const likelySupportingDocsNeeded = readStringArray(item.likelySupportingDocsNeeded).slice(0, 5);
      const suggestedNextAction =
        readTrimmedString(item.suggestedNextAction) ||
        (label ? `Review ${label} against the saved material status and regenerate review after meaningful changes.` : null);
      const reasoningSummary =
        readTrimmedString(item.reasoningSummary) ||
        (possibleIssues.length > 0
          ? "The material metadata includes workflow issue signals."
          : "The material metadata was classified against the checklist item.");

      if (
        !documentId ||
        (documentMap && !matchedDocument) ||
        !documentKey ||
        !label ||
        !likelyDocumentType ||
        !suggestedStatus ||
        !recommendedMaterialStatus ||
        !interpretationNote ||
        !suggestedNextAction ||
        !reasoningSummary
      ) {
        return [];
      }

      return [
        {
          documentId,
          documentKey,
          label,
          likelyDocumentType,
          suggestedStatus,
          issueFlags: possibleIssues.slice(0, 4),
          possibleIssues,
          likelySupportingDocsNeeded,
          recommendedMaterialStatus,
          confidence: clampConfidence(typeof item.confidence === "number" ? item.confidence : 0.5),
          interpretationNote,
          suggestedNextAction,
          reasoningSummary
        }
      ];
    })
    .slice(0, 12);

  if (!summary || items.length === 0) {
    return null;
  }

  return {
    summary,
    items
  };
}

function parseCaseReviewOutput(value: unknown, baseline: CaseReviewResult): CaseReviewResult | null {
  if (!isRecord(value)) {
    return null;
  }

  const readinessStatus = typeof value.readinessStatus === "string" && isReadinessStatus(value.readinessStatus) ? value.readinessStatus : null;
  const readinessSummary = readTrimmedString(value.readinessSummary);
  const summary = readTrimmedString(value.summary);
  const timelineNote = readTrimmedString(value.timelineNote);
  const baselineChecklistKeys = new Set(baseline.checklist.map((item) => item.key));
  const checklist = readRecordArray(value.checklist).flatMap((item) => {
    const key = readTrimmedString(item.key);
    const label = readTrimmedString(item.label);
    const detail = readTrimmedString(item.detail);
    const status = typeof item.status === "string" && isDocumentStatus(item.status) ? item.status : null;
    const materialReference = typeof item.materialReference === "string" && item.materialReference.trim() ? item.materialReference.trim() : null;

    if (!key || !baselineChecklistKeys.has(key) || !label || !detail || !status) {
      return [];
    }

    return [
      {
        key,
        label,
        detail,
        status,
        materialReference
      }
    ];
  });
  const missingItems = readStringArray(value.missingItems);
  const riskFlags = parseRiskFlags(value.riskFlags);
  const nextSteps = readStringArray(value.nextSteps);
  const supportingContextNotes = readStringArray(value.supportingContextNotes).slice(0, 8);
  const officialReferenceLabels = readStringArray(value.officialReferenceLabels).slice(0, 8);

  if (!readinessStatus || !readinessSummary || !summary || !timelineNote || checklist.length !== baseline.checklist.length || nextSteps.length === 0) {
    return null;
  }

  return {
    readinessStatus,
    readinessSummary,
    summary,
    timelineNote,
    checklist,
    missingItems,
    riskFlags,
    nextSteps,
    supportingContextNotes,
    officialReferenceLabels
  };
}

export function parseCaseQuestionAnswerOutput(value: unknown): CaseQuestionAnswer | null {
  if (!isRecord(value)) {
    return null;
  }

  const summary = readTrimmedString(value.summary);
  const whyThisMatters = readTrimmedString(value.whyThisMatters);
  const nextSteps = readStringArray(value.nextSteps).slice(0, 6);
  const trackerActions = readRecordArray(value.trackerActions)
    .flatMap((item) => {
      const label = readTrimmedString(item.label);
      const detail = readTrimmedString(item.detail);
      const priority = typeof item.priority === "string" && isTrackerActionPriority(item.priority) ? item.priority : null;
      const actionType = typeof item.actionType === "string" && isTrackerActionType(item.actionType) ? item.actionType : null;
      const documentKey = typeof item.documentKey === "string" ? item.documentKey.trim() : "";

      if (!label || !detail || !priority || !actionType) {
        return [];
      }

      return [
        {
          label,
          detail,
          priority,
          actionType,
          documentKey
        }
      ];
    })
    .slice(0, 6);

  if (!summary || !whyThisMatters || nextSteps.length === 0 || trackerActions.length === 0) {
    return null;
  }

  return {
    summary,
    whyThisMatters,
    supportingContextNotes: readStringArray(value.supportingContextNotes).slice(0, 6),
    scenarioSpecificWarnings: readStringArray(value.scenarioSpecificWarnings).slice(0, 6),
    nextSteps,
    trackerActions
  };
}

function parseMaterialWorkspaceActionOutput(
  value: unknown,
  document: CaseMaterialSnapshot
): CaseMaterialWorkspaceActionOutput | null {
  if (!isRecord(value)) {
    return null;
  }

  const documentId = readTrimmedString(value.documentId);
  const documentKey = readTrimmedString(value.documentKey);
  const label = readTrimmedString(value.label);
  const likelyDocumentType = readTrimmedString(value.likelyDocumentType);
  const recommendedMaterialStatus =
    typeof value.recommendedMaterialStatus === "string" && isDocumentStatus(value.recommendedMaterialStatus)
      ? value.recommendedMaterialStatus
      : null;
  const suggestedNextAction = readTrimmedString(value.suggestedNextAction);
  const reasoningSummary = readTrimmedString(value.reasoningSummary);
  const regenerateReviewRecommendation =
    typeof value.regenerateReviewRecommendation === "string" &&
    isRegenerateReviewRecommendation(value.regenerateReviewRecommendation)
      ? value.regenerateReviewRecommendation
      : null;
  const readinessImpact =
    typeof value.readinessImpact === "string" && isReadinessImpact(value.readinessImpact)
      ? value.readinessImpact
      : null;

  if (
    documentId !== document.id ||
    documentKey !== document.documentKey ||
    label !== document.label ||
    !likelyDocumentType ||
    !recommendedMaterialStatus ||
    !suggestedNextAction ||
    !reasoningSummary ||
    !regenerateReviewRecommendation ||
    !readinessImpact
  ) {
    return null;
  }

  return {
    documentId,
    documentKey,
    label,
    likelyDocumentType,
    confidence: clampConfidence(typeof value.confidence === "number" ? value.confidence : 0.5),
    possibleIssues: readStringArray(value.possibleIssues).slice(0, 5),
    likelySupportingDocsNeeded: readStringArray(value.likelySupportingDocsNeeded).slice(0, 5),
    recommendedMaterialStatus,
    suggestedNextAction,
    reasoningSummary,
    regenerateReviewRecommendation,
    readinessImpact
  };
}

function parseReviewDeltaOutput(value: unknown): CaseReviewDelta | null {
  if (!isRecord(value)) {
    return null;
  }

  const improvedAreas = readStringArray(value.improvedAreas).slice(0, 5);
  const remainingGaps = readStringArray(value.remainingGaps).slice(0, 5);
  const newRisks = readStringArray(value.newRisks).slice(0, 5);
  const removedRisks = readStringArray(value.removedRisks).slice(0, 5);
  const normalizedRemovedRisks =
    removedRisks.length > 0 ? removedRisks : ["No removed risk data is available for this review delta."];
  const priorityActions = readStringArray(value.priorityActions).slice(0, 5);

  if (improvedAreas.length === 0 || remainingGaps.length === 0 || newRisks.length === 0 || priorityActions.length === 0) {
    return null;
  }

  return {
    improvedAreas,
    remainingGaps,
    newRisks,
    removedRisks: normalizedRemovedRisks,
    priorityActions
  };
}

function parseHandoffIntelligenceOutput(value: unknown): CaseHandoffIntelligence | null {
  if (!isRecord(value)) {
    return null;
  }

  const externalSummary = readTrimmedString(value.externalSummary);
  const reviewReadyStatus =
    typeof value.reviewReadyStatus === "string" && isReadinessStatus(value.reviewReadyStatus)
      ? value.reviewReadyStatus
      : null;
  const issuesNeedingHumanReview = readStringArray(value.issuesNeedingHumanReview).slice(0, 8);
  const supportingNotes = readStringArray(value.supportingNotes).slice(0, 8);
  const escalationTriggers = readStringArray(value.escalationTriggers).slice(0, 6);

  if (!externalSummary || !reviewReadyStatus || issuesNeedingHumanReview.length === 0 || supportingNotes.length === 0 || escalationTriggers.length === 0) {
    return null;
  }

  return {
    externalSummary,
    reviewReadyStatus,
    issuesNeedingHumanReview,
    supportingNotes,
    escalationTriggers
  };
}

function mergeCaseReviewOutputs(baseline: CaseReviewResult, aiReview: CaseReviewResult): CaseReviewResult {
  const aiChecklistMap = new Map(aiReview.checklist.map((item) => [item.key, item]));
  const readinessStatus = chooseSaferReadinessStatus(baseline.readinessStatus, aiReview.readinessStatus);
  const usedBaselineReadiness = readinessStatus === baseline.readinessStatus && aiReview.readinessStatus !== baseline.readinessStatus;

  return {
    readinessStatus,
    readinessSummary: usedBaselineReadiness ? baseline.readinessSummary : aiReview.readinessSummary,
    summary: usedBaselineReadiness ? baseline.summary : aiReview.summary,
    timelineNote: aiReview.timelineNote,
    checklist: baseline.checklist.map((item) => {
      const aiItem = aiChecklistMap.get(item.key);

      if (!aiItem || aiItem.status !== item.status) {
        return item;
      }

      return {
        ...item,
        detail: aiItem.detail || item.detail,
        materialReference: item.materialReference ?? aiItem.materialReference ?? null
      };
    }),
    missingItems: dedupeStrings([...baseline.missingItems, ...aiReview.missingItems]).slice(0, 12),
    riskFlags: dedupeRiskFlags([...baseline.riskFlags, ...aiReview.riskFlags]).slice(0, 10),
    nextSteps: dedupeStrings([...aiReview.nextSteps, ...baseline.nextSteps]).slice(0, 6),
    supportingContextNotes: dedupeStrings([
      ...baseline.supportingContextNotes,
      ...aiReview.supportingContextNotes
    ]).slice(0, 8),
    officialReferenceLabels: dedupeStrings([
      ...baseline.officialReferenceLabels,
      ...aiReview.officialReferenceLabels
    ]).slice(0, 8)
  };
}

function mergeCaseQuestionAnswers(baseline: CaseQuestionAnswer, aiAnswer: CaseQuestionAnswer): CaseQuestionAnswer {
  return {
    summary: aiAnswer.summary || baseline.summary,
    whyThisMatters: aiAnswer.whyThisMatters || baseline.whyThisMatters,
    supportingContextNotes: dedupeStrings([
      ...aiAnswer.supportingContextNotes,
      ...baseline.supportingContextNotes
    ]).slice(0, 6),
    scenarioSpecificWarnings: dedupeStrings([
      ...aiAnswer.scenarioSpecificWarnings,
      ...baseline.scenarioSpecificWarnings
    ]).slice(0, 6),
    nextSteps: dedupeStrings([...aiAnswer.nextSteps, ...baseline.nextSteps]).slice(0, 6),
    trackerActions: dedupeTrackerActions([...aiAnswer.trackerActions, ...baseline.trackerActions]).slice(0, 6)
  };
}

function mergeMaterialWorkspaceActionOutputs(
  baseline: CaseMaterialWorkspaceActionOutput,
  aiAction: CaseMaterialWorkspaceActionOutput
): CaseMaterialWorkspaceActionOutput {
  return {
    documentId: baseline.documentId,
    documentKey: baseline.documentKey,
    label: baseline.label,
    likelyDocumentType: aiAction.likelyDocumentType || baseline.likelyDocumentType,
    confidence: Math.max(baseline.confidence, aiAction.confidence),
    possibleIssues: dedupeStrings([...aiAction.possibleIssues, ...baseline.possibleIssues]).slice(0, 5),
    likelySupportingDocsNeeded: dedupeStrings([
      ...aiAction.likelySupportingDocsNeeded,
      ...baseline.likelySupportingDocsNeeded
    ]).slice(0, 5),
    recommendedMaterialStatus: aiAction.recommendedMaterialStatus,
    suggestedNextAction: aiAction.suggestedNextAction || baseline.suggestedNextAction,
    reasoningSummary: aiAction.reasoningSummary || baseline.reasoningSummary,
    regenerateReviewRecommendation: chooseStrongerRegenerateReviewRecommendation(
      baseline.regenerateReviewRecommendation,
      aiAction.regenerateReviewRecommendation
    ),
    readinessImpact: aiAction.readinessImpact === "no-visible-impact" ? baseline.readinessImpact : aiAction.readinessImpact
  };
}

function mergeReviewDeltaOutputs(baseline: CaseReviewDelta, aiDelta: CaseReviewDelta): CaseReviewDelta {
  return {
    improvedAreas: dedupeStrings([...aiDelta.improvedAreas, ...baseline.improvedAreas]).slice(0, 5),
    remainingGaps: dedupeStrings([...aiDelta.remainingGaps, ...baseline.remainingGaps]).slice(0, 5),
    newRisks: dedupeStrings([...baseline.newRisks, ...aiDelta.newRisks]).slice(0, 5),
    removedRisks: dedupeStrings([...aiDelta.removedRisks, ...baseline.removedRisks]).slice(0, 5),
    priorityActions: dedupeStrings([...aiDelta.priorityActions, ...baseline.priorityActions]).slice(0, 5)
  };
}

function mergeHandoffIntelligenceOutputs(
  baseline: CaseHandoffIntelligence,
  aiHandoff: CaseHandoffIntelligence
): CaseHandoffIntelligence {
  const reviewReadyStatus = chooseSaferReadinessStatus(baseline.reviewReadyStatus, aiHandoff.reviewReadyStatus);

  return {
    externalSummary: aiHandoff.externalSummary || baseline.externalSummary,
    reviewReadyStatus,
    issuesNeedingHumanReview: dedupeStrings([
      ...aiHandoff.issuesNeedingHumanReview,
      ...baseline.issuesNeedingHumanReview
    ]).slice(0, 8),
    supportingNotes: dedupeStrings([
      ...aiHandoff.supportingNotes,
      ...baseline.supportingNotes
    ]).slice(0, 8),
    escalationTriggers: dedupeStrings([
      ...baseline.escalationTriggers,
      ...aiHandoff.escalationTriggers
    ]).slice(0, 6)
  };
}

function buildIntakeNormalizationSnapshot(useCaseSlug: SupportedUseCaseSlug, intake: CaseIntakeValues): Json {
  return {
    useCaseSlug,
    intake
  };
}

function buildMaterialInterpretationSnapshot(useCaseSlug: SupportedUseCaseSlug, documents: CaseMaterialSnapshot[]): Json {
  return {
    useCaseSlug,
    documents: documents.map((item) => ({
      id: item.id,
      documentKey: item.documentKey,
      label: item.label,
      description: item.description,
      required: item.required,
      status: item.status,
      materialReference: item.materialReference,
      notes: item.notes,
      fileName: item.fileName ?? null,
      mimeType: item.mimeType ?? null
    }))
  };
}

function buildMaterialWorkspaceActionSnapshot(input: CaseMaterialWorkspaceActionInput): Json {
  return {
    useCaseSlug: input.useCaseSlug,
    actionType: input.actionType,
    selectedDocument: {
      id: input.document.id,
      documentKey: input.document.documentKey,
      label: input.document.label,
      description: input.document.description,
      required: input.document.required,
      status: input.document.status,
      materialReference: input.document.materialReference,
      notes: input.document.notes,
      fileName: input.document.fileName ?? null,
      mimeType: input.document.mimeType ?? null
    },
    currentMaterialsContext: input.documents.map((item) => ({
      documentKey: item.documentKey,
      label: item.label,
      required: item.required,
      status: item.status,
      hasFile: Boolean(item.fileName),
      hasReference: Boolean(item.materialReference)
    })),
    latestReview: input.latestReview ? summarizeReviewForPrompt(input.latestReview) : null,
    materialInterpretation: input.materialInterpretation
      ? {
          summary: input.materialInterpretation.summary,
          selectedItem: input.materialInterpretation.items.find((item) => item.documentId === input.document.id) ?? null
        }
      : null,
    knowledgeSupport: input.knowledgeContext
      ? {
          status: input.knowledgeContext.status,
          sourceVersion: input.knowledgeContext.sourceVersion,
          scenarioTag: input.knowledgeContext.scenarioTag,
          generatedAt: input.knowledgeContext.generatedAt,
          materialsGuidanceNotes: input.knowledgeContext.materialsGuidanceNotes.filter(
            (item) => item.documentKey === input.document.documentKey
          ),
          officialReferenceLabels: input.knowledgeContext.officialReferenceLabels
        }
      : null
  };
}

function buildReviewEnrichmentSnapshot(input: CaseReviewAiInput): Json {
  return {
    useCaseSlug: input.useCaseSlug,
    intake: input.intake,
    documents: input.documents.map((item) => ({
      documentKey: item.documentKey,
      label: item.label,
      required: item.required,
      status: item.status,
      materialReference: item.materialReference,
      notes: item.notes,
      fileName: item.fileName ?? null
    })),
    intakeNormalization: input.intakeNormalization,
    materialInterpretation: input.materialInterpretation,
    knowledgeContext: input.knowledgeContext,
    deterministicReview: input.baselineReview
  };
}

function buildReviewDeltaSnapshot(input: CaseReviewDeltaInput): Json {
  return {
    useCaseSlug: input.useCaseSlug,
    previousReview: summarizeReviewForPrompt(input.previousReview),
    latestReview: summarizeReviewForPrompt(input.latestReview)
  };
}

function buildHandoffIntelligenceSnapshot(input: CaseHandoffIntelligenceInput): Json {
  return {
    useCaseSlug: input.useCaseSlug,
    scenarioTag: input.knowledgeContext?.scenarioTag ?? input.useCaseSlug,
    caseTitle: input.caseTitle,
    reviewVersion: input.reviewVersion,
    latestReview: summarizeReviewForPrompt(input.latestReview),
    knowledgeSupport: input.knowledgeContext
      ? {
          status: input.knowledgeContext.status,
          sourceVersion: input.knowledgeContext.sourceVersion,
          scenarioTag: input.knowledgeContext.scenarioTag,
          generatedAt: input.knowledgeContext.generatedAt,
          officialReferenceLabels: input.knowledgeContext.officialReferenceLabels,
          processingTimeReferenceLabel: input.knowledgeContext.processingTimeNote?.referenceLabel ?? null
        }
      : null
  };
}

function buildCaseQuestionSnapshot(input: CaseQuestionAiInput): Json {
  return {
    useCaseSlug: input.useCaseSlug,
    question: input.question,
    knowledgeContext: input.knowledgeContext,
    caseContext: input.caseContext
      ? {
          caseId: input.caseContext.caseId ?? null,
          caseTitle: input.caseContext.caseTitle ?? null,
          caseStatus: input.caseContext.caseStatus ?? null,
          latestReview: input.caseContext.latestReview ? summarizeReviewForPrompt(input.caseContext.latestReview) : null,
          previousReview: input.caseContext.previousReview ? summarizeReviewForPrompt(input.caseContext.previousReview) : null,
          reviewDelta: input.caseContext.reviewDelta ?? null,
          documents: (input.caseContext.documents ?? []).map((item) => ({
            documentKey: item.documentKey,
            label: item.label,
            required: item.required,
            status: item.status,
            materialReference: item.materialReference,
            notes: item.notes,
            fileName: item.fileName ?? null
          }))
        }
      : null
  };
}

function summarizeReviewForPrompt(review: CaseReviewResult): Json {
  return {
    readinessStatus: review.readinessStatus,
    summary: review.summary,
    timelineNote: review.timelineNote,
    checklist: review.checklist.map((item) => ({
      key: item.key,
      label: item.label,
      status: item.status
    })),
    missingItems: review.missingItems,
    riskFlags: review.riskFlags,
    nextSteps: review.nextSteps,
    supportingContextNotes: review.supportingContextNotes,
    officialReferenceLabels: review.officialReferenceLabels
  };
}

function buildDeterministicExtractedFacts(intake: CaseIntakeValues) {
  return [
    intake.currentPermitExpiry
      ? {
          label: "Current status expiry",
          value: intake.currentPermitExpiry,
          confidence: 1
        }
      : null,
    intake.supportEntityName.trim()
      ? {
          label: "Support entity",
          value: intake.supportEntityName.trim(),
          confidence: 0.9
        }
      : null,
    intake.applicationReason
      ? {
          label: "Application reason",
          value: intake.applicationReason,
          confidence: 0.85
        }
      : null
  ].flatMap((item) => (item ? [item] : []));
}

function buildDeterministicReviewNotes(useCaseSlug: SupportedUseCaseSlug, intake: CaseIntakeValues) {
  const notes = intake.notes.trim();
  const items = [
    notes ? `Freeform note preserved for review: ${notes.slice(0, 220)}${notes.length > 220 ? "..." : ""}` : "",
    useCaseSlug === "visitor-record" && intake.scenarioProgressStatus === "weak"
      ? "Temporary intent explanation should be reviewed closely."
      : "",
    useCaseSlug === "study-permit-extension" && intake.scenarioProgressStatus === "at-risk"
      ? "Academic or tuition issue should be reviewed closely."
      : ""
  ];

  return dedupeStrings(items.filter(Boolean)).slice(0, 5);
}

function getAllowedIntakeValues(useCaseSlug: SupportedUseCaseSlug) {
  const useCase = getUseCaseDefinition(useCaseSlug);

  if (!useCase) {
    return {};
  }

  return Object.fromEntries(
    getCaseIntakeFields(useCase)
      .filter((field) => field.options?.length)
      .map((field) => [field.name, field.options?.map((option) => option.value) ?? []])
  );
}

function readStoredAiOutput(metadata: Json | null | undefined, key: string): unknown {
  const record = readRecord(metadata);
  const aiWorkflow = readRecord(record?.aiWorkflow);
  const envelope = readRecord(aiWorkflow?.[key] ?? record?.[key]);
  return envelope?.output ?? record?.[key];
}

function parseRiskFlags(value: unknown) {
  return readRecordArray(value)
    .flatMap((item) => {
      const label = readTrimmedString(item.label);
      const severity = typeof item.severity === "string" && isRiskSeverity(item.severity) ? item.severity : null;
      const detail = readTrimmedString(item.detail);

      if (!label || !severity || !detail) {
        return [];
      }

      return [
        {
          label,
          severity,
          detail
        }
      ];
    })
    .slice(0, 10);
}

function safeParseJson(outputText: string | null | undefined) {
  if (!outputText?.trim()) {
    return null;
  }

  try {
    return JSON.parse(outputText);
  } catch {
    return null;
  }
}

function isIntakeInferenceField(value: string): value is Exclude<keyof CaseIntakeValues, "title" | "notes"> {
  return [
    "currentStatus",
    "currentPermitExpiry",
    "urgency",
    "passportValidity",
    "proofOfFundsStatus",
    "refusalOrComplianceIssues",
    "applicationReason",
    "supportEntityName",
    "supportEvidenceStatus",
    "scenarioProgressStatus"
  ].includes(value);
}

function isReadinessStatus(value: string): value is CaseReadinessStatus {
  return readinessStatuses.includes(value as CaseReadinessStatus);
}

function isDocumentStatus(value: string): value is CaseDocumentStatus {
  return documentStatuses.includes(value as CaseDocumentStatus);
}

function isRiskSeverity(value: string): value is CaseRiskFlag["severity"] {
  return riskSeverities.includes(value as CaseRiskFlag["severity"]);
}

function isTrackerActionPriority(value: string): value is CaseQuestionTrackerAction["priority"] {
  return riskSeverities.includes(value as CaseQuestionTrackerAction["priority"]);
}

function isTrackerActionType(value: string): value is CaseQuestionTrackerAction["actionType"] {
  return caseQuestionTrackerActionTypes.includes(value as CaseQuestionTrackerAction["actionType"]);
}

function isRegenerateReviewRecommendation(
  value: string
): value is CaseMaterialWorkspaceActionOutput["regenerateReviewRecommendation"] {
  return ["not-needed", "consider-after-material-update", "recommended-now"].includes(value);
}

function isReadinessImpact(value: string): value is CaseMaterialWorkspaceActionOutput["readinessImpact"] {
  return [
    "no-visible-impact",
    "may-reduce-missing-items",
    "may-reduce-risk",
    "may-improve-handoff-quality",
    "needs-review-before-impact"
  ].includes(value);
}

const readinessRank: Record<CaseReadinessStatus, number> = {
  "not-ready": 0,
  "needs-attention": 1,
  "almost-ready": 2,
  "review-ready": 3
};

function chooseSaferReadinessStatus(baseline: CaseReadinessStatus, candidate: CaseReadinessStatus) {
  return readinessRank[candidate] < readinessRank[baseline] ? candidate : baseline;
}

const regenerateReviewRank: Record<CaseMaterialWorkspaceActionOutput["regenerateReviewRecommendation"], number> = {
  "not-needed": 0,
  "consider-after-material-update": 1,
  "recommended-now": 2
};

function chooseStrongerRegenerateReviewRecommendation(
  baseline: CaseMaterialWorkspaceActionOutput["regenerateReviewRecommendation"],
  candidate: CaseMaterialWorkspaceActionOutput["regenerateReviewRecommendation"]
) {
  return regenerateReviewRank[candidate] > regenerateReviewRank[baseline] ? candidate : baseline;
}

function dedupeStrings(items: string[]) {
  return items.map((item) => item.trim()).filter(Boolean).filter((item, index, array) => array.indexOf(item) === index);
}

function dedupeRiskFlags(items: CaseRiskFlag[]) {
  return items.filter((item, index) => items.findIndex((entry) => entry.label === item.label) === index);
}

function dedupeTrackerActions(items: CaseQuestionTrackerAction[]) {
  return items.filter((item, index) => items.findIndex((entry) => entry.label === item.label && entry.detail === item.detail) === index);
}

function notesContain(input: string, fragments: string[]) {
  return fragments.some((fragment) => input.includes(fragment));
}

function clampConfidence(value: number) {
  if (Number.isNaN(value)) {
    return 0.5;
  }

  return Math.min(1, Math.max(0, value));
}

function readTrimmedString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function readStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => (typeof item === "string" && item.trim() ? [item.trim()] : []));
}

function readRecordArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    const record = readRecord(item);
    return record ? [record] : [];
  });
}

function readRecord(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function rejectAfter(ms: number, message: string) {
  return new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(message)), ms);
  });
}

export function buildCaseMaterialSnapshots(
  documents: Array<
    Pick<
      Tables<"case_documents">,
      | "id"
      | "document_key"
      | "label"
      | "description"
      | "required"
      | "status"
      | "material_reference"
      | "notes"
      | "file_name"
      | "mime_type"
    >
  >
): CaseMaterialSnapshot[] {
  return documents.map((item) => ({
    id: item.id,
    documentKey: item.document_key,
    label: item.label,
    description: item.description,
    required: item.required,
    status: isDocumentStatus(item.status) ? item.status : "missing",
    materialReference: item.material_reference,
    notes: item.notes,
    fileName: item.file_name,
    mimeType: item.mime_type
  }));
}

export function summarizeMaterialInterpretationIssues(output: CaseMaterialInterpretationOutput | null) {
  if (!output) {
    return {
      issueFlagCount: 0,
      suggestedStatusChangesCount: 0
    };
  }

  return {
    issueFlagCount: output.items.reduce((total, item) => total + item.possibleIssues.length, 0),
    possibleIssueCount: output.items.reduce((total, item) => total + item.possibleIssues.length, 0),
    likelySupportingDocSuggestionCount: output.items.reduce(
      (total, item) => total + item.likelySupportingDocsNeeded.length,
      0
    ),
    suggestedStatusChangesCount: output.items.filter((item) => item.recommendedMaterialStatus !== item.suggestedStatus).length,
    recommendedStatusReviewCount: output.items.filter((item) => item.possibleIssues.length > 0).length
  };
}
