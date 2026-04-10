import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import {
  buildCaseDocumentStoragePath,
  caseFileBucket,
  caseFileMaxSizeBytes,
  formatAllowedCaseFileTypes,
  isAllowedCaseFileType
} from "@/lib/case-files";
import { getCurrentLocale } from "@/lib/i18n/server";
import { pickLocale } from "@/lib/i18n/workspace";
import { createClient } from "@/lib/supabase/server";

type CaseDocumentUploadRouteProps = {
  params: Promise<{
    caseId: string;
    documentId: string;
  }>;
};

export async function POST(request: Request, { params }: CaseDocumentUploadRouteProps) {
  const { caseId, documentId } = await params;
  const locale = await getCurrentLocale();
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { message: pickLocale(locale, "请先登录后再上传材料。", "請先登入後再上傳材料。") },
      { status: 401 }
    );
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
    return NextResponse.json(
      { message: pickLocale(locale, "找不到所选案件。", "找不到所選案件。") },
      { status: 404 }
    );
  }

  const { data: document, error: documentError } = await supabase
    .from("case_documents")
    .select("id, status, storage_path")
    .eq("case_id", caseRecord.id)
    .eq("id", documentId)
    .maybeSingle();

  if (documentError) {
    return NextResponse.json({ message: documentError.message }, { status: 500 });
  }

  if (!document) {
    return NextResponse.json(
      { message: pickLocale(locale, "找不到所选材料行。", "找不到所選材料列。") },
      { status: 404 }
    );
  }

  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json(
      { message: pickLocale(locale, "请先选择要上传的文件。", "請先選擇要上傳的檔案。") },
      { status: 400 }
    );
  }

  if (file.size <= 0) {
    return NextResponse.json(
      { message: pickLocale(locale, "所选文件为空。", "所選檔案為空。") },
      { status: 400 }
    );
  }

  if (file.size > caseFileMaxSizeBytes) {
    return NextResponse.json(
      { message: pickLocale(locale, "所选文件过大。", "所選檔案過大。") },
      { status: 400 }
    );
  }

  if (!isAllowedCaseFileType(file.type)) {
    return NextResponse.json(
      {
        message: pickLocale(
          locale,
          `不支持的文件类型。允许格式：${formatAllowedCaseFileTypes()}。`,
          `不支援的檔案類型。允許格式：${formatAllowedCaseFileTypes()}。`
        )
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
    caseId: caseRecord.id,
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
    .eq("case_id", caseRecord.id)
    .eq("id", documentId);

  if (updateError) {
    return NextResponse.json({ message: updateError.message }, { status: 500 });
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/cases");
  revalidatePath(`/dashboard/cases/${caseRecord.id}`);
  revalidatePath(`/upload-materials/${caseRecord.id}`);
  revalidatePath(`/review-results/${caseRecord.id}`);

  return NextResponse.json({
    message: pickLocale(locale, "文件已上传。", "檔案已上傳。"),
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
