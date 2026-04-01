import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import {
  buildCaseDocumentStoragePath,
  caseFileBucket,
  caseFileMaxSizeBytes,
  formatAllowedCaseFileTypes,
  isAllowedCaseFileType
} from "@/lib/case-files";
import { createClient } from "@/lib/supabase/server";

type CaseDocumentUploadRouteProps = {
  params: Promise<{
    caseId: string;
    documentId: string;
  }>;
};

export async function POST(request: Request, { params }: CaseDocumentUploadRouteProps) {
  const { caseId, documentId } = await params;
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ message: "Sign in to upload materials." }, { status: 401 });
  }

  const { data: caseRecord, error: caseError } = await supabase
    .from("cases")
    .select("id")
    .eq("id", caseId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (caseError) {
    return NextResponse.json({ message: caseError.message }, { status: 500 });
  }

  if (!caseRecord) {
    return NextResponse.json({ message: "The selected case could not be found." }, { status: 404 });
  }

  const { data: document, error: documentError } = await supabase
    .from("case_documents")
    .select("id, status, storage_path")
    .eq("case_id", caseId)
    .eq("id", documentId)
    .maybeSingle();

  if (documentError) {
    return NextResponse.json({ message: documentError.message }, { status: 500 });
  }

  if (!document) {
    return NextResponse.json({ message: "The selected material row could not be found." }, { status: 404 });
  }

  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ message: "Choose a file before uploading." }, { status: 400 });
  }

  if (file.size <= 0) {
    return NextResponse.json({ message: "The selected file is empty." }, { status: 400 });
  }

  if (file.size > caseFileMaxSizeBytes) {
    return NextResponse.json({ message: "The selected file is too large." }, { status: 400 });
  }

  if (!isAllowedCaseFileType(file.type)) {
    return NextResponse.json(
      {
        message: `Unsupported file type. Allowed formats: ${formatAllowedCaseFileTypes()}.`
      },
      { status: 400 }
    );
  }

  if (document.storage_path) {
    const { error: removeError } = await supabase.storage.from(caseFileBucket).remove([document.storage_path]);

    if (removeError) {
      console.error("Unable to remove previous case material", removeError);
    }
  }

  const storagePath = buildCaseDocumentStoragePath({
    userId: user.id,
    caseId,
    documentId,
    fileName: file.name
  });

  const fileBuffer = new Uint8Array(await file.arrayBuffer());
  const { error: uploadError } = await supabase.storage
    .from(caseFileBucket)
    .upload(storagePath, fileBuffer, {
      cacheControl: "3600",
      contentType: file.type,
      upsert: true
    });

  if (uploadError) {
    return NextResponse.json({ message: uploadError.message }, { status: 500 });
  }

  const nextStatus = document.status === "missing" ? "collecting" : document.status;
  const uploadedAt = new Date().toISOString();

  const { error: updateError } = await supabase
    .from("case_documents")
    .update({
      status: nextStatus,
      material_reference: file.name,
      storage_bucket: caseFileBucket,
      storage_path: storagePath,
      file_name: file.name,
      file_size_bytes: file.size,
      mime_type: file.type,
      uploaded_at: uploadedAt
    })
    .eq("case_id", caseId)
    .eq("id", documentId);

  if (updateError) {
    return NextResponse.json({ message: updateError.message }, { status: 500 });
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/cases");
  revalidatePath(`/dashboard/cases/${caseId}`);
  revalidatePath(`/upload-materials/${caseId}`);
  revalidatePath(`/review-results/${caseId}`);

  return NextResponse.json({
    message: "File uploaded.",
    document: {
      status: nextStatus,
      materialReference: file.name,
      storagePath,
      fileName: file.name,
      fileSizeBytes: file.size,
      mimeType: file.type,
      uploadedAt
    }
  });
}
