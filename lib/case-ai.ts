import OpenAI from "openai";

import type { Json, Tables } from "@/lib/database.types";
import type { CaseReviewResult, CaseRiskFlag } from "@/lib/case-review";
import type { CaseKnowledgeContext } from "@/lib/case-knowledge";
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
  confidence: number;
  interpretationNote: string;
};

export type CaseMaterialInterpretationOutput = {
  summary: string;
  items: CaseMaterialInterpretationItem[];
};

export type CaseReviewDelta = {
  improvedAreas: string[];
  remainingGaps: string[];
  newRisks: string[];
  priorityActions: string[];
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

const DEFAULT_OPENAI_MODEL = "gpt-5-mini";
const OPENAI_TIMEOUT_MS = 12_000;

export const caseAiPromptVersions = {
  intakeNormalization: "case-intake-normalization-v1",
  materialInterpretation: "case-material-interpretation-v1",
  reviewEnrichment: "case-review-enrichment-v2",
  reviewDelta: "case-review-delta-v1"
} as const;

const readinessStatuses = ["not-ready", "needs-attention", "almost-ready", "review-ready"] as const;
const documentStatuses = ["missing", "collecting", "needs-refresh", "ready", "not-applicable"] as const;
const riskSeverities = ["low", "medium", "high"] as const;

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
            confidence: { type: "number" },
            interpretationNote: { type: "string" }
          },
          required: [
            "documentId",
            "documentKey",
            "label",
            "likelyDocumentType",
            "suggestedStatus",
            "issueFlags",
            "confidence",
            "interpretationNote"
          ],
          additionalProperties: false
        }
      }
    },
    required: ["summary", "items"],
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
      "nextSteps"
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
      priorityActions: {
        type: "array",
        maxItems: 5,
        items: { type: "string" }
      }
    },
    required: ["improvedAreas", "remainingGaps", "newRisks", "priorityActions"],
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
    "Return workflow-oriented classification signals only: likely document type, issue flags, suggested status, confidence, and a short note.",
    "Do not change the user's case. Do not provide legal advice.",
    "",
    `Use case: ${useCase?.shortTitle ?? useCaseSlug}`,
    "Material metadata:",
    JSON.stringify(buildMaterialInterpretationSnapshot(useCaseSlug, documents))
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
    const issueFlags = dedupeStrings(
      [
        item.status === "missing" && item.required ? "required-material-missing" : "",
        item.status === "needs-refresh" ? "refresh-needed" : "",
        item.status === "collecting" ? "still-being-collected" : "",
        notesContain(noteText, ["expired", "old", "outdated"]) ? "possibly-stale" : "",
        notesContain(noteText, ["unclear", "incomplete", "missing"]) ? "note-indicates-gap" : ""
      ].filter(Boolean)
    );

    return {
      documentId: item.id,
      documentKey: item.documentKey,
      label: item.label,
      likelyDocumentType: item.label,
      suggestedStatus: item.status,
      issueFlags,
      confidence: issueFlags.length > 0 ? 0.68 : 0.55,
      interpretationNote:
        issueFlags.length > 0
          ? `${item.label} has workflow signals that should stay visible in the next review pass.`
          : `${item.label} is classified from the expected checklist label and current material metadata.`
    };
  });

  return {
    summary:
      items.some((item) => item.issueFlags.length > 0)
        ? "Material metadata includes issue signals that should inform the next structured review."
        : "Material metadata was classified against the expected checklist without additional issue signals.",
    items
  };
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
    priorityActions: latestReview.nextSteps.slice(0, 5)
  };
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
      const interpretationNote = readTrimmedString(item.interpretationNote);

      if (!documentId || (documentMap && !matchedDocument) || !documentKey || !label || !likelyDocumentType || !suggestedStatus || !interpretationNote) {
        return [];
      }

      return [
        {
          documentId,
          documentKey,
          label,
          likelyDocumentType,
          suggestedStatus,
          issueFlags: readStringArray(item.issueFlags).slice(0, 4),
          confidence: clampConfidence(typeof item.confidence === "number" ? item.confidence : 0.5),
          interpretationNote
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
    nextSteps
  };
}

function parseReviewDeltaOutput(value: unknown): CaseReviewDelta | null {
  if (!isRecord(value)) {
    return null;
  }

  const improvedAreas = readStringArray(value.improvedAreas).slice(0, 5);
  const remainingGaps = readStringArray(value.remainingGaps).slice(0, 5);
  const newRisks = readStringArray(value.newRisks).slice(0, 5);
  const priorityActions = readStringArray(value.priorityActions).slice(0, 5);

  if (improvedAreas.length === 0 || remainingGaps.length === 0 || newRisks.length === 0 || priorityActions.length === 0) {
    return null;
  }

  return {
    improvedAreas,
    remainingGaps,
    newRisks,
    priorityActions
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
    nextSteps: dedupeStrings([...aiReview.nextSteps, ...baseline.nextSteps]).slice(0, 6)
  };
}

function mergeReviewDeltaOutputs(baseline: CaseReviewDelta, aiDelta: CaseReviewDelta): CaseReviewDelta {
  return {
    improvedAreas: dedupeStrings([...aiDelta.improvedAreas, ...baseline.improvedAreas]).slice(0, 5),
    remainingGaps: dedupeStrings([...aiDelta.remainingGaps, ...baseline.remainingGaps]).slice(0, 5),
    newRisks: dedupeStrings([...baseline.newRisks, ...aiDelta.newRisks]).slice(0, 5),
    priorityActions: dedupeStrings([...aiDelta.priorityActions, ...baseline.priorityActions]).slice(0, 5)
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
    nextSteps: review.nextSteps
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

const readinessRank: Record<CaseReadinessStatus, number> = {
  "not-ready": 0,
  "needs-attention": 1,
  "almost-ready": 2,
  "review-ready": 3
};

function chooseSaferReadinessStatus(baseline: CaseReadinessStatus, candidate: CaseReadinessStatus) {
  return readinessRank[candidate] < readinessRank[baseline] ? candidate : baseline;
}

function dedupeStrings(items: string[]) {
  return items.map((item) => item.trim()).filter(Boolean).filter((item, index, array) => array.indexOf(item) === index);
}

function dedupeRiskFlags(items: CaseRiskFlag[]) {
  return items.filter((item, index) => items.findIndex((entry) => entry.label === item.label) === index);
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
    issueFlagCount: output.items.reduce((total, item) => total + item.issueFlags.length, 0),
    suggestedStatusChangesCount: output.items.filter((item) => item.issueFlags.length > 0).length
  };
}
