import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import type { Json } from "@/lib/database.types";
import {
  buildCaseMaterialSnapshots,
  interpretCaseMaterialsWithAi,
  summarizeMaterialInterpretationIssues
} from "@/lib/case-ai";
import { recordCaseEvent } from "@/lib/case-events";
import { parseCaseDocumentsInput } from "@/lib/case-review";
import { appendCaseStatusHistory, getNextCaseStatus, normalizeCaseStatus } from "@/lib/case-state";
import type { SupportedUseCaseSlug } from "@/lib/case-workflows";
import { createClient } from "@/lib/supabase/server";

type CaseDocumentsRouteProps = {
  params: Promise<{
    caseId: string;
  }>;
};

export async function PATCH(request: Request, { params }: CaseDocumentsRouteProps) {
  const { caseId } = await params;
  const body = await request.json().catch(() => null);
  const parsed = parseCaseDocumentsInput(body);

  if (!parsed.success) {
    return NextResponse.json({ message: parsed.message }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ message: "Sign in to update case materials." }, { status: 401 });
  }

  const { data: caseRecord, error: caseError } = await supabase
    .from("cases")
    .select("id, status, status_history, use_case_slug, metadata")
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

  const { data: existingDocuments, error: existingDocumentsError } = await supabase
    .from("case_documents")
    .select("id, document_key, label, description, required, status, material_reference, notes, file_name, mime_type")
    .eq("case_id", caseRecord.id);

  if (existingDocumentsError) {
    return NextResponse.json({ message: existingDocumentsError.message }, { status: 500 });
  }

  const existingDocumentMap = new Map((existingDocuments ?? []).map((item) => [item.id, item]));
  const validIds = new Set(existingDocumentMap.keys());

  if (parsed.data.documents.some((item) => !validIds.has(item.id))) {
    return NextResponse.json({ message: "One or more material rows could not be matched to the case." }, { status: 400 });
  }

  const changedMaterialsCount = parsed.data.documents.filter((item) => {
    const existing = existingDocumentMap.get(item.id);

    if (!existing) {
      return false;
    }

    return (
      existing.status !== item.status ||
      (existing.material_reference ?? "") !== (item.materialReference || "") ||
      (existing.notes ?? "") !== (item.notes || "")
    );
  }).length;
  const changedRequiredMaterialsCount = parsed.data.documents.filter((item) => {
    const existing = existingDocumentMap.get(item.id);

    if (!existing?.required) {
      return false;
    }

    return (
      existing.status !== item.status ||
      (existing.material_reference ?? "") !== (item.materialReference || "") ||
      (existing.notes ?? "") !== (item.notes || "")
    );
  }).length;

  for (const item of parsed.data.documents) {
    const { error } = await supabase
      .from("case_documents")
      .update({
        status: item.status,
        material_reference: item.materialReference || null,
        notes: item.notes || null
      })
      .eq("case_id", caseRecord.id)
      .eq("id", item.id);

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 500 });
    }
  }

  const nextStatus = getNextCaseStatus(currentStatus, "materials-updated");
  const readyCount = parsed.data.documents.filter((item) => item.status === "ready" || item.status === "not-applicable").length;
  const collectingCount = parsed.data.documents.filter((item) => item.status === "collecting").length;
  const needsRefreshCount = parsed.data.documents.filter((item) => item.status === "needs-refresh").length;
  const missingCount = parsed.data.documents.filter((item) => item.status === "missing").length;
  const requiredReadyCount = parsed.data.documents.filter((item) => {
    const existing = existingDocumentMap.get(item.id);
    return existing?.required && (item.status === "ready" || item.status === "not-applicable");
  }).length;
  const requiredMissingCount = parsed.data.documents.filter((item) => {
    const existing = existingDocumentMap.get(item.id);
    return existing?.required && item.status === "missing";
  }).length;
  const requiredActionCount = parsed.data.documents.filter((item) => {
    const existing = existingDocumentMap.get(item.id);
    return existing?.required && item.status !== "ready" && item.status !== "not-applicable";
  }).length;
  const proposedDocuments = parsed.data.documents.flatMap((item) => {
    const existing = existingDocumentMap.get(item.id);

    if (!existing) {
      return [];
    }

    return [
      {
        ...existing,
        status: item.status,
        material_reference: item.materialReference || null,
        notes: item.notes || null
      }
    ];
  });
  const materialInterpretation = await interpretCaseMaterialsWithAi(
    caseRecord.use_case_slug as SupportedUseCaseSlug,
    buildCaseMaterialSnapshots(proposedDocuments)
  );
  const materialInterpretationSummary = summarizeMaterialInterpretationIssues(materialInterpretation.output);
  const materialPossibleIssueCount = materialInterpretationSummary.possibleIssueCount ?? 0;
  const reviewRegenerationRecommended = shouldRecommendReviewRegeneration({
    currentStatus,
    changedMaterialsCount,
    changedRequiredMaterialsCount,
    requiredActionCount,
    materialIssueCount: materialPossibleIssueCount
  });
  const likelyReadinessImpact = buildLikelyReadinessImpact({
    changedMaterialsCount,
    changedRequiredMaterialsCount,
    requiredReadyCount,
    requiredMissingCount,
    requiredActionCount,
    reviewRegenerationRecommended
  });
  const materialImpact = {
    changedCount: changedMaterialsCount,
    changedRequiredCount: changedRequiredMaterialsCount,
    requiredReadyCount,
    requiredMissingCount,
    requiredActionCount,
    possibleIssueCount: materialPossibleIssueCount,
    likelySupportingDocSuggestionCount: materialInterpretationSummary.likelySupportingDocSuggestionCount,
    reviewRegenerationRecommended,
    likelyReadinessImpact,
    suggestedNextAction: reviewRegenerationRecommended
      ? "Regenerate the review after saving these material changes so readiness, missing items, and risk flags reflect the current package."
      : "Materials are saved. Continue collecting unresolved items before regenerating review."
  };
  const nextCaseMetadata = {
    ...readMetadataRecord(caseRecord.metadata),
    aiWorkflow: {
      ...readMetadataRecord(readMetadataRecord(caseRecord.metadata).aiWorkflow),
      materialInterpretation: materialInterpretation as Json
    }
  };

  const { error: updateCaseError } = await supabase
    .from("cases")
    .update({
      status: nextStatus,
      status_history: appendCaseStatusHistory(caseRecord.status_history, nextStatus),
      metadata: nextCaseMetadata
    })
    .eq("user_id", user.id)
    .eq("id", caseRecord.id);

  if (updateCaseError) {
    return NextResponse.json({ message: updateCaseError.message }, { status: 500 });
  }

  const eventError = await recordCaseEvent(supabase, {
    caseId: caseRecord.id,
    userId: user.id,
    eventType: "materials_updated",
    status: nextStatus,
    fromStatus: currentStatus,
    toStatus: nextStatus,
    metadata: {
      useCaseSlug: caseRecord.use_case_slug,
      documentCount: parsed.data.documents.length,
      changedCount: changedMaterialsCount,
      changedMaterialsCount,
      changedRequiredMaterialsCount,
      readyCount,
      requiredReadyCount,
      collectingCount,
      needsRefreshCount,
      missingCount,
      requiredMissingCount,
      requiredActionCount,
      materialInterpretationSource: materialInterpretation.source,
      materialInterpretationPromptVersion: materialInterpretation.promptVersion,
      materialIssueFlagCount: materialInterpretationSummary.issueFlagCount,
      materialPossibleIssueCount,
      materialLikelySupportingDocSuggestionCount: materialInterpretationSummary.likelySupportingDocSuggestionCount,
      materialSuggestedStatusChangesCount: materialInterpretationSummary.suggestedStatusChangesCount,
      materialRecommendedStatusReviewCount: materialInterpretationSummary.recommendedStatusReviewCount,
      reviewRegenerationRecommended,
      likelyReadinessImpact
    }
  });

  if (eventError) {
    console.error("Unable to record case materials event", eventError);
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/cases");
  revalidatePath(`/dashboard/cases/${caseRecord.id}`);
  revalidatePath(`/upload-materials/${caseRecord.id}`);

  return NextResponse.json({
    message: "Materials saved.",
    materialImpact
  });
}

