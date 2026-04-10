import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import type { Json } from "@/lib/database.types";
import {
  buildCaseMaterialSnapshots,
  buildCaseMaterialWorkspaceActionWithAi,
  parseStoredIntakeNormalization,
  parseStoredMaterialInterpretation,
  type CaseMaterialWorkspaceActionType
} from "@/lib/case-ai";
import { recordCaseEvent } from "@/lib/case-events";
import { normalizeCaseStatus } from "@/lib/case-state";
import { getCaseReviewSnapshot, readCaseIntake } from "@/lib/cases";
import type { SupportedUseCaseSlug } from "@/lib/case-workflows";
import { buildKnowledgeContext, summarizeKnowledgeContext } from "@/lib/knowledge/adapter";
import { createClient } from "@/lib/supabase/server";

type MaterialActionRouteProps = {
  params: Promise<{
    caseId: string;
  }>;
};

const materialActionTypes = [
  "explain-missing",
  "explain-review-needed",
  "suggest-next-action",
  "suggest-regenerate-review",
  "suggest-supporting-docs"
] as const;

export async function POST(request: Request, { params }: MaterialActionRouteProps) {
  const { caseId } = await params;
  const body = await request.json().catch(() => null);
  const parsed = parseMaterialActionRequest(body);

  if (!parsed.success) {
    return NextResponse.json({ message: parsed.message }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ message: "Sign in to run a material action." }, { status: 401 });
  }

  const { data: caseRecord, error: caseError } = await supabase
    .from("cases")
    .select("*")
    .eq("user_id", user.id)
    .eq("id", caseId)
    .maybeSingle();

  if (caseError) {
    return NextResponse.json({ message: caseError.message }, { status: 500 });
  }

  if (!caseRecord) {
    return NextResponse.json({ message: "The selected case could not be found." }, { status: 404 });
  }

  const currentStatus = normalizeCaseStatus(caseRecord.status);

  if (!currentStatus) {
    return NextResponse.json({ message: "The case status could not be resolved." }, { status: 500 });
  }

  const [{ data: documents, error: documentsError }, { data: latestReviewRows, error: reviewError }] = await Promise.all([
    supabase.from("case_documents").select("*").eq("case_id", caseRecord.id).order("position", { ascending: true }),
    supabase.from("case_review_versions").select("*").eq("case_id", caseRecord.id).order("version_number", { ascending: false }).limit(1)
  ]);

  if (documentsError || reviewError) {
    return NextResponse.json(
      {
        message: documentsError?.message || reviewError?.message || "Unable to load the material action context."
      },
      { status: 500 }
    );
  }

  const materialSnapshots = buildCaseMaterialSnapshots(documents ?? []);
  const selectedDocument = materialSnapshots.find((item) => item.id === parsed.data.documentId);

  if (!selectedDocument) {
    return NextResponse.json({ message: "The selected material could not be found for this case." }, { status: 404 });
  }

  const intake = readCaseIntake(caseRecord.intake_answers);
  const intakeNormalization = parseStoredIntakeNormalization(caseRecord.metadata);
  const materialInterpretation = parseStoredMaterialInterpretation(caseRecord.metadata);
  const latestReview = getCaseReviewSnapshot(latestReviewRows?.[0] ?? null);
  const knowledgeContext = buildKnowledgeContext({
    useCaseSlug: caseRecord.use_case_slug as SupportedUseCaseSlug,
    intake,
    documents: materialSnapshots,
    intakeNormalization,
    materialInterpretation
  });
  const actionTrace = await buildCaseMaterialWorkspaceActionWithAi({
    useCaseSlug: caseRecord.use_case_slug as SupportedUseCaseSlug,
    actionType: parsed.data.actionType,
    document: selectedDocument,
    documents: materialSnapshots,
    latestReview,
    knowledgeContext,
    materialInterpretation
  });
  const materialActionTrace: Json = {
    sourceSurface: "case-workspace-material-action",
    actionType: parsed.data.actionType,
    documentId: selectedDocument.id,
    documentKey: selectedDocument.documentKey,
    output: actionTrace.output as Json,
    trace: {
      source: actionTrace.source,
      promptVersion: actionTrace.promptVersion,
      model: actionTrace.model,
      generatedAt: actionTrace.generatedAt,
      fallbackReason: actionTrace.fallbackReason,
      inputSnapshot: actionTrace.inputSnapshot
    },
    knowledge: summarizeKnowledgeContext(knowledgeContext) as Json
  };
  const { error: updateError } = await supabase
    .from("cases")
    .update({
      metadata: appendMaterialActionTrace(caseRecord.metadata, materialActionTrace)
    })
    .eq("user_id", user.id)
    .eq("id", caseRecord.id);

  if (updateError) {
    return NextResponse.json({ message: updateError.message }, { status: 500 });
  }

  const eventError = await recordCaseEvent(supabase, {
    caseId: caseRecord.id,
    userId: user.id,
    eventType: "material_action_requested",
    status: currentStatus,
    metadata: {
      sourceSurface: "case-workspace-material-action",
      useCaseSlug: caseRecord.use_case_slug,
      actionType: parsed.data.actionType,
      documentId: selectedDocument.id,
      documentKey: selectedDocument.documentKey,
      documentStatus: selectedDocument.status,
      actionSource: actionTrace.source,
      actionPromptVersion: actionTrace.promptVersion,
      possibleIssueCount: actionTrace.output.possibleIssues.length,
      likelySupportingDocSuggestionCount: actionTrace.output.likelySupportingDocsNeeded.length,
      regenerateReviewRecommendation: actionTrace.output.regenerateReviewRecommendation,
      readinessImpact: actionTrace.output.readinessImpact,
      knowledgeSourceVersion: knowledgeContext.sourceVersion,
      knowledgeScenarioTag: knowledgeContext.scenarioTag
    }
  });

  if (eventError) {
    console.error("Unable to record material action event", eventError);
  }

  revalidatePath(`/dashboard/cases/${caseRecord.id}`);

  return NextResponse.json({
    action: actionTrace.output,
    trace: {
      source: actionTrace.source,
      promptVersion: actionTrace.promptVersion,
      model: actionTrace.model,
      generatedAt: actionTrace.generatedAt,
      fallbackReason: actionTrace.fallbackReason,
      knowledge: summarizeKnowledgeContext(knowledgeContext)
    }
  });
}

