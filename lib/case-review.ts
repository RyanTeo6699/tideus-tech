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
    detail: buildChecklistDetail(useCaseSlug, intake, document),
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
  const readinessSummary = buildReadinessSummary(
    readinessStatus,
    missingRequiredDocuments.length,
    staleDocuments.length,
    riskFlags.length
  );
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

  if (useCaseSlug === "visitor-record" && intake.currentStatus !== "visitor") {
    riskFlags.push({
      label: "Current status mismatch",
      severity: "medium",
      detail: "This workflow assumes visitor-based extension prep, so the current status should be confirmed before the case is treated as routine."
    });
  }

  if (useCaseSlug === "study-permit-extension" && intake.currentStatus !== "student") {
    riskFlags.push({
      label: "Student status mismatch",
      severity: "high",
      detail: "This workflow assumes an in-status student extension, so confirm the current status before treating the package as standard extension work."
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

    if (intake.supportEvidenceStatus === "partial" && intake.applicationReason === "family-or-host") {
      riskFlags.push({
        label: "Host support still partial",
        severity: "medium",
        detail: "Host or family support evidence exists, but it still needs a cleaner final version before the package reads as disciplined."
      });
    }

    if (intake.applicationReason === "family-or-host" && !intake.supportEntityName.trim()) {
      riskFlags.push({
        label: "Support source unclear",
        severity: "medium",
        detail: "The stay appears to depend on a host or family contact, but the support source is not clearly named in the intake."
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

    if (intake.applicationReason === "awaiting-next-step" && intake.scenarioProgressStatus !== "clear") {
      riskFlags.push({
        label: "Interim plan is not yet clear",
        severity: "medium",
        detail: "If the stay depends on waiting for another immigration step, the explanation should still read as temporary, time-bound, and well supported."
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

    if (intake.supportEvidenceStatus === "partial") {
      riskFlags.push({
        label: "Enrolment proof still partial",
        severity: "medium",
        detail: "The enrolment record exists, but the package still needs a current, clean school document that matches the extension period."
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
  if (useCaseSlug === "visitor-record") {
    if (readinessStatus === "review-ready") {
      return "The Visitor Record package now reads as time-bounded, supported, and organized enough to save as a credible discussion or handoff packet.";
    }

    if (readinessStatus === "almost-ready") {
      return "The Visitor Record package is close, but the last cleanup pass still needs to tighten the temporary-intent story and make the final support record easier to scan.";
    }

    if (readinessStatus === "needs-attention") {
      return missingRequiredCount > 0
        ? "The Visitor Record package is still missing one or more core items, so the next pass should focus on completing the file before it is treated as handoff-ready."
        : "The Visitor Record package is workable, but the explanation and support story still need one cleaner pass before a professional discussion.";
    }

    if (intake.scenarioProgressStatus === "weak") {
      return "The Visitor Record package is not ready yet because the temporary-intent explanation remains weak and the supporting evidence is not aligned tightly enough for a serious review.";
    }

    return "The Visitor Record package is not ready yet because too many core materials or explanation issues are still open for a credible handoff.";
  }

  if (readinessStatus === "review-ready") {
    return "The Study Permit Extension package now reads as internally consistent enough to save as a clean review packet, with enrolment, funding, and explanation materials largely in place.";
  }

  if (readinessStatus === "almost-ready") {
    return "The Study Permit Extension package is close, but the last pass still needs to line up school records, funding proof, and the extension explanation more cleanly.";
  }

  if (readinessStatus === "needs-attention") {
    return missingRequiredCount > 0
      ? "The Study Permit Extension package is still missing core school or funding materials, so the next pass should finish those before the file is treated as handoff-ready."
      : "The Study Permit Extension package is workable, but the academic record or extension explanation still needs one more disciplined pass.";
  }

  if (intake.scenarioProgressStatus === "at-risk") {
    return "The Study Permit Extension package is not ready yet because the academic or tuition record still creates a review risk that should be addressed directly before handoff.";
  }

  return riskCount > 0
    ? "The Study Permit Extension package is not ready yet because unresolved document and explanation pressure still makes the file too exposed for a clean review."
    : "The Study Permit Extension package is not ready yet because too many core materials are still open for a credible handoff.";
}

function buildReadinessSummary(
  readinessStatus: CaseReadinessStatus,
  missingRequiredCount: number,
  staleDocumentsCount: number,
  riskCount: number
) {
  const labels: Record<CaseReadinessStatus, string> = {
    "not-ready": "The case still needs material cleanup before it should move into a serious review pass.",
    "needs-attention": "The case can keep moving, but the next pass needs to close the main gaps first.",
    "almost-ready": "The package is close, and the remaining work is mostly about tightening rather than rebuilding.",
    "review-ready": "The package looks organized enough for a focused professional review or final quality pass."
  };

  const detail =
    missingRequiredCount === 0 && staleDocumentsCount === 0 && riskCount === 0
      ? "No required gaps, refresh flags, or visible risk markers remain in this saved version."
      : `${missingRequiredCount} required item${missingRequiredCount === 1 ? "" : "s"} still need action, ${staleDocumentsCount} item${staleDocumentsCount === 1 ? "" : "s"} need refresh, and ${riskCount} risk flag${riskCount === 1 ? "" : "s"} remain visible.`;

  return `${labels[readinessStatus]} ${detail}`;
}

function buildNextSteps(
  useCaseSlug: SupportedUseCaseSlug,
  intake: CaseIntakeValues,
  missingRequiredDocuments: CaseChecklistItem[],
  riskFlags: CaseRiskFlag[]
) {
  const nextSteps: string[] = [];
  const missingKeys = new Set(missingRequiredDocuments.map((item) => item.key));
  const hasHighRisk = riskFlags.some((item) => item.severity === "high");

  if (useCaseSlug === "visitor-record") {
    if (missingKeys.has("extension-explanation") || missingKeys.has("temporary-intent-support")) {
      nextSteps.push(
        "Finish the explanation letter and temporary-intent support together so the file clearly explains why the stay continues, why it remains temporary, and what closes it out."
      );
    } else if (missingRequiredDocuments[0]) {
      nextSteps.push(
        `Finish ${missingRequiredDocuments[0].label.toLowerCase()} first so the next review pass addresses a real package instead of a partial one.`
      );
    } else {
      nextSteps.push(
        "Freeze the current package version so the next review pass starts from a stable baseline."
      );
    }

    if (intake.applicationReason === "family-or-host" && intake.supportEvidenceStatus !== "ready") {
      nextSteps.push(
        "Collect the final invitation, accommodation, or host-support record so the package does not rely on a vague family-or-host narrative."
      );
    }

    if (intake.proofOfFundsStatus !== "ready") {
      nextSteps.push(
        "Add current funding proof that matches the length of stay and the support story described in the explanation letter."
      );
    }

    if (intake.scenarioProgressStatus === "clear") {
      nextSteps.push(
        "Do one clean explanation pass so the temporary stay, support evidence, and exit logic still read as one coherent visitor record story."
      );
    }
  } else {
    if (
      missingKeys.has("enrolment-letter") ||
      missingKeys.has("transcript-or-progress") ||
      missingKeys.has("tuition-evidence")
    ) {
      nextSteps.push(
        "Bring the current enrolment, progress, and tuition record into one matching package so the school story is easy to review in one pass."
      );
    } else if (missingRequiredDocuments[0]) {
      nextSteps.push(
        `Finish ${missingRequiredDocuments[0].label.toLowerCase()} first so the next review pass addresses a real package instead of a partial one.`
      );
    } else {
      nextSteps.push("Freeze the current package version so the next review pass starts from a stable baseline.");
    }

    if (intake.supportEvidenceStatus !== "ready") {
      nextSteps.push(
        "Collect a current enrolment letter or equivalent school record that matches the actual extension period."
      );
    }

    if (intake.scenarioProgressStatus !== "good-standing") {
      nextSteps.push(
        "Prepare a short academic-progress or tuition explanation so the extension request still reads as credible and organized."
      );
    } else {
      nextSteps.push(
        "Make sure the explanation letter ties the program plan, funding position, and extension reason into one coherent study extension narrative."
      );
    }

    if (intake.proofOfFundsStatus !== "ready") {
      nextSteps.push(
        "Add current funding evidence for the remaining study period so the extension packet is not carried by school records alone."
      );
    }

    if (intake.applicationReason === "program-transition" || intake.applicationReason === "registration-delay") {
      nextSteps.push(
        "Make the explanation letter explicit about the program timing or transition issue so the extension request still reads as controlled rather than improvised."
      );
    }
  }

  nextSteps.push(
    hasHighRisk
      ? "Route the file to a professional reviewer once the high-risk items are documented, not before."
      : "Run one more materials pass to confirm every required document has a clear reference or final version."
  );

  if (intake.urgency === "under-30") {
    nextSteps.push("Set dates for the remaining evidence work this week so the filing window does not collapse.");
  }

  return dedupeStrings(nextSteps).slice(0, 5);
}

function buildChecklistDetail(
  useCaseSlug: SupportedUseCaseSlug,
  intake: CaseIntakeValues,
  document: ReviewDocument
) {
  const statusNotes: Record<CaseDocumentStatus, string> = {
    missing: "It is still missing from the current package and should be resolved before the next serious review pass.",
    collecting: "It is marked in progress, so confirm the final version and a clear reference before the next review.",
    "needs-refresh": "A version exists, but it should be refreshed, updated, or replaced before the package is treated as clean.",
    ready: "It is available in the current package and ready for the next review pass.",
    "not-applicable": "It is marked not applicable for this case as currently framed."
  };

  return [document.description, buildDocumentExpectation(useCaseSlug, intake, document.key), statusNotes[document.status]]
    .filter(Boolean)
    .join(" ");
}

function buildDocumentExpectation(
  useCaseSlug: SupportedUseCaseSlug,
  intake: CaseIntakeValues,
  documentKey: string
) {
  if (useCaseSlug === "visitor-record") {
    const notes: Partial<Record<string, string>> = {
      "passport-copy": "Use the identity page and any pages needed to show current validity or relevant travel history.",
      "current-status-proof": "The status proof should line up cleanly with the current visitor stay and the expiry date used in the case timeline.",
      "extension-explanation":
        "This should explain why the stay continues, why it remains temporary, who is supporting it, and what ends the stay.",
      "proof-of-funds":
        "The funding record should match the remaining stay length and the support story described in the explanation letter.",
      "temporary-intent-support":
        "Use this to support departure logic, onward planning, or the next lawful status step without making the stay read as open-ended."
    };

    if (documentKey === "host-or-accommodation") {
      return intake.applicationReason === "family-or-host"
        ? "Because the stay depends on host or family support, this evidence should clearly identify the person, location, and support arrangement."
        : "Use this only if accommodation or host support is part of the file.";
    }

    return notes[documentKey] ?? "";
  }

  const notes: Partial<Record<string, string>> = {
    "passport-copy": "Use the identity page and any pages needed to show current validity for the extension period.",
    "current-study-permit": "The current permit should line up with the expiry date and the extension timeline used in the case.",
    "enrolment-letter":
      "The document should match the current term or extension period and clearly confirm the academic relationship.",
    "transcript-or-progress":
      "Use current progress, standing, or attendance evidence so the academic story is easy to review in one pass.",
    "tuition-evidence":
      "Payment proof or a payment-plan record should align with the remaining study period described in the extension request.",
    "proof-of-funds":
      "The funding record should support the remaining study period and living-cost story, not just the school record.",
    "extension-explanation":
      "This should explain why the extension is needed and how the academic plan, funding, and status history still fit together cleanly."
  };

  return notes[documentKey] ?? "";
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
