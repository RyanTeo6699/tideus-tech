import { NextResponse } from "next/server";

import { answerCaseQuestionWithAi, normalizeCaseIntakeWithAi } from "@/lib/case-ai";
import { parseCaseQuestionRequest, buildQuestionSeedIntake } from "@/lib/case-question";
import { buildKnowledgeContext, summarizeKnowledgeContext } from "@/lib/knowledge/adapter";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = parseCaseQuestionRequest(body);

  if (!parsed.success) {
    return NextResponse.json({ message: parsed.message }, { status: 400 });
  }

  const intake = buildQuestionSeedIntake(parsed.data.useCase, parsed.data.question);
  const intakeNormalization = await normalizeCaseIntakeWithAi(parsed.data.useCase, intake);
  const knowledgeContext = buildKnowledgeContext({
    useCaseSlug: parsed.data.useCase,
    intake,
    documents: [],
    intakeNormalization: intakeNormalization.output,
    materialInterpretation: null
  });
  const answerTrace = await answerCaseQuestionWithAi({
    useCaseSlug: parsed.data.useCase,
    question: parsed.data.question,
    knowledgeContext
  });

  return NextResponse.json({
    answer: answerTrace.output,
    trace: {
      source: answerTrace.source,
      promptVersion: answerTrace.promptVersion,
      model: answerTrace.model,
      generatedAt: answerTrace.generatedAt,
      fallbackReason: answerTrace.fallbackReason,
      knowledge: summarizeKnowledgeContext(knowledgeContext),
      intakeNormalization: {
        source: intakeNormalization.source,
        promptVersion: intakeNormalization.promptVersion,
        fallbackReason: intakeNormalization.fallbackReason
      }
    }
  });
}
