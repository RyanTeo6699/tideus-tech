import type { Json } from "@/lib/database.types";
import {
  parseCaseQuestionAnswerOutput,
  type CaseAiEnvelope,
  type CaseQuestionAnswer
} from "@/lib/case-ai";
import { defaultLocale, type AppLocale } from "@/lib/i18n/config";
import { pickLocale } from "@/lib/i18n/workspace";
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

export function parseCaseQuestionRequest(
  value: unknown,
  locale: AppLocale = defaultLocale
): ParseResult<CaseQuestionRequest> {
  const body = readRecord(value);

  if (!body) {
    return {
      success: false,
      message: pickLocale(locale, "提问内容无效。", "提問內容無效。")
    };
  }

  const useCase = typeof body.useCase === "string" ? body.useCase : "";

  if (!isSupportedUseCase(useCase)) {
    return {
      success: false,
      message: pickLocale(locale, "请选择访客记录或学签延期。", "請選擇訪客紀錄或學簽延期。")
    };
  }

  const question = typeof body.question === "string" ? body.question.trim() : "";

  if (question.length < 8) {
    return {
      success: false,
      message: pickLocale(locale, "请提出更具体的案件准备问题。", "請提出更具體的案件準備問題。")
    };
  }

  if (question.length > 800) {
    return {
      success: false,
      message: pickLocale(locale, "问题请控制在 800 个字符以内。", "問題請控制在 800 個字元以內。")
    };
  }

  return {
    success: true,
    data: {
      useCase,
      question
    }
  };
}

export function parseCaseQuestionSaveRequest(
  value: unknown,
  locale: AppLocale = defaultLocale
): ParseResult<CaseQuestionSaveRequest> {
  const parsed = parseCaseQuestionRequest(value, locale);

  if (!parsed.success) {
    return parsed;
  }

  const body = readRecord(value);
  const action = typeof body?.action === "string" && isCaseQuestionSaveAction(body.action) ? body.action : null;
  const answer = parseCaseQuestionAnswerOutput(body?.answer);

  if (!action) {
    return {
      success: false,
      message: pickLocale(locale, "请选择一个工作台动作。", "請選擇一個工作台動作。")
    };
  }

  if (!answer) {
    return {
      success: false,
      message: pickLocale(locale, "该答案的结构无效，暂时无法保存到工作台。", "該答案的結構無效，暫時無法儲存到工作台。")
    };
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

export function buildQuestionSeedIntake(
  useCaseSlug: SupportedUseCaseSlug,
  question: string,
  locale: AppLocale = defaultLocale
): CaseIntakeValues {
  const intake = getEmptyCaseIntakeValues();

  return {
    ...intake,
    title: buildQuestionCaseTitle(useCaseSlug, question, locale),
    currentStatus: useCaseSlug === "visitor-record" ? "visitor" : "student",
    notes: question
  };
}

export function buildQuestionCaseTitle(
  useCaseSlug: SupportedUseCaseSlug,
  question: string,
  locale: AppLocale = defaultLocale
) {
  const useCase = getUseCaseDefinition(useCaseSlug, locale);
  const cleanQuestion = question.replace(/\s+/g, " ").trim();
  const shortQuestion = cleanQuestion.length > 56 ? `${cleanQuestion.slice(0, 56).trim()}...` : cleanQuestion;

  return pickLocale(
    locale,
    `${useCase?.shortTitle ?? "案件"} 跟踪: ${shortQuestion}`,
    `${useCase?.shortTitle ?? "案件"} 追蹤: ${shortQuestion}`
  );
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
