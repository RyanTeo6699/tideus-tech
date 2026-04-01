import type { Json } from "@/lib/database.types";
import {
  formatUseCaseLabel,
  getCaseIntakeFields,
  getUseCaseDefinition,
  isSupportedUseCase,
  type CaseDocumentStatus,
  type CaseIntakeValues,
  type CaseReadinessStatus,
  type SupportedUseCaseSlug
} from "@/lib/case-workflows";

export type CaseChecklistItem = {
  key: string;
  label: string;
  detail: string;
  status: CaseDocumentStatus;
  materialReference?: string | null;
};

export type CaseRiskFlag = {
  label: string;
  severity: "low" | "medium" | "high";
  detail: string;
};

export type CaseReviewResult = {
  readinessStatus: CaseReadinessStatus;
  readinessSummary: string;
  summary: string;
  timelineNote: string;
  checklist: CaseChecklistItem[];
  missingItems: string[];
  riskFlags: CaseRiskFlag[];
  nextSteps: string[];
};

export type CaseCreateInput = {
  useCase: SupportedUseCaseSlug;
  intake: CaseIntakeValues;
};

export type CaseDocumentUpdateInput = {
  documents: Array<{
    id: string;
    status: CaseDocumentStatus;
    materialReference?: string;
    notes?: string;
  }>;
};

export type StoredChecklistItem = CaseChecklistItem;
export type StoredRiskFlag = CaseRiskFlag;

type ParseSuccess<T> = {
  success: true;
  data: T;
};

type ParseFailure = {
  success: false;
  message: string;
};

type ParseResult<T> = ParseSuccess<T> | ParseFailure;

type ReviewDocument = {
  key: string;
  label: string;
  description: string;
  required: boolean;
  status: CaseDocumentStatus;
  material_reference?: string | null;
};

const documentStatusSet = new Set<CaseDocumentStatus>(["missing", "collecting", "needs-refresh", "ready", "not-applicable"]);

export function parseCaseCreateInput(value: unknown): ParseResult<CaseCreateInput> {
  const body = readObject(value);

  if (!body) {
    return { success: false, message: "Invalid case payload." };
  }

  const useCaseValue = body.useCase;

  if (typeof useCaseValue !== "string" || !isSupportedUseCase(useCaseValue)) {
    return { success: false, message: "Select a supported use case." };
  }

  const definition = getUseCaseDefinition(useCaseValue);

  if (!definition) {
    return { success: false, message: "Select a supported use case." };
  }

  const intake = getEmptyCaseIntakeValues();

  for (const field of getCaseIntakeFields(definition)) {
    const rawValue = body[field.name];

    if (field.type === "date") {
      if (typeof rawValue !== "string" || !rawValue.trim()) {
        if (field.required) {
          return { success: false, message: `${field.label} is required.` };
        }

        continue;
      }

      if (!/^\d{4}-\d{2}-\d{2}$/.test(rawValue.trim())) {
        return { success: false, message: `${field.label} must be a valid date.` };
      }

      intake[field.name] = rawValue.trim();
      continue;
    }

    if (typeof rawValue !== "string") {
      if (field.required) {
        return { success: false, message: `${field.label} is required.` };
      }

      continue;
    }

    const trimmed = rawValue.trim();

    if (field.required && !trimmed) {
      return { success: false, message: `${field.label} is required.` };
    }

    intake[field.name] = trimmed;
  }

  return {
    success: true,
    data: {
      useCase: useCaseValue,
      intake
    }
  };
}

export function parseCaseDocumentsInput(value: unknown): ParseResult<CaseDocumentUpdateInput> {
  const body = readObject(value);

  if (!body || !Array.isArray(body.documents)) {
    return { success: false, message: "Invalid materials payload." };
  }

  if (body.documents.length === 0) {
    return { success: false, message: "Update at least one material before continuing." };
  }

  const documents = body.documents.map((item) => {
    const record = readObject(item);

    if (!record || typeof record.id !== "string" || !record.id.trim()) {
      return null;
    }

    if (typeof record.status !== "string" || !documentStatusSet.has(record.status as CaseDocumentStatus)) {
      return null;
    }

    return {
      id: record.id.trim(),
      status: record.status as CaseDocumentStatus,
      materialReference: typeof record.materialReference === "string" ? record.materialReference.trim() : "",
      notes: typeof record.notes === "string" ? record.notes.trim() : ""
    };
  });

  if (documents.some((item) => item === null)) {
    return { success: false, message: "Every material row must include a valid status." };
  }

  return {
    success: true,
    data: {
      documents: documents as CaseDocumentUpdateInput["documents"]
    }
  };
}

