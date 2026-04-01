export const caseFileBucket = "case-materials";

export const caseFileMaxSizeBytes = 10 * 1024 * 1024;

export const allowedCaseFileTypes = [
  { mimeType: "application/pdf", label: "PDF" },
  { mimeType: "image/png", label: "PNG" },
  { mimeType: "image/jpeg", label: "JPG or JPEG" },
  { mimeType: "image/webp", label: "WEBP" }
] as const;

const allowedCaseFileMimeTypes = new Set<string>(allowedCaseFileTypes.map((item) => item.mimeType));

export function isAllowedCaseFileType(mimeType: string) {
  return allowedCaseFileMimeTypes.has(mimeType);
}

export function formatAllowedCaseFileTypes() {
  return allowedCaseFileTypes.map((item) => item.label).join(", ");
}

export function buildCaseDocumentStoragePath({
  userId,
  caseId,
  documentId,
  fileName
}: {
  userId: string;
  caseId: string;
  documentId: string;
  fileName: string;
}) {
  return `${userId}/${caseId}/${documentId}/${Date.now()}-${sanitizeStorageFileName(fileName)}`;
}

export function formatCaseFileSize(bytes: number | null | undefined) {
  if (!bytes || bytes <= 0) {
    return "Unknown size";
  }

  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function sanitizeStorageFileName(fileName: string) {
  return fileName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9.\-_]+/g, "-")
    .replace(/-+/g, "-");
}
