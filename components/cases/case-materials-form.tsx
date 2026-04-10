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
    "Upload or replace files inline, then save the package state before running the next review."
  );
  const hasUploadingRow = useMemo(() => values.some((item) => item.uploadStatus === "loading"), [values]);

  async function handleFileUpload(index: number) {
    const item = values[index];
    const file = item.selectedFile;

    if (!file) {
      updateRow(index, {
        uploadStatus: "error",
        uploadMessage: "Choose a file before uploading."
      });
      return;
    }

    if (file.size > caseFileMaxSizeBytes) {
      updateRow(index, {
        uploadStatus: "error",
        uploadMessage: `File is too large. Limit: ${formatCaseFileSize(caseFileMaxSizeBytes)}.`
      });
      return;
    }

    if (!isAllowedCaseFileType(file.type)) {
      updateRow(index, {
        uploadStatus: "error",
        uploadMessage: `Unsupported file type. Allowed formats: ${formatAllowedCaseFileTypes()}.`
      });
      return;
    }

    updateRow(index, {
      uploadStatus: "loading",
      uploadMessage: "Uploading file..."
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
        throw new Error(data?.message || "Unable to upload the file.");
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
        uploadMessage: data.message || "File uploaded."
      });
      setStatus("success");
      setMessage("Material file uploaded. Save the full materials state when the package is ready for the next review.");
    } catch (error) {
      updateRow(index, {
        uploadStatus: "error",
        uploadMessage: error instanceof Error ? error.message : "Unable to upload the file."
      });
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Unable to upload the file.");
    }
  }

  async function handleSave(generateReview: boolean) {
    setStatus("loading");
    setMessage(generateReview ? "Saving materials and generating review..." : "Saving materials...");

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
        throw new Error(saveData?.message || "Unable to save the materials state.");
      }

      if (!generateReview) {
        setStatus("success");
        setMessage(buildMaterialImpactMessage(saveData?.message || "Materials saved.", saveData?.materialImpact));
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
        throw new Error(reviewData?.message || "Unable to generate the case review.");
      }

      startTransition(() => {
        router.push(`/review-results/${caseId}`);
        router.refresh();
      });
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Unable to continue.");
    }
  }

  if (values.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No materials configured</CardTitle>
          <CardDescription>This case does not have any expected materials yet.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <Card className="border-emerald-200 bg-emerald-50/80 shadow-none">
        <CardHeader>
          <CardTitle>{useCaseTitle}</CardTitle>
          <CardDescription>
            Upload the actual package files where you have them, then use statuses and notes to map what is still missing or needs refresh.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm leading-6 text-slate-700">
          <p>{caseTitle}</p>
          <p>Allowed formats: {formatAllowedCaseFileTypes()}.</p>
          <p>Maximum size per file: {formatCaseFileSize(caseFileMaxSizeBytes)}.</p>
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
                  {item.required ? "Required" : "Optional"}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
                <div className="space-y-2">
                  <Label htmlFor={`file-${item.id}`}>Attached file</Label>
                  {item.fileName ? (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                      <p className="font-semibold text-slate-900">{item.fileName}</p>
                      <p className="mt-1">
                        {formatCaseFileSize(item.fileSizeBytes)}{item.mimeType ? ` · ${item.mimeType}` : ""}
                      </p>
                      <p className="mt-1">{item.uploadedAt ? `Uploaded ${formatDateTime(item.uploadedAt)}` : "File uploaded"}</p>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                      No file attached yet. Upload a file or keep using the status and notes fields if the material is still being collected offline.
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
                      Selected: {item.selectedFile.name} · {formatCaseFileSize(item.selectedFile.size)}
                    </p>
                  ) : null}

                  <div className="flex flex-wrap gap-3">
                    <Button
                      disabled={item.uploadStatus === "loading" || !item.selectedFile}
                      onClick={() => handleFileUpload(index)}
                      type="button"
                      variant="outline"
                    >
                      {item.uploadStatus === "loading" ? "Uploading..." : item.fileName ? "Replace file" : "Upload file"}
                    </Button>
                  </div>

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
                    <Label htmlFor={`status-${item.id}`}>Material status</Label>
                    <Select
                      id={`status-${item.id}`}
                      onChange={(event) => updateRow(index, { status: event.target.value })}
                      value={item.status}
                    >
                      {["missing", "collecting", "needs-refresh", "ready", "not-applicable"].map((value) => (
                        <option key={value} value={value}>
                          {formatDocumentStatus(value)}
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`reference-${item.id}`}>Material reference</Label>
                    <Input
                      id={`reference-${item.id}`}
                      onChange={(event) => updateRow(index, { materialReference: event.target.value })}
                      placeholder="Example: bank-statements-mar-2026.pdf"
                      value={item.materialReference}
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor={`notes-${item.id}`}>Short note</Label>
                    <Input
                      id={`notes-${item.id}`}
                      onChange={(event) => updateRow(index, { notes: event.target.value })}
                      placeholder="Anything that still needs attention"
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
            ? "Ready"
            : status === "loading"
              ? "Working"
              : status === "success"
                ? "Saved"
                : "Error"}
        </p>
        <p className="mt-2">{message}</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button disabled={status === "loading" || hasUploadingRow} onClick={() => void handleSave(false)} type="button" variant="outline">
          {status === "loading" ? "Saving..." : "Save materials"}
        </Button>
        <Button disabled={status === "loading" || hasUploadingRow} onClick={() => void handleSave(true)} type="button">
          {status === "loading" ? "Generating review..." : "Save materials and generate review"}
        </Button>
      </div>
    </div>
  );

  function updateRow(index: number, updates: Partial<MaterialRow>) {
    setValues((current) => current.map((entry, entryIndex) => (entryIndex === index ? { ...entry, ...updates } : entry)));
  }
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-CA", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

function buildMaterialImpactMessage(baseMessage: string, impact: MaterialImpact | undefined) {
  if (!impact) {
    return baseMessage;
  }

  return [
    baseMessage,
    `${impact.changedCount} material update${impact.changedCount === 1 ? "" : "s"} detected.`,
    impact.likelyReadinessImpact,
    impact.reviewRegenerationRecommended ? impact.suggestedNextAction : "Regenerate review after the next meaningful material change."
  ].join(" ");
}