function readMetadataRecord(metadata: Json | null | undefined) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return {};
  }

  return metadata;
}

function shouldRecommendReviewRegeneration({
  currentStatus,
  changedMaterialsCount,
  changedRequiredMaterialsCount,
  requiredActionCount,
  materialIssueCount
}: {
  currentStatus: string;
  changedMaterialsCount: number;
  changedRequiredMaterialsCount: number;
  requiredActionCount: number;
  materialIssueCount: number;
}) {
  if (changedMaterialsCount === 0) {
    return false;
  }

  if (currentStatus === "reviewed") {
    return true;
  }

  return changedRequiredMaterialsCount > 0 || requiredActionCount === 0 || materialIssueCount > 0;
}

function buildLikelyReadinessImpact({
  changedMaterialsCount,
  changedRequiredMaterialsCount,
  requiredReadyCount,
  requiredMissingCount,
  requiredActionCount,
  reviewRegenerationRecommended
}: {
  changedMaterialsCount: number;
  changedRequiredMaterialsCount: number;
  requiredReadyCount: number;
  requiredMissingCount: number;
  requiredActionCount: number;
  reviewRegenerationRecommended: boolean;
}) {
  if (changedMaterialsCount === 0) {
    return "No material changes were detected.";
  }

  if (requiredActionCount === 0) {
    return "All required materials are marked ready or not applicable; a regenerated review can validate handoff readiness.";
  }

  if (changedRequiredMaterialsCount > 0 && requiredReadyCount > 0) {
    return `${changedRequiredMaterialsCount} required material update${changedRequiredMaterialsCount === 1 ? "" : "s"} may improve missing-item or risk signals after review regeneration.`;
  }

  if (requiredMissingCount > 0) {
    return `${requiredMissingCount} required material${requiredMissingCount === 1 ? "" : "s"} remain missing, so readiness is likely still constrained.`;
  }

  return reviewRegenerationRecommended
    ? "Material metadata changed enough that a regenerated review should refresh the case signal."
    : "Material changes are saved, but more package work is likely needed before review regeneration matters.";
}
