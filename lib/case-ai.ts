import OpenAI from "openai";

import type { Json, Tables } from "@/lib/database.types";
import type { CaseReviewResult, CaseRiskFlag } from "@/lib/case-review";
import { defaultLocale, type AppLocale } from "@/lib/i18n/config";
import { pickLocale } from "@/lib/i18n/workspace";
import type { CaseKnowledgeContext } from "@/lib/knowledge/types";
import {
  formatReadinessStatus,
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
  language: AppLocale;
  useCaseSlug: SupportedUseCaseSlug;
  intake: CaseIntakeValues;
  documents: CaseMaterialSnapshot[];
  baselineReview: CaseReviewResult;
  intakeNormalization: CaseIntakeNormalizationOutput | null;
  materialInterpretation: CaseMaterialInterpretationOutput | null;
  knowledgeContext: CaseKnowledgeContext | null;
};

export type CaseMaterialWorkspaceActionInput = {
  language: AppLocale;
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
  language: AppLocale;
  useCaseSlug: SupportedUseCaseSlug;
  previousReview: CaseReviewResult;
  latestReview: CaseReviewResult;
};

export type CaseHandoffIntelligenceInput = {
  language: AppLocale;
  useCaseSlug: SupportedUseCaseSlug;
  caseTitle: string;
  reviewVersion: number;
  latestReview: CaseReviewResult;
  knowledgeContext: CaseKnowledgeContext | null;
};

export type CaseQuestionAiInput = {
  language: AppLocale;
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
  intake: CaseIntakeValues,
  language: AppLocale = defaultLocale
): Promise<CaseAiEnvelope<CaseIntakeNormalizationOutput>> {
  const inputSnapshot = buildIntakeNormalizationSnapshot(useCaseSlug, intake, language);
  const fallback = (reason: string) =>
    buildEnvelope({
      source: "deterministic-fallback",
      promptVersion: caseAiPromptVersions.intakeNormalization,
      inputSnapshot,
      output: buildDeterministicIntakeNormalization(useCaseSlug, intake, language),
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
        input: buildIntakeNormalizationPrompt(useCaseSlug, intake, language),
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
  documents: CaseMaterialSnapshot[],
  language: AppLocale = defaultLocale
): Promise<CaseAiEnvelope<CaseMaterialInterpretationOutput>> {
  const inputSnapshot = buildMaterialInterpretationSnapshot(useCaseSlug, documents, language);
  const fallback = (reason: string) =>
    buildEnvelope({
      source: "deterministic-fallback",
      promptVersion: caseAiPromptVersions.materialInterpretation,
      inputSnapshot,
      output: buildDeterministicMaterialInterpretation(documents, language),
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
        input: buildMaterialInterpretationPrompt(useCaseSlug, documents, language),
        text: {
          format: materialInterpretationResponseFormat
        }
      }),
      rejectAfter(OPENAI_TIMEOUT_MS, "OpenAI material interpretation request timed out.")
    ])) as {
      output_text?: string | null;
    };
    const parsed = safeParseJson(response.output_text);
    const output = parseMaterialInterpretationOutput(parsed, documents, language);

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
  const baselineDelta = buildDeterministicReviewDelta(input.previousReview, input.latestReview, input.language);
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
    const aiDelta = parseReviewDeltaOutput(parsed, input.language);

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

export function parseStoredMaterialInterpretation(
  metadata: Json | null | undefined,
  language: AppLocale = defaultLocale
) {
  const output = readStoredAiOutput(metadata, "materialInterpretation");
  return parseMaterialInterpretationOutput(output, null, language);
}