export function buildCaseReviewResult(
  useCaseSlug: SupportedUseCaseSlug,
  intake: CaseIntakeValues,
  documents: ReviewDocument[]
): CaseReviewResult {
  const definition = getUseCaseDefinition(useCaseSlug);

  if (!definition) {
    throw new Error("Unsupported use case.");
  }

  const checklist = documents.map((document) => ({
    key: document.key,
    label: document.label,
    detail: document.description,
    status: document.status,
    materialReference: document.material_reference ?? null
  }));
  const missingRequiredDocuments = checklist.filter((item) =>
    item.status === "missing" || item.status === "collecting" ? isRequiredDocument(documents, item.key) : false
  );
  const staleDocuments = checklist.filter((item) => item.status === "needs-refresh");
  const riskFlags = buildRiskFlags(useCaseSlug, intake, missingRequiredDocuments.length, staleDocuments.length);
  const readinessStatus = determineReadinessStatus(missingRequiredDocuments.length, staleDocuments.length, riskFlags);
  const timelineNote = buildTimelineNote(intake);
  const summary = buildSummary(useCaseSlug, intake, readinessStatus, missingRequiredDocuments.length, riskFlags.length);
  const readinessSummary = buildReadinessSummary(readinessStatus, missingRequiredDocuments.length, riskFlags.length);
  const missingItems = missingRequiredDocuments.map((item) => item.label);
  const nextSteps = buildNextSteps(useCaseSlug, intake, missingRequiredDocuments, riskFlags);

  return {
    readinessStatus,
    readinessSummary,
    summary,
    timelineNote,
    checklist,
    missingItems,
    riskFlags,
    nextSteps
  };
}

export function getDocumentProgressCounts(items: Array<{ status: CaseDocumentStatus; required: boolean }>) {
  let ready = 0;
  let actionNeeded = 0;

  for (const item of items) {
    if (item.status === "ready" || item.status === "not-applicable") {
      ready += 1;
      continue;
    }

    if (item.required) {
      actionNeeded += 1;
    }
  }

  return {
    ready,
    actionNeeded,
    total: items.length
  };
}

export function parseStoredChecklistItems(value: Json) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    const record = readObject(item);

    if (
      !record ||
      typeof record.key !== "string" ||
      typeof record.label !== "string" ||
      typeof record.detail !== "string" ||
      typeof record.status !== "string" ||
      !documentStatusSet.has(record.status as CaseDocumentStatus)
    ) {
      return [];
    }

    return [
      {
        key: record.key,
        label: record.label,
        detail: record.detail,
        status: record.status as CaseDocumentStatus,
        materialReference: typeof record.materialReference === "string" ? record.materialReference : null
      }
    ];
  });
}

export function parseStoredRiskFlags(value: Json) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    const record = readObject(item);

    if (
      !record ||
      typeof record.label !== "string" ||
      typeof record.severity !== "string" ||
      typeof record.detail !== "string" ||
      !["low", "medium", "high"].includes(record.severity)
    ) {
      return [];
    }

    return [
      {
        label: record.label,
        severity: record.severity as CaseRiskFlag["severity"],
        detail: record.detail
      }
    ];
  });
}

export function getEmptyCaseIntakeValues(): CaseIntakeValues {
  return {
    title: "",
    currentStatus: "",
    currentPermitExpiry: "",
    urgency: "",
    passportValidity: "",
    proofOfFundsStatus: "",
    refusalOrComplianceIssues: "",
    applicationReason: "",
    supportEntityName: "",
    supportEvidenceStatus: "",
    scenarioProgressStatus: "",
    notes: ""
  };
}

function determineReadinessStatus(
  missingRequiredCount: number,
  staleDocumentsCount: number,
  riskFlags: CaseRiskFlag[]
): CaseReadinessStatus {
  const highRiskCount = riskFlags.filter((item) => item.severity === "high").length;
  const mediumRiskCount = riskFlags.filter((item) => item.severity === "medium").length;

  if (missingRequiredCount >= 3 || highRiskCount >= 2) {
    return "not-ready";
  }

  if (missingRequiredCount >= 1 || highRiskCount >= 1 || staleDocumentsCount >= 2 || mediumRiskCount >= 3) {
    return "needs-attention";
  }

  if (staleDocumentsCount >= 1 || mediumRiskCount >= 1) {
    return "almost-ready";
  }

  return "review-ready";
}

