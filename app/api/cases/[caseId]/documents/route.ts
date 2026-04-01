import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import { recordCaseEvent } from "@/lib/case-events";
import { parseCaseDocumentsInput } from "@/lib/case-review";
import { appendCaseStatusHistory, getNextCaseStatus, normalizeCaseStatus } from "@/lib/case-state";
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
    .select("id, status, status_history")
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
    .select("id")
    .eq("case_id", caseId);

  if (existingDocumentsError) {
    return NextResponse.json({ message: existingDocumentsError.message }, { status: 500 });
  }

  const validIds = new Set((existingDocuments ?? []).map((item) => item.id));

  if (parsed.data.documents.some((item) => !validIds.has(item.id))) {
    return NextResponse.json({ message: "One or more material rows could not be matched to the case." }, { status: 400 });
  }

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

  const { error: updateCaseError } = await supabase
    .from("cases")
    .update({
      status: nextStatus,
      status_history: appendCaseStatusHistory(caseRecord.status_history, nextStatus)
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
      documentCount: parsed.data.documents.length
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
