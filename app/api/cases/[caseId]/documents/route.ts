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
    .eq("case_id", caseId);

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
      .eq("case_id", caseId)
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
    .eq("id", caseId);

  if (updateCaseError) {
    return NextResponse.json({ message: updateCaseError.message }, { status: 500 });
  }

  const eventError = await recordCaseEvent(supabase, {
    caseId,
    userId: user.id,
    eventType: "materials_updated",
    status: nextStatus,
    fromStatus: currentStatus,
    toStatus: nextStatus,
    metadata: {
      useCaseSlug: caseRecord.use_case_slug,
      documentCount: parsed.data.documents.length,
      changedMaterialsCount,
      changedRequiredMaterialsCount,
      readyCount,
      collectingCount,
      needsRefreshCount,
      missingCount,
      requiredActionCount,
      materialInterpretationSource: materialInterpretation.source,
      materialInterpretationPromptVersion: materialInterpretation.promptVersion,
      materialIssueFlagCount: materialInterpretationSummary.issueFlagCount,
      materialSuggestedStatusChangesCount: materialInterpretationSummary.suggestedStatusChangesCount
    }
  });

  if (eventError) {
    console.error("Unable to record case materials event", eventError);
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/cases");
  revalidatePath(`/dashboard/cases/${caseId}`);
  revalidatePath(`/upload-materials/${caseId}`);

  return NextResponse.json({
    message: "Materials saved."
  });
}

function readMetadataRecord(metadata: Json | null | undefined) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return {};
  }

  return metadata;
}