function buildRiskFlags(
  useCaseSlug: SupportedUseCaseSlug,
  intake: CaseIntakeValues,
  missingRequiredCount: number,
  staleDocumentsCount: number
) {
  const riskFlags: CaseRiskFlag[] = [];
  const daysUntilExpiry = readDaysUntil(intake.currentPermitExpiry);

  if (daysUntilExpiry !== null && daysUntilExpiry <= 30) {
    riskFlags.push({
      label: "Timeline pressure",
      severity: "high",
      detail: "The current temporary status expires within 30 days, so document completion and explanation quality need to move immediately."
    });
  } else if (daysUntilExpiry !== null && daysUntilExpiry <= 60) {
    riskFlags.push({
      label: "Short filing window",
      severity: "medium",
      detail: "The current filing window is short enough that unresolved materials could slow the package quickly."
    });
  }

  if (intake.passportValidity === "under-6") {
    riskFlags.push({
      label: "Passport validity",
      severity: "high",
      detail: "Passport validity under six months can weaken or complicate the file if it is not handled early."
    });
  }

  if (intake.refusalOrComplianceIssues === "yes") {
    riskFlags.push({
      label: "Prior issue to explain",
      severity: "high",
      detail: "A prior refusal or compliance issue means the explanation record should be tightened before the file is treated as review-ready."
    });
  } else if (intake.refusalOrComplianceIssues === "unclear") {
    riskFlags.push({
      label: "Unclear history",
      severity: "medium",
      detail: "The file history is not fully clear yet, so the review should not assume the record is clean."
    });
  }

  if (intake.proofOfFundsStatus === "missing") {
    riskFlags.push({
      label: "Funding proof missing",
      severity: "high",
      detail: "Required financial support evidence is still missing, which weakens the case package materially."
    });
  } else if (intake.proofOfFundsStatus === "partial") {
    riskFlags.push({
      label: "Funding proof incomplete",
      severity: "medium",
      detail: "Financial proof exists but still looks incomplete, so the package may need another pass before review."
    });
  }

  if (missingRequiredCount >= 2) {
    riskFlags.push({
      label: "Core materials missing",
      severity: "high",
      detail: "More than one required document is still missing, so the package is not ready for a clean professional review."
    });
  } else if (staleDocumentsCount >= 1) {
    riskFlags.push({
      label: "Refresh required",
      severity: "medium",
      detail: "At least one required document needs to be refreshed before the package is treated as clean."
    });
  }

  if (useCaseSlug === "visitor-record") {
    if (intake.supportEvidenceStatus === "missing" && intake.applicationReason === "family-or-host") {
      riskFlags.push({
        label: "Host support gap",
        severity: "medium",
        detail: "The case depends on host or family support, but the supporting evidence is still missing."
      });
    }

    if (intake.scenarioProgressStatus === "weak") {
      riskFlags.push({
        label: "Temporary intent is weak",
        severity: "high",
        detail: "The current explanation of temporary intent is still weak, which is a common pressure point in Visitor Record preparation."
      });
    } else if (intake.scenarioProgressStatus === "partial") {
      riskFlags.push({
        label: "Temporary intent needs work",
        severity: "medium",
        detail: "The temporary intent explanation exists but still needs tightening before the file looks disciplined."
      });
    }
  }

  if (useCaseSlug === "study-permit-extension") {
    if (intake.supportEvidenceStatus === "missing") {
      riskFlags.push({
        label: "Enrolment proof missing",
        severity: "high",
        detail: "Current enrolment evidence is missing, which is a core gap for a Study Permit Extension package."
      });
    }

    if (intake.scenarioProgressStatus === "at-risk") {
      riskFlags.push({
        label: "Academic or tuition issue",
        severity: "high",
        detail: "Academic standing or tuition status looks unresolved, so the file needs explanation work before it is treated as ready."
      });
    } else if (intake.scenarioProgressStatus === "needs-explanation") {
      riskFlags.push({
        label: "Academic explanation needed",
        severity: "medium",
        detail: "The extension case is still workable, but the academic or tuition record needs a clearer explanation."
      });
    }
  }

  return dedupeRiskFlags(riskFlags);
}