export function parseStoredReviewDelta(
  metadata: Json | null | undefined,
  language: AppLocale = defaultLocale
) {
  const output = readStoredAiOutput(metadata, "reviewDelta");
  return parseReviewDeltaOutput(output, language);
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

function getAiLanguageLabel(language: AppLocale) {
  return language === "zh-TW" ? "Traditional Chinese (zh-TW)" : "Simplified Chinese (zh-CN)";
}

function buildIntakeNormalizationPrompt(useCaseSlug: SupportedUseCaseSlug, intake: CaseIntakeValues, language: AppLocale) {
  const useCase = getUseCaseDefinition(useCaseSlug, language);
  const allowedFieldValues = getAllowedIntakeValues(useCaseSlug);

  return [
    "You normalize case intake notes for Tideus, a narrow Canada temporary resident case-prep workflow workspace.",
    `Return every user-facing string in ${getAiLanguageLabel(language)}.`,
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

function buildMaterialInterpretationPrompt(
  useCaseSlug: SupportedUseCaseSlug,
  documents: CaseMaterialSnapshot[],
  language: AppLocale
) {
  const useCase = getUseCaseDefinition(useCaseSlug, language);

  return [
    "You interpret lightweight material metadata for Tideus case workflow quality.",
    `Return every user-facing string in ${getAiLanguageLabel(language)}.`,
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
  const useCase = getUseCaseDefinition(input.useCaseSlug, input.language);

  return [
    "You support a Tideus case workspace material action.",
    `Return every user-facing string in ${getAiLanguageLabel(input.language)}.`,
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
  const useCase = getUseCaseDefinition(input.useCaseSlug, input.language);

  return [
    "You improve a structured Tideus case review from deterministic workflow output.",
    `Return every user-facing string in ${getAiLanguageLabel(input.language)}.`,
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
  const useCase = getUseCaseDefinition(input.useCaseSlug, input.language);

  return [
    "You summarize the delta between two saved Tideus case review versions.",
    `Return every user-facing string in ${getAiLanguageLabel(input.language)}.`,
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
  const useCase = getUseCaseDefinition(input.useCaseSlug, input.language);

  return [
    "You answer a Tideus case-prep question inside a narrow workflow engine.",
    `Return every user-facing string in ${getAiLanguageLabel(input.language)}.`,
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
  const useCase = getUseCaseDefinition(input.useCaseSlug, input.language);

  return [
    "You strengthen a Tideus export packet for self-review or external professional review.",
    `Return every user-facing string in ${getAiLanguageLabel(input.language)}.`,
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
  intake: CaseIntakeValues,
  language: AppLocale = defaultLocale
): CaseIntakeNormalizationOutput {
  const notes = intake.notes.toLowerCase();
  const inferredFields: CaseIntakeNormalizationOutput["inferredFields"] = {};

  if (!intake.refusalOrComplianceIssues && notesContain(notes, ["refusal", "refused", "overstay", "compliance", "拒签", "拒簽", "逾期", "合规", "合規"])) {
    inferredFields.refusalOrComplianceIssues = "yes";
  }

  if (!intake.proofOfFundsStatus && notesContain(notes, ["bank", "fund", "money", "tuition", "support", "银行", "銀行", "资金", "資金", "学费", "學費", "支持"])) {
    inferredFields.proofOfFundsStatus = "partial";
  }

  if (!intake.supportEvidenceStatus && notesContain(notes, ["host", "invitation", "accommodation", "school", "enrolment", "letter", "接待", "邀请", "邀請", "住宿", "学校", "學校", "在学", "在學", "证明", "證明", "说明信", "說明信"])) {
    inferredFields.supportEvidenceStatus = "partial";
  }

  if (useCaseSlug === "visitor-record" && !intake.scenarioProgressStatus && notesContain(notes, ["temporary", "leave", "return", "visit", "临时", "臨時", "离开", "離開", "返回", "回国", "回國", "探亲", "探親", "访问", "訪問"])) {
    inferredFields.scenarioProgressStatus = "partial";
  }

  if (
    useCaseSlug === "study-permit-extension" &&
    !intake.scenarioProgressStatus &&
    notesContain(notes, ["tuition", "grades", "standing", "transcript", "registration", "学费", "學費", "成绩", "成績", "在学", "在學", "注册", "註冊"])
  ) {
    inferredFields.scenarioProgressStatus = "needs-explanation";
  }

  return {
    inferredFields,
    explanationSignals: {
      timelinePressure: intake.urgency === "under-30" || notesContain(notes, ["urgent", "soon", "expire", "deadline", "紧急", "緊急", "很快", "到期", "截止"]),
      fundingConcern:
        intake.proofOfFundsStatus === "missing" ||
        intake.proofOfFundsStatus === "partial" ||
        notesContain(notes, ["fund", "money", "budget", "tuition", "bank", "资金", "資金", "预算", "預算", "学费", "學費", "银行", "銀行"]),
      supportDependency: Boolean(intake.supportEntityName.trim()) || notesContain(notes, ["host", "family", "school", "employer", "support", "接待", "家人", "学校", "學校", "雇主", "支持"]),
      priorIssueMentioned: intake.refusalOrComplianceIssues === "yes" || notesContain(notes, ["refusal", "refused", "overstay", "compliance", "拒签", "拒簽", "逾期", "合规", "合規"]),
      schoolProgressConcern:
        useCaseSlug === "study-permit-extension" &&
        (intake.scenarioProgressStatus === "at-risk" ||
          notesContain(notes, ["grades", "failed", "probation", "tuition", "registration", "standing", "成绩", "成績", "挂科", "停学", "停學", "学费", "學費", "注册", "註冊"])),
      temporaryIntentConcern:
        useCaseSlug === "visitor-record" &&
        (intake.scenarioProgressStatus === "weak" || notesContain(notes, ["temporary intent", "return", "leave canada", "ties", "临时意图", "臨時意圖", "回国", "回國", "离开加拿大", "離開加拿大", "约束", "約束"]))
    },
    extractedFacts: buildDeterministicExtractedFacts(intake, language),
    reviewNotes: buildDeterministicReviewNotes(useCaseSlug, intake, language)
  };
}

function buildDeterministicMaterialInterpretation(
  documents: CaseMaterialSnapshot[],
  language: AppLocale = defaultLocale
): CaseMaterialInterpretationOutput {
  const items = documents.map((item) => {
    const issueFlags = buildMaterialIssueFlags(item);
    const possibleIssues = issueFlags.map((flag) => formatMaterialIssueFlag(flag, language));
    const likelySupportingDocsNeeded = buildLikelySupportingDocuments(item, issueFlags, language);
    const recommendedMaterialStatus = chooseRecommendedMaterialStatus(item, issueFlags);
    const suggestedNextAction = buildMaterialSuggestedNextAction(item, issueFlags, likelySupportingDocsNeeded, language);

    return {
      documentId: item.id,
      documentKey: item.documentKey,
      label: item.label,
      likelyDocumentType: item.label,
      suggestedStatus: recommendedMaterialStatus,
      issueFlags,
      possibleIssues,
      likelySupportingDocsNeeded,
      recommendedMaterialStatus,
      confidence: issueFlags.length > 0 ? 0.68 : 0.55,
      interpretationNote:
        issueFlags.length > 0
          ? pickLocale(
              language,
              `${item.label} 存在应在下一轮结构化审查中继续保持可见的工作流信号。`,
              `${item.label} 存在應在下一輪結構化審查中持續保留的工作流程訊號。`
            )
          : pickLocale(
              language,
              `${item.label} 已根据预期清单标签与当前材料元数据完成轻量分类。`,
              `${item.label} 已根據預期清單標籤與目前材料中介資料完成輕量分類。`
            ),
      suggestedNextAction,
      reasoningSummary:
        issueFlags.length > 0
          ? pickLocale(
              language,
              "当前状态、文件元数据或备注显示，这份材料仍需要继续作为案件工作项处理。",
              "目前狀態、檔案中介資料或備註顯示，這份材料仍需要繼續作為案件工作項處理。"
            )
          : pickLocale(
              language,
              "当前没有明显的元数据异常；请让这份材料继续留在下一轮结构化审查脉络中。",
              "目前沒有明顯的中介資料異常；請讓這份材料繼續留在下一輪結構化審查脈絡中。"
            )
    };
  });

  return {
    summary:
      items.some((item) => item.issueFlags.length > 0)
        ? pickLocale(
            language,
            "材料元数据中存在会影响下一轮结构化审查的问题信号。",
            "材料中介資料中存在會影響下一輪結構化審查的問題訊號。"
          )
        : pickLocale(
            language,
            "材料元数据已与预期清单对齐，目前没有额外的问题信号。",
            "材料中介資料已與預期清單對齊，目前沒有額外的問題訊號。"
          ),
    items
  };
}

function buildDeterministicMaterialWorkspaceAction(input: CaseMaterialWorkspaceActionInput): CaseMaterialWorkspaceActionOutput {
  const interpretedItem = input.materialInterpretation?.items.find((item) => item.documentId === input.document.id) ?? null;
  const issueFlags =
    interpretedItem?.issueFlags.length
      ? interpretedItem.issueFlags
      : buildMaterialIssueFlags(input.document);
  const possibleIssues =
    interpretedItem?.possibleIssues.length
      ? interpretedItem.possibleIssues
      : issueFlags.map((flag) => formatMaterialIssueFlag(flag, input.language));
  const likelySupportingDocsNeeded =
    interpretedItem?.likelySupportingDocsNeeded.length
      ? interpretedItem.likelySupportingDocsNeeded
      : buildLikelySupportingDocuments(input.document, issueFlags, input.language);
  const recommendedMaterialStatus =
    interpretedItem?.recommendedMaterialStatus ?? chooseRecommendedMaterialStatus(input.document, issueFlags);
  const latestMissingMatch = input.latestReview?.missingItems.some((item) =>
    item.toLowerCase().includes(input.document.label.toLowerCase())
  ) ?? false;
  const latestRiskMatch = input.latestReview?.riskFlags.some((item) =>
    `${item.label} ${item.detail}`.toLowerCase().includes(input.document.label.toLowerCase())
  ) ?? false;
  const regenerateReviewRecommendation = chooseRegenerateReviewRecommendation({
    document: input.document,
    recommendedMaterialStatus,
    issueFlags,
    latestMissingMatch,
    latestRiskMatch
  });

  return {
    documentId: input.document.id,
    documentKey: input.document.documentKey,
    label: input.document.label,
    likelyDocumentType: interpretedItem?.likelyDocumentType ?? input.document.label,
    confidence: interpretedItem?.confidence ?? (issueFlags.length > 0 ? 0.68 : 0.55),
    possibleIssues,
    likelySupportingDocsNeeded,
    recommendedMaterialStatus,
    suggestedNextAction:
      interpretedItem?.suggestedNextAction ||
      buildWorkspaceSuggestedNextAction(
        input.actionType,
        input.document,
        issueFlags,
        likelySupportingDocsNeeded,
        regenerateReviewRecommendation,
        input.language
      ),
    reasoningSummary:
      interpretedItem?.reasoningSummary ||
      buildWorkspaceReasoningSummary(
        input.actionType,
        input.document,
        latestMissingMatch,
        latestRiskMatch,
        issueFlags,
        input.language
      ),
    regenerateReviewRecommendation,
    readinessImpact: chooseReadinessImpact({
      document: input.document,
      issueFlags,
      latestMissingMatch,
      latestRiskMatch,
      regenerateReviewRecommendation
    })
  };
}

function buildMaterialIssueFlags(item: CaseMaterialSnapshot) {
  const noteText = `${item.materialReference ?? ""} ${item.notes ?? ""} ${item.fileName ?? ""}`.toLowerCase();

  return dedupeStrings(
    [
      item.status === "missing" && item.required ? "required-material-missing" : "",
      item.status === "needs-refresh" ? "refresh-needed-before-handoff" : "",
      item.status === "collecting" ? "collection-not-finished" : "",
      item.status === "ready" && !item.fileName && !item.materialReference ? "ready-status-without-reference" : "",
      notesContain(noteText, ["expired", "old", "outdated", "过期", "過期", "旧", "舊"]) ? "possible-stale-document" : "",
      notesContain(noteText, ["unclear", "incomplete", "missing", "不清楚", "不完整", "缺失", "缺少"]) ? "note-suggests-completeness-gap" : ""
    ].filter(Boolean)
  ).slice(0, 5);
}

function buildLikelySupportingDocuments(
  item: CaseMaterialSnapshot,
  issueFlags: string[],
  language: AppLocale
) {
  const lowerLabel = item.label.toLowerCase();
  const support: string[] = [];

  if (lowerLabel.includes("fund")) {
    support.push(pickLocale(language, "近期银行流水或资金支持证明", "近期銀行流水或資金支持證明"));
  }

  if (lowerLabel.includes("passport")) {
    support.push(pickLocale(language, "当前护照身份页与续签后的护照信息", "目前護照身分頁與更新後的護照資訊"));
  }

  if (lowerLabel.includes("explanation") || lowerLabel.includes("intent") || lowerLabel.includes("reason")) {
    support.push(pickLocale(language, "与当前案件情境一致的简短说明", "與目前案件情境一致的簡短說明"));
  }

  if (lowerLabel.includes("enrolment") || lowerLabel.includes("school") || lowerLabel.includes("study")) {
    support.push(pickLocale(language, "当前在学证明或学校说明信", "目前在學證明或學校說明信"));
  }

  if (lowerLabel.includes("transcript") || lowerLabel.includes("progress")) {
    support.push(pickLocale(language, "最新成绩单、学习进度说明或注册证明", "最新成績單、學習進度說明或註冊證明"));
  }

  if (lowerLabel.includes("host") || lowerLabel.includes("accommodation")) {
    support.push(pickLocale(language, "接待方说明、住宿确认或关系支持说明", "接待方說明、住宿確認或關係支持說明"));
  }

  if (issueFlags.some((item) => item.includes("stale") || item.includes("refresh"))) {
    support.push(pickLocale(language, "同一材料的更新版本", "同一材料的更新版本"));
  }

  return dedupeStrings(support).slice(0, 5);
}

function chooseRecommendedMaterialStatus(item: CaseMaterialSnapshot, issueFlags: string[]): CaseDocumentStatus {
  if (item.status === "not-applicable") {
    return "not-applicable";
  }

  if (issueFlags.some((issue) => issue.includes("stale") || issue.includes("refresh") || issue.includes("completeness"))) {
    return "needs-refresh";
  }

  if (item.fileName || item.materialReference) {
    return item.status === "missing" ? "collecting" : item.status;
  }

  return item.required ? "missing" : item.status;
}

function buildMaterialSuggestedNextAction(
  item: CaseMaterialSnapshot,
  issueFlags: string[],
  likelySupportingDocsNeeded: string[],
  language: AppLocale
) {
  if (item.status === "missing") {
    return pickLocale(
      language,
      `先收集或附加 ${item.label}，再更新材料状态并重新生成审查。`,
      `先收集或附加 ${item.label}，再更新材料狀態並重新生成審查。`
    );
  }

  if (issueFlags.some((issue) => issue.includes("stale") || issue.includes("refresh"))) {
    return pickLocale(
      language,
      `请刷新 ${item.label}，或补充备注解释为什么当前版本仍可使用。`,
      `請更新 ${item.label}，或補充備註說明為什麼目前版本仍可使用。`
    );
  }

  if (likelySupportingDocsNeeded.length > 0 && item.status !== "ready") {
    return pickLocale(
      language,
      `请为 ${item.label} 补充支持材料或背景：${likelySupportingDocsNeeded[0]}。`,
      `請為 ${item.label} 補充支持材料或背景：${likelySupportingDocsNeeded[0]}。`
    );
  }

  return pickLocale(
    language,
    `请让 ${item.label} 继续留在材料包中，并在保存有意义的材料变更后重新生成审查。`,
    `請讓 ${item.label} 繼續留在材料包中，並在儲存有意義的材料變更後重新生成審查。`
  );
}

function buildWorkspaceSuggestedNextAction(
  actionType: CaseMaterialWorkspaceActionType,
  item: CaseMaterialSnapshot,
  issueFlags: string[],
  likelySupportingDocsNeeded: string[],
  regenerateReviewRecommendation: CaseMaterialWorkspaceActionOutput["regenerateReviewRecommendation"],
  language: AppLocale
) {
  if (actionType === "suggest-supporting-docs" && likelySupportingDocsNeeded.length > 0) {
    return pickLocale(
      language,
      `优先补充或核对：${likelySupportingDocsNeeded.join("；")}。`,
      `優先補充或核對：${likelySupportingDocsNeeded.join("；")}。`
    );
  }

  if (actionType === "suggest-regenerate-review" || regenerateReviewRecommendation === "recommended-now") {
    return pickLocale(
      language,
      "保存这份材料状态后请重新生成审查，让就绪度、缺失项与风险标记反映当前包件。",
      "儲存這份材料狀態後請重新生成審查，讓就緒度、缺失項與風險標記反映目前包件。"
    );
  }

  if (actionType === "explain-missing" || item.status === "missing") {
    return pickLocale(
      language,
      `除非这项材料对本案不适用，否则请把 ${item.label} 视为下一条优先收集任务。`,
      `除非這項材料對本案不適用，否則請把 ${item.label} 視為下一條優先收集任務。`
    );
  }

  if (issueFlags.length > 0) {
    return pickLocale(
      language,
      `先处理当前最明显的问题：${formatMaterialIssueFlag(issueFlags[0], language)}。`,
      `先處理目前最明顯的問題：${formatMaterialIssueFlag(issueFlags[0], language)}。`
    );
  }

  return pickLocale(
    language,
    `先确认 ${item.label} 的状态标记无误，再继续推进下一个尚未完成的必需材料。`,
    `先確認 ${item.label} 的狀態標記無誤，再繼續推進下一個尚未完成的必需材料。`
  );
}

function buildWorkspaceReasoningSummary(
  actionType: CaseMaterialWorkspaceActionType,
  item: CaseMaterialSnapshot,
  latestMissingMatch: boolean,
  latestRiskMatch: boolean,
  issueFlags: string[],
  language: AppLocale
) {
  if (latestMissingMatch) {
    return pickLocale(
      language,
      "最新保存的审查仍把这项材料相关区域视为缺口，因此最有价值的动作是先关闭或解释这个缺口。",
      "最新儲存的審查仍把這項材料相關區域視為缺口，因此最有價值的動作是先關閉或解釋這個缺口。"
    );
  }

  if (latestRiskMatch) {
    return pickLocale(
      language,
      "最新保存的审查仍把这项材料与风险信号关联，因此在交接前应继续保持可见。",
      "最新儲存的審查仍把這項材料與風險訊號關聯，因此在交接前應繼續保持可見。"
    );
  }

  if (issueFlags.length > 0) {
    return pickLocale(
      language,
      "这份材料的元数据中存在工作流问题信号，在把它当作干净材料依赖之前应先处理。",
      "這份材料的中介資料中存在工作流程問題訊號，在把它當作乾淨材料依賴之前應先處理。"
    );
  }

  if (actionType === "suggest-regenerate-review") {
    return pickLocale(
      language,
      "当材料状态、备注或附件发生保存后的变化时，重新生成审查最有价值。",
      "當材料狀態、備註或附件發生儲存後的變化時，重新生成審查最有價值。"
    );
  }

  return pickLocale(
    language,
    "这项建议基于所选清单项、已保存的材料元数据以及当前审查脉络给出。",
    "這項建議是根據所選清單項、已儲存的材料中介資料以及目前審查脈絡給出的。"
  );
}

function chooseRegenerateReviewRecommendation({
  document,
  recommendedMaterialStatus,
  issueFlags,
  latestMissingMatch,
  latestRiskMatch
}: {
  document: CaseMaterialSnapshot;
  recommendedMaterialStatus: CaseDocumentStatus;
  issueFlags: string[];
  latestMissingMatch: boolean;
  latestRiskMatch: boolean;
}): CaseMaterialWorkspaceActionOutput["regenerateReviewRecommendation"] {
  if (
    document.status !== recommendedMaterialStatus ||
    latestMissingMatch ||
    latestRiskMatch ||
    (document.required && document.status === "ready" && issueFlags.length === 0)
  ) {
    return "recommended-now";
  }

  if (issueFlags.length > 0 || document.status === "collecting" || document.status === "needs-refresh") {
    return "consider-after-material-update";
  }

  return "not-needed";
}

function chooseReadinessImpact({
  document,
  issueFlags,
  latestMissingMatch,
  latestRiskMatch,
  regenerateReviewRecommendation
}: {
  document: CaseMaterialSnapshot;
  issueFlags: string[];
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

  if (issueFlags.length > 0) {
    return "needs-review-before-impact";
  }

  if (regenerateReviewRecommendation !== "not-needed") {
    return "may-improve-handoff-quality";
  }

  return "no-visible-impact";
}

function formatMaterialIssueFlag(flag: string, language: AppLocale) {
  const labels: Record<string, string> = {
    "required-material-missing": pickLocale(language, "必需材料仍缺失。", "必需材料仍缺失。"),
    "refresh-needed-before-handoff": pickLocale(language, "材料需要在交接前更新。", "材料需要在交接前更新。"),
    "collection-not-finished": pickLocale(language, "材料仍在收集中。", "材料仍在收集中。"),
    "ready-status-without-reference": pickLocale(language, "材料被标记为已就绪，但缺少明确引用或附件。", "材料被標記為已就緒，但缺少明確引用或附件。"),
    "possible-stale-document": pickLocale(language, "文件可能已经过期或版本过旧。", "文件可能已經過期或版本過舊。"),
    "note-suggests-completeness-gap": pickLocale(language, "备注显示材料可能仍不完整或不清晰。", "備註顯示材料可能仍不完整或不清晰。")
  };

  return labels[flag] ?? flag;
}

function formatRiskSeverityPhrase(severity: CaseRiskFlag["severity"], language: AppLocale) {
  if (severity === "high") {
    return pickLocale(language, "高风险", "高風險");
  }

  if (severity === "medium") {
    return pickLocale(language, "中风险", "中風險");
  }

  return pickLocale(language, "低风险", "低風險");
}

function buildDeterministicReviewDelta(
  previousReview: CaseReviewResult,
  latestReview: CaseReviewResult,
  language: AppLocale = defaultLocale
): CaseReviewDelta {
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
        ? pickLocale(
            language,
            `就绪度已从 ${formatReadinessStatus(previousReview.readinessStatus, language)} 提升到 ${formatReadinessStatus(latestReview.readinessStatus, language)}。`,
            `就緒度已從 ${formatReadinessStatus(previousReview.readinessStatus, language)} 提升到 ${formatReadinessStatus(latestReview.readinessStatus, language)}。`
          )
        : "",
      latestReady > previousReady
        ? pickLocale(
            language,
            `新增 ${latestReady - previousReady} 个清单项目变为已就绪或不适用。`,
            `新增 ${latestReady - previousReady} 個清單項目變為已就緒或不適用。`
          )
        : "",
      ...removedMissing.map((item) =>
        pickLocale(language, `${item} 已不再被标记为缺失。`, `${item} 已不再被標記為缺失。`)
      ),
      ...removedRisks.map((item) =>
        pickLocale(language, `${item} 已不再显示为风险标记。`, `${item} 已不再顯示為風險標記。`)
      )
    ].filter(Boolean)
  ).slice(0, 5);
  const remainingGaps = dedupeStrings([
    ...latestReview.missingItems.map((item) =>
      pickLocale(language, `仍缺：${item}`, `仍缺：${item}`)
    ),
    ...latestReview.riskFlags.map((item) =>
      pickLocale(language, `${formatRiskSeverityPhrase(item.severity, language)}：${item.label}`, `${formatRiskSeverityPhrase(item.severity, language)}：${item.label}`)
    )
  ]).slice(0, 5);

  return {
    improvedAreas:
      improvedAreas.length > 0
        ? improvedAreas
        : [pickLocale(language, "两次已保存的审查版本之间暂未看到明确改善。", "兩次已儲存的審查版本之間暫未看到明確改善。")],
    remainingGaps:
      remainingGaps.length > 0
        ? remainingGaps
        : [pickLocale(language, "最新审查版本中没有明显的主要缺口。", "最新審查版本中沒有明顯的主要缺口。")],
    newRisks:
      newRisks.length > 0
        ? newRisks
        : [pickLocale(language, "最新审查版本中没有新增风险标记。", "最新審查版本中沒有新增風險標記。")],
    removedRisks:
      removedRisks.length > 0
        ? removedRisks.map((item) =>
            pickLocale(language, `${item} 已不再显示为风险标记。`, `${item} 已不再顯示為風險標記。`)
          )
        : [pickLocale(language, "这个版本没有移除既有风险标记。", "這個版本沒有移除既有風險標記。")],
    priorityActions: latestReview.nextSteps.slice(0, 5)
  };
}

function buildDeterministicHandoffIntelligence(input: CaseHandoffIntelligenceInput): CaseHandoffIntelligence {
  const { latestReview } = input;
  const highRiskFlags = latestReview.riskFlags.filter((item) => item.severity === "high");
  const humanReviewIssues = dedupeStrings([
    ...latestReview.missingItems.map((item) =>
      pickLocale(input.language, `需要人工确认的缺失项：${item}`, `需要人工確認的缺失項：${item}`)
    ),
    ...latestReview.riskFlags
      .filter((item) => item.severity === "high" || item.severity === "medium")
      .map((item) =>
        pickLocale(
          input.language,
          `${formatRiskSeverityPhrase(item.severity, input.language)}：${item.label}。${item.detail}`,
          `${formatRiskSeverityPhrase(item.severity, input.language)}：${item.label}。${item.detail}`
        )
      )
  ]).slice(0, 8);
  const escalationTriggers = dedupeStrings([
    latestReview.readinessStatus === "not-ready"
      ? pickLocale(input.language, "当前就绪状态仍为未就绪。", "目前就緒狀態仍為未就緒。")
      : "",
    highRiskFlags.length > 0
      ? pickLocale(
          input.language,
          `当前仍有 ${highRiskFlags.length} 个高风险标记保持可见。`,
          `目前仍有 ${highRiskFlags.length} 個高風險標記保持可見。`
        )
      : "",
    latestReview.missingItems.length > 0
      ? pickLocale(
          input.language,
          `当前仍有 ${latestReview.missingItems.length} 个缺失项未关闭。`,
          `目前仍有 ${latestReview.missingItems.length} 個缺失項未關閉。`
        )
      : "",
    ...latestReview.riskFlags
      .filter((item) => item.severity === "high")
      .map((item) => item.label)
  ]).slice(0, 6);

  return {
    externalSummary:
      pickLocale(
        input.language,
        `${input.caseTitle} 是 ${getUseCaseDefinition(input.useCaseSlug, input.language)?.shortTitle ?? input.useCaseSlug} 的工作台导出摘要，来源于第 ${input.reviewVersion} 个审查版本。${latestReview.summary}`,
        `${input.caseTitle} 是 ${getUseCaseDefinition(input.useCaseSlug, input.language)?.shortTitle ?? input.useCaseSlug} 的工作台匯出摘要，來源於第 ${input.reviewVersion} 個審查版本。${latestReview.summary}`
      ),
    reviewReadyStatus: latestReview.readinessStatus,
    issuesNeedingHumanReview:
      humanReviewIssues.length > 0
        ? humanReviewIssues
        : [pickLocale(input.language, "当前保存版本中没有明显的中高风险或主要缺失项。", "目前儲存版本中沒有明顯的中高風險或主要缺失項。")],
    supportingNotes: dedupeStrings([
      latestReview.readinessSummary,
      latestReview.timelineNote,
      ...latestReview.supportingContextNotes,
      ...latestReview.officialReferenceLabels.map((item) =>
        pickLocale(input.language, `参考标签：${item}`, `參考標籤：${item}`)
      )
    ]).slice(0, 8),
    escalationTriggers:
      escalationTriggers.length > 0
        ? escalationTriggers
        : [pickLocale(input.language, "当前保存版本中没有触发自动升级的明显信号。", "目前儲存版本中沒有觸發自動升級的明顯訊號。")]
  };
}

function buildDeterministicCaseQuestionAnswer(input: CaseQuestionAiInput): CaseQuestionAnswer {
  const useCase = getUseCaseDefinition(input.useCaseSlug, input.language);
  const latestReview = input.caseContext?.latestReview ?? null;
  const previousReview = input.caseContext?.previousReview ?? null;
  const reviewDelta = input.caseContext?.reviewDelta ?? null;
  const question = input.question.toLowerCase();
  const missingItems = latestReview?.missingItems ?? [];
  const riskFlags = latestReview?.riskFlags ?? [];
  const priorityNextSteps = latestReview?.nextSteps ?? buildDefaultScenarioNextSteps(input.useCaseSlug, input.language);
  const askedAboutMissing = notesContain(question, ["missing", "need", "still", "gap", "document", "缺", "缺失", "缺少", "还缺", "還缺", "材料"]);
  const askedAboutRisk = notesContain(question, ["risk", "problem", "concern", "weak", "refusal", "风险", "風險", "问题", "問題", "担心", "擔心", "拒签", "拒簽"]);
  const askedAboutChange = notesContain(question, ["changed", "change", "delta", "since", "previous", "last review", "变化", "變化", "改变", "改變", "上次", "上一版", "差异", "差異"]);
  const askedAboutNext = notesContain(question, ["next", "do now", "action", "priority", "下一步", "现在", "現在", "动作", "動作", "优先", "優先"]);
  const summary = buildDeterministicQuestionSummary({
    language: input.language,
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
    ...riskFlags.slice(0, 3).map((item) =>
      pickLocale(
        input.language,
        `${formatRiskSeverityPhrase(item.severity, input.language)}：${item.label}。${item.detail}`,
        `${formatRiskSeverityPhrase(item.severity, input.language)}：${item.label}。${item.detail}`
      )
    )
  ]).slice(0, 6);
  const nextSteps = dedupeStrings([
    ...(askedAboutChange && reviewDelta ? reviewDelta.priorityActions : []),
    ...(askedAboutMissing
      ? missingItems.map((item) =>
          pickLocale(input.language, `请确认或补齐 ${item}。`, `請確認或補齊 ${item}。`)
        )
      : []),
    ...(askedAboutRisk
      ? riskFlags.slice(0, 3).map((item) =>
          pickLocale(
            input.language,
            `在把包件视为可交接前，请先处理 ${item.label} 风险。`,
            `在把包件視為可交接前，請先處理 ${item.label} 風險。`
          )
        )
      : []),
    ...(askedAboutNext ? priorityNextSteps : []),
    ...priorityNextSteps,
    pickLocale(
      input.language,
      "如果这条问题应该变成案件追踪动作，请把它保存到工作台。",
      "如果這條問題應該變成案件追蹤動作，請把它儲存到工作台。"
    )
  ]).slice(0, 6);

  return {
    summary,
    whyThisMatters: latestReview
      ? pickLocale(
          input.language,
          "这很重要，因为已保存的案件审查是围绕就绪度、材料状态、风险与下一步动作运转的。保持结构化，工作台才能把答案变成真实案件工作，而不是一次性的聊天记录。",
          "這很重要，因為已儲存的案件審查是圍繞就緒度、材料狀態、風險與下一步動作運轉的。保持結構化，工作台才能把答案變成真實案件工作，而不是一次性的聊天紀錄。"
        )
      : pickLocale(
          input.language,
          "这很重要，因为在 Tideus 里，只有当问题转化为 intake 事实、预期材料、清单动作或可保存的审查路径时，它才真正有价值。",
          "這很重要，因為在 Tideus 裡，只有當問題轉化為 intake 事實、預期材料、清單動作或可儲存的審查路徑時，它才真正有價值。"
        ),
    supportingContextNotes,
    scenarioSpecificWarnings,
    nextSteps,
    trackerActions: buildDeterministicTrackerActions(input, missingItems, riskFlags, nextSteps)
  };
}

function buildDeterministicQuestionSummary({
  language,
  useCaseTitle,
  hasCaseContext,
  askedAboutMissing,
  askedAboutRisk,
  askedAboutChange,
  missingItems,
  riskFlags,
  reviewDelta
}: {
  language: AppLocale;
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
    return pickLocale(
      language,
      `最新的 ${useCaseTitle} 审查应结合上一个版本一起看，重点观察改善点、剩余缺口、新增风险与优先动作。`,
      `最新的 ${useCaseTitle} 審查應結合上一個版本一起看，重點觀察改善點、剩餘缺口、新增風險與優先動作。`
    );
  }

  if (askedAboutMissing) {
    return missingItems.length > 0
      ? pickLocale(
          language,
          `当前 ${useCaseTitle} 工作台仍显示 ${missingItems.length} 个缺失项，这些项目应直接驱动下一轮工作。`,
          `目前 ${useCaseTitle} 工作台仍顯示 ${missingItems.length} 個缺失項，這些項目應直接驅動下一輪工作。`
        )
      : pickLocale(
          language,
          `当前 ${useCaseTitle} 工作台没有把必需项目标记为缺失，因此下一轮应转向材料新鲜度、风险与说明质量。`,
          `目前 ${useCaseTitle} 工作台沒有把必需項目標記為缺失，因此下一輪應轉向材料新鮮度、風險與說明品質。`
        );
  }

  if (askedAboutRisk) {
    return riskFlags.length > 0
      ? pickLocale(
          language,
          `当前 ${useCaseTitle} 工作台显示 ${riskFlags.length} 个风险标记，在交接前应继续保持可见。`,
          `目前 ${useCaseTitle} 工作台顯示 ${riskFlags.length} 個風險標記，在交接前應繼續保持可見。`
        )
      : pickLocale(
          language,
          `当前 ${useCaseTitle} 工作台没有明显的主要风险标记，但在做递交决策前仍需要一次结构化最终审查。`,
          `目前 ${useCaseTitle} 工作台沒有明顯的主要風險標記，但在做遞交決策前仍需要一次結構化最終審查。`
        );
  }

  return hasCaseContext
    ? pickLocale(
        language,
        `这条 ${useCaseTitle} 答案已经锚定在当前案件工作台上，应作为结构化案件工作处理，而不是单独聊天记录。`,
        `這條 ${useCaseTitle} 答案已經錨定在目前案件工作台上，應作為結構化案件工作處理，而不是單獨聊天紀錄。`
      )
    : pickLocale(
        language,
        `如果这个问题会影响材料、清单动作、时间线或交接质量，就应把这条 ${useCaseTitle} 答案转成已保存工作台。`,
        `如果這個問題會影響材料、清單動作、時間線或交接品質，就應把這條 ${useCaseTitle} 答案轉成已儲存工作台。`
      );
}

function buildDefaultScenarioNextSteps(useCaseSlug: SupportedUseCaseSlug, language: AppLocale = defaultLocale) {
  if (useCaseSlug === "visitor-record") {
    return [
      pickLocale(language, "先确认当前身份到期日与护照有效期，再依赖这条答案推进。", "先確認目前身分到期日與護照效期，再依賴這條答案推進。"),
      pickLocale(language, "把延期说明、资金证明与临时居留意图支持材料放在一起核对。", "把延期說明、資金證明與臨時居留意圖支持材料放在一起核對。"),
      pickLocale(language, "如果这个问题会影响证据或交接就绪度，请把它转成工作台清单动作。", "如果這個問題會影響證據或交接就緒度，請把它轉成工作台清單動作。")
    ];
  }

  return [
    pickLocale(language, "先确认当前学签到期日与学校脉络，再依赖这条答案推进。", "先確認目前學簽到期日與學校脈絡，再依賴這條答案推進。"),
    pickLocale(language, "把在学证明、学习进度、资金证明与延期说明一起核对。", "把在學證明、學習進度、資金證明與延期說明一起核對。"),
    pickLocale(language, "如果这个问题会影响证据或交接就绪度，请把它转成工作台清单动作。", "如果這個問題會影響證據或交接就緒度，請把它轉成工作台清單動作。")
  ];
}

function buildDeterministicTrackerActions(
  input: CaseQuestionAiInput,
  missingItems: string[],
  riskFlags: CaseRiskFlag[],
  nextSteps: string[]
): CaseQuestionTrackerAction[] {
  const missingActions = missingItems.slice(0, 3).map((item) => ({
    label: pickLocale(input.language, `收集 ${item}`, `收集 ${item}`),
    detail: pickLocale(
      input.language,
      `把 ${item} 补充到工作台或正确标记，让下一轮审查可以直接使用。`,
      `把 ${item} 補充到工作台或正確標記，讓下一輪審查可以直接使用。`
    ),
    priority: "high" as const,
    actionType: "collect-material" as const,
    documentKey: findDocumentKeyByLabel(input.caseContext?.documents ?? [], item)
  }));
  const riskActions = riskFlags.slice(0, 2).map((item) => ({
    label: pickLocale(input.language, `处理 ${item.label}`, `處理 ${item.label}`),
    detail: item.detail,
    priority: item.severity,
    actionType: "review-risk" as const,
    documentKey: ""
  }));
  const defaultActions: CaseQuestionTrackerAction[] = [
    {
      label: pickLocale(input.language, "生成或刷新清单", "生成或刷新清單"),
      detail: pickLocale(
        input.language,
        "把这个问题转成案件工作台清单，让材料与下一步动作持续挂在案件上。",
        "把這個問題轉成案件工作台清單，讓材料與下一步動作持續掛在案件上。"
      ),
      priority: "medium",
      actionType: "generate-checklist",
      documentKey: ""
    },
    {
      label: pickLocale(input.language, "继续在工作台处理", "繼續在工作台處理"),
      detail:
        nextSteps[0] ??
        pickLocale(
          input.language,
          "打开案件工作台，并把下一条证据动作明确显示出来。",
          "打開案件工作台，並把下一條證據動作明確顯示出來。"
        ),
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
  documents: CaseMaterialSnapshot[] | null,
  language: AppLocale = defaultLocale
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
          : matchedDocument
            ? chooseRecommendedMaterialStatus(matchedDocument, readStringArray(item.issueFlags))
            : suggestedStatus;
      const interpretationNote = readTrimmedString(item.interpretationNote);
      const issueFlags = dedupeStrings(readStringArray(item.issueFlags)).slice(0, 4);
      const possibleIssues =
        dedupeStrings(readStringArray(item.possibleIssues)).slice(0, 5).length > 0
          ? dedupeStrings(readStringArray(item.possibleIssues)).slice(0, 5)
          : issueFlags.map((flag) => formatMaterialIssueFlag(flag, language)).slice(0, 5);
      const likelySupportingDocsNeeded = readStringArray(item.likelySupportingDocsNeeded).slice(0, 5);
      const suggestedNextAction =
        readTrimmedString(item.suggestedNextAction) ||
        (label
          ? pickLocale(
              language,
              `请对照已保存的材料状态复核 ${label}，并在发生有意义变更后重新生成审查。`,
              `請對照已儲存的材料狀態複核 ${label}，並在發生有意義變更後重新生成審查。`
            )
          : null);
      const reasoningSummary =
        readTrimmedString(item.reasoningSummary) ||
        (possibleIssues.length > 0
          ? pickLocale(language, "材料元数据中存在工作流问题信号。", "材料中介資料中存在工作流程問題訊號。")
          : pickLocale(language, "材料元数据已按清单项完成分类。", "材料中介資料已按清單項完成分類。"));

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
          issueFlags,
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

function parseReviewDeltaOutput(value: unknown, language: AppLocale = defaultLocale): CaseReviewDelta | null {
  if (!isRecord(value)) {
    return null;
  }

  const improvedAreas = readStringArray(value.improvedAreas).slice(0, 5);
  const remainingGaps = readStringArray(value.remainingGaps).slice(0, 5);
  const newRisks = readStringArray(value.newRisks).slice(0, 5);
  const removedRisks = readStringArray(value.removedRisks).slice(0, 5);
  const normalizedRemovedRisks =
    removedRisks.length > 0
      ? removedRisks
      : [pickLocale(language, "这个审查变化中没有可用的已移除风险数据。", "這個審查變化中沒有可用的已移除風險資料。")];
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

function buildIntakeNormalizationSnapshot(
  useCaseSlug: SupportedUseCaseSlug,
  intake: CaseIntakeValues,
  language: AppLocale
): Json {
  return {
    language,
    useCaseSlug,
    intake
  };
}

function buildMaterialInterpretationSnapshot(
  useCaseSlug: SupportedUseCaseSlug,
  documents: CaseMaterialSnapshot[],
  language: AppLocale
): Json {
  return {
    language,
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
    language: input.language,
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
    language: input.language,
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
    language: input.language,
    useCaseSlug: input.useCaseSlug,
    previousReview: summarizeReviewForPrompt(input.previousReview),
    latestReview: summarizeReviewForPrompt(input.latestReview)
  };
}

function buildHandoffIntelligenceSnapshot(input: CaseHandoffIntelligenceInput): Json {
  return {
    language: input.language,
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
    language: input.language,
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

function buildDeterministicExtractedFacts(intake: CaseIntakeValues, language: AppLocale = defaultLocale) {
  return [
    intake.currentPermitExpiry
      ? {
          label: pickLocale(language, "当前身份到期日", "目前身分到期日"),
          value: intake.currentPermitExpiry,
          confidence: 1
        }
      : null,
    intake.supportEntityName.trim()
      ? {
          label: pickLocale(language, "支持主体", "支援主體"),
          value: intake.supportEntityName.trim(),
          confidence: 0.9
        }
      : null,
    intake.applicationReason
      ? {
          label: pickLocale(language, "申请原因", "申請原因"),
          value: intake.applicationReason,
          confidence: 0.85
        }
      : null
  ].flatMap((item) => (item ? [item] : []));
}

function buildDeterministicReviewNotes(
  useCaseSlug: SupportedUseCaseSlug,
  intake: CaseIntakeValues,
  language: AppLocale = defaultLocale
) {
  const notes = intake.notes.trim();
  const items = [
    notes
      ? pickLocale(
          language,
          `已保留自由备注供后续审查使用：${notes.slice(0, 220)}${notes.length > 220 ? "..." : ""}`,
          `已保留自由備註供後續審查使用：${notes.slice(0, 220)}${notes.length > 220 ? "..." : ""}`
        )
      : "",
    useCaseSlug === "visitor-record" && intake.scenarioProgressStatus === "weak"
      ? pickLocale(language, "临时居留意图说明需要重点复核。", "臨時居留意圖說明需要重點複核。")
      : "",
    useCaseSlug === "study-permit-extension" && intake.scenarioProgressStatus === "at-risk"
      ? pickLocale(language, "学业或学费相关问题需要重点复核。", "學業或學費相關問題需要重點複核。")
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
      possibleIssueCount: 0,
      likelySupportingDocSuggestionCount: 0,
      suggestedStatusChangesCount: 0
    };
  }

  return {
    issueFlagCount: output.items.reduce((total, item) => total + item.issueFlags.length, 0),
    possibleIssueCount: output.items.reduce((total, item) => total + item.possibleIssues.length, 0),
    likelySupportingDocSuggestionCount: output.items.reduce(
      (total, item) => total + item.likelySupportingDocsNeeded.length,
      0
    ),
    suggestedStatusChangesCount: output.items.filter((item) => item.recommendedMaterialStatus !== item.suggestedStatus).length,
    recommendedStatusReviewCount: output.items.filter((item) => item.possibleIssues.length > 0).length
  };
}
