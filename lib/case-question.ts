import type { Json } from "@/lib/database.types";
import {
  parseCaseQuestionAnswerOutput,
  type CaseAiEnvelope,
  type CaseQuestionAnswer
} from "@/lib/case-ai";
import {
  getEmptyCaseIntakeValues,
  getUseCaseDefinition,
  isSupportedUseCase,
  type CaseIntakeValues,
  type SupportedUseCaseSlug
} from "@/lib/case-workflows";

export const caseQuestionSaveActions = [
  "save-to-workspace",
  "generate-checklist",
  "start-tracking",
  "continue-in-case-workspace"
] as const;

export type CaseQuestionSaveAction = (typeof caseQuestionSaveActions)[number];

export type CaseQuestionRequest = {
  useCase: SupportedUseCaseSlug;
  question: string;
};

export type CaseQuestionSaveRequest = CaseQuestionRequest & {
  action: CaseQuestionSaveAction;
  answer: CaseQuestionAnswer;
};

type ParseSuccess<T> = {
  success: true;
  data: T;
};

type ParseFailure = {
  success: false;
  message: string;
};

type ParseResult<T> = ParseSuccess<T> | ParseFailure;

export function parseCaseQuestionRequest(value: unknown): ParseResult<CaseQuestionRequest> {
  const body = readRecord(value);

  if (!body) {
    return { success: false, message: "Invalid question payload." };
  }

  const useCase = typeof body.useCase === "string" ? body.useCase : "";

  if (!isSupportedUseCase(useCase)) {
    return { success: false, message: "Choose Visitor Record or Study Permit Extension." };
  }

  const question = typeof body.question === "string" ? body.question.trim() : "";

  if (question.length < 8) {
    return { success: false, message: "Ask a more specific case-prep question." };
  }

  if (question.length > 800) {
    return { success: false, message: "Keep the question under 800 characters." };
  }

  return {
    success: true,
    data: {
      useCase,
      question
    }
  };
}

export function parseCaseQuestionSaveRequest(value: unknown): ParseResult<CaseQuestionSaveRequest> {
  const parsed = parseCaseQuestionRequest(value);

  if (!parsed.success) {
    return parsed;
  }

  const body = readRecord(value);
  const action = typeof body?.action === "string" && isCaseQuestionSaveAction(body.action) ? body.action : null;
  const answer = parseCaseQuestionAnswerOutput(body?.answer);

  if (!action) {
    return { success: false, message: "Choose a workspace action." };
  }

  if (!answer) {
    return { success: false, message: "The answer could not be saved because it is not structured correctly." };
  }

  return {
    success: true,
    data: {
      ...parsed.data,
      action,
      answer
    }
  };
}

export function buildQuestionSeedIntake(useCaseSlug: SupportedUseCaseSlug, question: string): CaseIntakeValues {
  const intake = getEmptyCaseIntakeValues();

  return {
    ...intake,
    title: buildQuestionCaseTitle(useCaseSlug, question),
    currentStatus: useCaseSlug === "visitor-record" ? "visitor" : "student",
    notes: question
  };
}

export function buildQuestionCaseTitle(useCaseSlug: SupportedUseCaseSlug, question: string) {
  const useCase = getUseCaseDefinition(useCaseSlug);
  const cleanQuestion = question.replace(/\s+/g, " ").trim();
  const shortQuestion = cleanQuestion.length > 56 ? `${cleanQuestion.slice(0, 56).trim()}...` : cleanQuestion;

  return `${useCase?.shortTitle ?? "Case"} tracker: ${shortQuestion}`;
}

export function buildQuestionTraceMetadata({
  action,
  question,
  answerTrace
}: {
  action: CaseQuestionSaveAction;
  question: string;
  answerTrace: CaseAiEnvelope<CaseQuestionAnswer>;
}): Json {
  return {
    action,
    question,
    answer: answerTrace.output as Json,
    trace: {
      source: answerTrace.source,
      promptVersion: answerTrace.promptVersion,
      model: answerTrace.model,
      generatedAt: answerTrace.generatedAt,
      fallbackReason: answerTrace.fallbackReason
    }
  };
}

export function appendQuestionTrace(metadata: Json | null | undefined, trace: Json): Json {
  const record = readJsonRecord(metadata);
  const aiWorkflow = readJsonRecord(record.aiWorkflow);
  const existingTraces = readJsonArray(aiWorkflow.caseQuestionAnswers);

  return {
    ...record,
    aiWorkflow: {
      ...aiWorkflow,
      caseQuestionAnswers: [trace, ...existingTraces].slice(0, 8)
    }
  };
}

function isCaseQuestionSaveAction(value: string): value is CaseQuestionSaveAction {
  return caseQuestionSaveActions.includes(value as CaseQuestionSaveAction);
}

function readRecord(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function readJsonRecord(value: Json | null | undefined): Record<string, Json> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, Json>;
}

function readJsonArray(value: Json | undefined): Json[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value;
}
