import type { Json } from "@/lib/database.types";

export const caseStatuses = ["draft", "intake-complete", "materials-updated", "reviewed"] as const;

export type CaseStatus = (typeof caseStatuses)[number];

export const caseEventTypes = [
  "case_created",
  "intake_started",
  "intake_completed",
  "materials_updated",
  "review_generated",
  "review_regenerated",
  "case_resumed"
] as const;

export type CaseEventType = (typeof caseEventTypes)[number];

export type CaseStatusHistoryEntry = {
  status: CaseStatus;
  at: string;
};

const caseStatusLabels: Record<CaseStatus, string> = {
  draft: "Draft",
  "intake-complete": "Intake complete",
  "materials-updated": "Materials updated",
  reviewed: "Reviewed"
};

const caseTransitionTargets: Record<CaseStatus, readonly CaseStatus[]> = {
  draft: ["intake-complete"],
  "intake-complete": ["materials-updated"],
  "materials-updated": ["materials-updated", "reviewed"],
  reviewed: ["materials-updated", "reviewed"]
};

export function getInitialCaseStatus(): CaseStatus {
  return "draft";
}

export function isCaseStatus(value: string): value is CaseStatus {
  return caseStatuses.includes(value as CaseStatus);
}

export function normalizeCaseStatus(value: string | null | undefined): CaseStatus | null {
  if (!value || !isCaseStatus(value)) {
    return null;
  }

  return value;
}

export function formatCaseStatus(status: CaseStatus | string) {
  return caseStatusLabels[status as CaseStatus] ?? status;
}

export function canTransitionCaseStatus(currentStatus: CaseStatus, nextStatus: CaseStatus) {
  return caseTransitionTargets[currentStatus].includes(nextStatus);
}

export function getNextCaseStatus(currentStatus: CaseStatus, nextStatus: CaseStatus) {
  if (!canTransitionCaseStatus(currentStatus, nextStatus)) {
    throw new Error(`Invalid case status transition from ${currentStatus} to ${nextStatus}.`);
  }

  return nextStatus;
}

export function parseCaseStatusHistory(history: Json | null | undefined) {
  if (!Array.isArray(history)) {
    return [];
  }

  return history.flatMap((entry) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      return [];
    }

    const record = entry as Record<string, Json>;

    if (typeof record.status !== "string" || !isCaseStatus(record.status) || typeof record.at !== "string") {
      return [];
    }

    return [
      {
        status: record.status,
        at: record.at
      }
    ];
  });
}

export function appendCaseStatusHistory(history: Json | null | undefined, nextStatus: CaseStatus, at = new Date().toISOString()) {
  const nextHistory = parseCaseStatusHistory(history);

  if (nextHistory.at(-1)?.status === nextStatus) {
    return nextHistory;
  }

  nextHistory.push({
    status: nextStatus,
    at
  });

  return nextHistory;
}