function parseMaterialActionRequest(value: unknown):
  | {
      success: true;
      data: {
        documentId: string;
        actionType: CaseMaterialWorkspaceActionType;
      };
    }
  | {
      success: false;
      message: string;
    } {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { success: false, message: "Invalid material action payload." };
  }

  const record = value as Record<string, unknown>;
  const documentId = typeof record.documentId === "string" ? record.documentId.trim() : "";
  const actionType = typeof record.actionType === "string" && isMaterialActionType(record.actionType) ? record.actionType : null;

  if (!documentId) {
    return { success: false, message: "Choose a material to inspect." };
  }

  if (!actionType) {
    return { success: false, message: "Choose a supported material action." };
  }

  return {
    success: true,
    data: {
      documentId,
      actionType
    }
  };
}

function isMaterialActionType(value: string): value is CaseMaterialWorkspaceActionType {
  return materialActionTypes.includes(value as CaseMaterialWorkspaceActionType);
}

function appendMaterialActionTrace(metadata: Json | null | undefined, trace: Json): Json {
  const record = readJsonRecord(metadata);
  const aiWorkflow = readJsonRecord(record.aiWorkflow);
  const existingTraces = readJsonArray(aiWorkflow.materialWorkspaceActions);

  return {
    ...record,
    aiWorkflow: {
      ...aiWorkflow,
      materialWorkspaceActions: [trace, ...existingTraces].slice(0, 12)
    }
  };
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
