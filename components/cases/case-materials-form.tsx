"use client";

import { startTransition, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import type { Tables } from "@/lib/database.types";
import {
  caseFileMaxSizeBytes,
  formatAllowedCaseFileTypes,
  formatCaseFileSize,
  isAllowedCaseFileType
} from "@/lib/case-files";
import { formatDocumentStatus } from "@/lib/case-workflows";
import { useLocaleContext } from "@/lib/i18n/client";
import { formatAppDateTime } from "@/lib/i18n/format";
import { getWorkspaceCopy, pickLocale } from "@/lib/i18n/workspace";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";

type CaseMaterialsFormProps = {
  caseId: string;
  caseTitle: string;
  useCaseTitle: string;
  documents: Tables<"case_documents">[];
};

type MaterialRow = {
  id: string;
  label: string;
  required: boolean;
  description: string;
  status: string;
  materialReference: string;
  notes: string;
  fileName: string | null;
  fileSizeBytes: number | null;
  mimeType: string | null;
  uploadedAt: string | null;
  storagePath: string | null;
  selectedFile: File | null;
  uploadStatus: "idle" | "loading" | "error" | "success";
  uploadMessage: string;
};

type MaterialImpact = {
  changedCount: number;
  changedRequiredCount: number;
  requiredReadyCount: number;
  requiredMissingCount: number;
  requiredActionCount: number;
  possibleIssueCount: number;
  likelySupportingDocSuggestionCount: number;
  reviewRegenerationRecommended: boolean;
  likelyReadinessImpact: string;
  suggestedNextAction: string;
};

export function CaseMaterialsForm({ caseId, caseTitle, useCaseTitle, documents }: CaseMaterialsFormProps) {
  const { locale, messages } = useLocaleContext();
  const copy = getWorkspaceCopy(locale);
  const router = useRouter();
  const [values, setValues] = useState<MaterialRow[]>(
    documents.map((item) => ({
      id: item.id,
      label: item.label,
      required: item.required,
      description: item.description,
      status: item.status,
      materialReference: item.material_reference ?? "",
      notes: item.notes ?? "",
      fileName: item.file_name ?? null,
      fileSizeBytes: item.file_size_bytes ?? null,
      mimeType: item.mime_type ?? null,
      uploadedAt: item.uploaded_at ?? null,
      storagePath: item.storage_path ?? null,
      selectedFile: null,
      uploadStatus: "idle",
      uploadMessage: ""
    }))
  );
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState(
    pickLocale(
      locale,
      "可直接上传或替换文件，整理完当前材料包状态后，再决定是否重新生成审查。",
      "可直接上傳或替換檔案，整理完目前材料包狀態後，再決定是否重新生成審查。"
    )
  );
  const hasUploadingRow = useMemo(() => values.some((item) => item.uploadStatus === "loading"), [values]);

  async function handleFileUpload(index: number) {
    const item = values[index];
    const file = item.selectedFile;

    if (!file) {
      updateRow(index, {
        uploadStatus: "error",
        uploadMessage: copy.materials.chooseFileFirst
      });
      return;
    }

    if (file.size > caseFileMaxSizeBytes) {
      updateRow(index, {
        uploadStatus: "error",
        uploadMessage: `${copy.materials.fileTooLarge} ${formatCaseFileSize(caseFileMaxSizeBytes)}`
      });
      return;
    }

    if (!isAllowedCaseFileType(file.type)) {
      updateRow(index, {
        uploadStatus: "error",
        uploadMessage: `${copy.materials.unsupportedType} ${formatAllowedCaseFileTypes()}`
      });
      return;
    }

    updateRow(index, {
      uploadStatus: "loading",
      uploadMessage: copy.materials.uploading
    });

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`/api/cases/${caseId}/documents/${item.id}/upload`, {
        method: "POST",
        body: formData
      });

      const data = (await response.json().catch(() => null)) as
        | {
            message?: string;
            document?: {
              status: string;
              materialReference: string;
              storagePath: string;
              fileName: string;
              fileSizeBytes: number;
              mimeType: string;
              uploadedAt: string;
            };
          }
        | null;

      if (!response.ok || !data?.document) {
        throw new Error(data?.message || copy.materials.uploadFailed);
      }

      updateRow(index, {
        status: data.document.status,
        materialReference: data.document.materialReference,
        fileName: data.document.fileName,
        fileSizeBytes: data.document.fileSizeBytes,
        mimeType: data.document.mimeType,
        uploadedAt: data.document.uploadedAt,
        storagePath: data.document.storagePath,
        selectedFile: null,
        uploadStatus: "success",
        uploadMessage: data.message || messages.common.fileUploaded
      });
      setStatus("success");
      setMessage(copy.materials.uploadSuccess);
    } catch (error) {
      updateRow(index, {
        uploadStatus: "error",
        uploadMessage: error instanceof Error ? error.message : copy.materials.uploadFailed
      });
      setStatus("error");
      setMessage(error instanceof Error ? error.message : copy.materials.uploadFailed);
    }
  }

  async function handleSave(generateReview: boolean) {
    setStatus("loading");
    setMessage(generateReview ? copy.materials.savingAndReview : copy.materials.saving);

    try {
      const saveResponse = await fetch(`/api/cases/${caseId}/documents`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          documents: values.map((item) => ({
            id: item.id,
            status: item.status,
            materialReference: item.materialReference,
            notes: item.notes
          }))
        })
      });

      const saveData = (await saveResponse.json().catch(() => null)) as
        | {
            message?: string;
            materialImpact?: MaterialImpact;
          }
        | null;

      if (!saveResponse.ok) {
        throw new Error(saveData?.message || copy.materials.saveError);
      }

      if (!generateReview) {
        setStatus("success");
        setMessage(buildMaterialImpactMessage(saveData?.message || messages.common.saved, saveData?.materialImpact, locale));
        startTransition(() => {
          router.refresh();
        });
        return;
      }

      const reviewResponse = await fetch(`/api/cases/${caseId}/review`, {
        method: "POST"
      });

      const reviewData = (await reviewResponse.json().catch(() => null)) as { message?: string } | null;

      if (!reviewResponse.ok) {
        throw new Error(reviewData?.message || copy.materials.continueError);
      }

      startTransition(() => {
        router.push(`/review-results/${caseId}`);
        router.refresh();
      });
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : copy.materials.continueError);
    }
  }

  if (values.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{pickLocale(locale, "当前没有预设材料", "目前沒有預設材料")}</CardTitle>
          <CardDescription>{pickLocale(locale, "这个案件还没有生成预期材料列表。", "這個案件還沒有生成預期材料列表。")}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <Card className="border-emerald-200 bg-emerald-50/80 shadow-none">
        <CardHeader>
          <CardTitle>{useCaseTitle}</CardTitle>
          <CardDescription>{copy.materials.intro}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm leading-6 text-slate-700">
          <p>{caseTitle}</p>
          <p>{`${copy.materials.allowedFormats}：${formatAllowedCaseFileTypes()}`}</p>
          <p>{`${copy.materials.maxFileSize}：${formatCaseFileSize(caseFileMaxSizeBytes)}`}</p>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {values.map((item, index) => (
          <Card className="shadow-none" key={item.id}>
            <CardHeader>
              <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <CardTitle className="text-lg">{item.label}</CardTitle>
                  <CardDescription>{item.description}</CardDescription>
                </div>
                <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
                  {item.required ? copy.common.required : copy.common.optional}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
                <div className="space-y-2">
                  <Label htmlFor={`file-${item.id}`}>{copy.materials.attachedFile}</Label>
                  {item.fileName ? (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                      <p className="font-semibold text-slate-900">{item.fileName}</p>
                      <p className="mt-1">
                        {formatCaseFileSize(item.fileSizeBytes)}{item.mimeType ? ` · ${item.mimeType}` : ""}
                      </p>
                      <p className="mt-1">
                        {item.uploadedAt ? `${copy.materials.uploadedAt} ${formatAppDateTime(item.uploadedAt, locale)}` : messages.common.fileUploaded}
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                      {copy.materials.noAttachedFile}
                    </div>
                  )}

                  <Input
                    accept="application/pdf,image/png,image/jpeg,image/webp"
                    id={`file-${item.id}`}
                    onChange={(event) =>
                      updateRow(index, {
                        selectedFile: event.target.files?.[0] ?? null,
                        uploadStatus: "idle",
                        uploadMessage: ""
                      })
                    }
                    type="file"
                  />

                  {item.selectedFile ? (
                    <p className="text-sm text-slate-600">
                      {`${copy.materials.selectedPrefix}：${item.selectedFile.name} · ${formatCaseFileSize(item.selectedFile.size)}`}
                    </p>
                  ) : null}

                  <Button
                    disabled={item.uploadStatus === "loading" || !item.selectedFile}
                    onClick={() => void handleFileUpload(index)}
                    type="button"
                    variant="outline"
                  >
                    {item.uploadStatus === "loading"
                      ? copy.materials.uploading
                      : item.fileName
                        ? copy.materials.replaceFile
                        : copy.materials.uploadFile}
                  </Button>

                  {item.uploadMessage ? (
                    <p
                      className={cn("text-sm", {
                        "text-slate-600": item.uploadStatus === "idle" || item.uploadStatus === "success" || item.uploadStatus === "loading",
                        "text-red-700": item.uploadStatus === "error"
                      })}
                    >
                      {item.uploadMessage}
                    </p>
                  ) : null}
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor={`status-${item.id}`}>{copy.materials.materialStatus}</Label>
                    <Select id={`status-${item.id}`} onChange={(event) => updateRow(index, { status: event.target.value })} value={item.status}>
                      {["missing", "collecting", "needs-refresh", "ready", "not-applicable"].map((value) => (
                        <option key={value} value={value}>
                          {formatDocumentStatus(value, locale)}
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`reference-${item.id}`}>{copy.materials.materialReference}</Label>
                    <Input
                      id={`reference-${item.id}`}
                      onChange={(event) => updateRow(index, { materialReference: event.target.value })}
                      placeholder={copy.materials.referencePlaceholder}
                      value={item.materialReference}
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor={`notes-${item.id}`}>{copy.materials.shortNote}</Label>
                    <Input
                      id={`notes-${item.id}`}
                      onChange={(event) => updateRow(index, { notes: event.target.value })}
                      placeholder={copy.materials.shortNotePlaceholder}
                      value={item.notes}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div
        className={cn("rounded-2xl border p-4 text-sm leading-6", {
          "border-slate-200 bg-slate-50 text-slate-700": status === "idle" || status === "loading",
          "border-emerald-200 bg-emerald-50 text-slate-900": status === "success",
          "border-red-200 bg-red-50 text-red-700": status === "error"
        })}
      >
        <p className="font-semibold uppercase tracking-[0.18em]">
          {status === "idle"
            ? messages.common.ready
            : status === "loading"
              ? messages.common.working
              : status === "success"
                ? messages.common.saved
                : messages.common.error}
        </p>
        <p className="mt-2">{message}</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button disabled={status === "loading" || hasUploadingRow} onClick={() => void handleSave(false)} type="button" variant="outline">
          {status === "loading" ? copy.materials.savingButton : copy.materials.saveMaterials}
        </Button>
        <Button disabled={status === "loading" || hasUploadingRow} onClick={() => void handleSave(true)} type="button">
          {status === "loading" ? copy.materials.generatingButton : copy.materials.saveAndGenerate}
        </Button>
      </div>
    </div>
  );

  function updateRow(index: number, updates: Partial<MaterialRow>) {
    setValues((current) => current.map((entry, entryIndex) => (entryIndex === index ? { ...entry, ...updates } : entry)));
  }
}

function buildMaterialImpactMessage(baseMessage: string, impact: MaterialImpact | undefined, locale: "zh-CN" | "zh-TW") {
  if (!impact) {
    return baseMessage;
  }

  return [
    baseMessage,
    pickLocale(
      locale,
      `检测到 ${impact.changedCount} 处材料更新。`,
      `偵測到 ${impact.changedCount} 處材料更新。`
    ),
    impact.likelyReadinessImpact || pickLocale(locale, "保存后再观察材料影响。", "儲存後再觀察材料影響。"),
    impact.reviewRegenerationRecommended
      ? impact.suggestedNextAction
      : pickLocale(locale, "等下一次有意义的材料变化后再重新生成审查。", "等下一次有意義的材料變化後再重新生成審查。")
  ].join(" ");
}