function buildTimelineNote(intake: CaseIntakeValues) {
  const daysUntilExpiry = readDaysUntil(intake.currentPermitExpiry);

  if (daysUntilExpiry === null) {
    return "Confirm the actual expiry date so the case can be sequenced correctly.";
  }

  if (daysUntilExpiry <= 30) {
    return "The current status expires within 30 days, so only the materials that unblock a credible filing should lead the next work block.";
  }

  if (daysUntilExpiry <= 60) {
    return "There is still time to improve the file, but the package should move from intake to document completion quickly.";
  }

  return "The case still has working time, so the review should optimize for completeness before the file is handed off.";
}

function buildSummary(
  useCaseSlug: SupportedUseCaseSlug,
  intake: CaseIntakeValues,
  readinessStatus: CaseReadinessStatus,
  missingRequiredCount: number,
  riskCount: number
) {
  const baseLabel = formatUseCaseLabel(useCaseSlug);

  if (readinessStatus === "review-ready") {
    return `This ${baseLabel.toLowerCase()} package looks organized enough for a clean review pass, with no major missing pieces and only limited follow-up pressure.`;
  }

  if (readinessStatus === "almost-ready") {
    return `This ${baseLabel.toLowerCase()} package is close, but it still needs a small number of refinements before it should be treated as review-ready.`;
  }

  if (readinessStatus === "needs-attention") {
    return `This ${baseLabel.toLowerCase()} package is workable, but ${missingRequiredCount > 0 ? "required materials are still missing" : "the explanation and risk record still need work"} before the next review step.`;
  }

  if (useCaseSlug === "visitor-record" && intake.scenarioProgressStatus === "weak") {
    return "The Visitor Record package is not ready yet because the temporary intent explanation remains weak and the supporting materials are not fully aligned.";
  }

  if (useCaseSlug === "study-permit-extension" && intake.scenarioProgressStatus === "at-risk") {
    return "The Study Permit Extension package is not ready yet because the academic or tuition record still creates a review risk that needs to be addressed directly.";
  }

  return `This ${baseLabel.toLowerCase()} package is not ready yet because too many core materials or explanation issues are still open.`;
}

function buildReadinessSummary(
  readinessStatus: CaseReadinessStatus,
  missingRequiredCount: number,
  riskCount: number
) {
  const labels: Record<CaseReadinessStatus, string> = {
    "not-ready": "The case still needs material cleanup before it should move into a serious review pass.",
    "needs-attention": "The case can keep moving, but the next pass needs to close the main gaps first.",
    "almost-ready": "The package is close, and the remaining work is mostly about tightening rather than rebuilding.",
    "review-ready": "The package looks organized enough for a focused professional review or final quality pass."
  };

  const detail = `${missingRequiredCount} required item${missingRequiredCount === 1 ? "" : "s"} still need action and ${riskCount} risk flag${riskCount === 1 ? "" : "s"} remain visible.`;

  return `${labels[readinessStatus]} ${detail}`;
}

function buildNextSteps(
  useCaseSlug: SupportedUseCaseSlug,
  intake: CaseIntakeValues,
  missingRequiredDocuments: CaseChecklistItem[],
  riskFlags: CaseRiskFlag[]
) {
  const nextSteps = [
    missingRequiredDocuments[0]
      ? `Finish ${missingRequiredDocuments[0].label.toLowerCase()} first so the next review pass addresses a real package instead of a partial one.`
      : "Freeze the current package version so the next review pass starts from a stable baseline.",
    useCaseSlug === "visitor-record"
      ? "Tighten the explanation letter so the temporary stay, support, and exit logic are easy to follow."
      : "Tighten the explanation letter so the academic plan, funding, and extension reason read as one coherent story.",
    riskFlags.some((item) => item.severity === "high")
      ? "Route the file to a professional reviewer once the high-risk items are documented, not before."
      : "Run one more materials pass to confirm every required document has a clear reference or final version."
  ];

  if (intake.urgency === "under-30") {
    nextSteps.push("Set dates for the remaining evidence work this week so the filing window does not collapse.");
  }

  return dedupeStrings(nextSteps).slice(0, 4);
}

function readDaysUntil(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const now = new Date();
  const target = new Date(`${value}T00:00:00Z`);

  if (Number.isNaN(target.getTime())) {
    return null;
  }

  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function readObject(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function isRequiredDocument(documents: ReviewDocument[], key: string) {
  return documents.find((item) => item.key === key)?.required ?? false;
}

function dedupeStrings(items: string[]) {
  return items.filter((item, index) => items.indexOf(item) === index);
}

function dedupeRiskFlags(items: CaseRiskFlag[]) {
  return items.filter((item, index) => items.findIndex((entry) => entry.label === item.label) === index);
}
