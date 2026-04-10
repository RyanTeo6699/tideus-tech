import type { User } from "@supabase/supabase-js";

import type { Json, Tables, TablesInsert } from "@/lib/database.types";
import {
  parseStoredIntakeNormalization,
  parseStoredHandoffIntelligence,
  parseStoredMaterialInterpretation,
  parseStoredReviewDelta
} from "@/lib/case-ai";
import { recordCaseEvent } from "@/lib/case-events";
import {
  buildCaseReviewResult,
  getDocumentProgressCounts,
  parseStoredChecklistItems,
  parseStoredRiskFlags,
  type CaseReviewResult
} from "@/lib/case-review";
import {
  formatReadinessStatus,
  getUseCaseDefinition,
  type CaseDocumentStatus,
  type CaseIntakeValues,
  type SupportedUseCaseSlug
} from "@/lib/case-workflows";
import {
  formatCaseStatus,
  getInitialCaseStatus,
  normalizeCaseStatus
} from "@/lib/case-state";
import { createClient } from "@/lib/supabase/server";

export type CaseListResult = {
  user: User | null;
  items: Tables<"cases">[];
};

export type CaseDetailResult = {
  user: User | null;
  profile: Tables<"profiles"> | null;
  caseRecord: Tables<"cases"> | null;
  documents: Tables<"case_documents">[];
  latestReview: Tables<"case_review_versions"> | null;
  reviewHistory: Tables<"case_review_versions">[];
};

type CaseDetailOptions = {
  resumeSource?: "materials" | "review-results";
};

export type CaseNextAction = {
  label: string;
  href: string;
  description: string;
};

export type CaseMaterialStatusCounts = {
  total: number;
  requiredTotal: number;
  ready: number;
  collecting: number;
  needsRefresh: number;
  missing: number;
  notApplicable: number;
  requiredReady: number;
  requiredActionCount: number;
};

export function getCaseIntakeInitialValues(profile: Tables<"profiles"> | null, useCaseSlug: SupportedUseCaseSlug) {
  const values: Partial<CaseIntakeValues> = {};

  if (profile?.current_status) {
    values.currentStatus = profile.current_status === "outside-canada" ? "other" : profile.current_status;
  } else if (useCaseSlug === "visitor-record") {
    values.currentStatus = "visitor";
  } else if (useCaseSlug === "study-permit-extension") {
    values.currentStatus = "student";
  }

  if (profile?.refusal_history_flag) {
    values.refusalOrComplianceIssues = "yes";
  }

  return values;
}

export function buildCaseTitle(useCaseSlug: SupportedUseCaseSlug, intake: CaseIntakeValues) {
  if (intake.title.trim()) {
    return intake.title.trim();
  }

  const useCase = getUseCaseDefinition(useCaseSlug);
  const fallback = useCase?.shortTitle ?? "Case";
  return `${fallback} prep`;
}

export function buildInitialCaseDocuments(useCaseSlug: SupportedUseCaseSlug, intake: CaseIntakeValues): TablesInsert<"case_documents">[] {
  const useCase = getUseCaseDefinition(useCaseSlug);

  if (!useCase) {
    return [];
  }

  return useCase.expectedDocuments.map((document, index) => ({
    document_key: document.key,
    label: document.label,
    description: document.description,
    position: index,
    required: document.required,
    status: deriveInitialDocumentStatus(useCaseSlug, document.key, intake)
  }));
}

export function buildCaseResumeHref(caseRecord: Tables<"cases">) {
  if (normalizeCaseStatus(caseRecord.status) === "reviewed") {
    return `/review-results/${caseRecord.id}`;
  }

  return `/upload-materials/${caseRecord.id}`;
}

export function getCaseReviewSnapshot(latestReview: Tables<"case_review_versions"> | null): CaseReviewResult | null {
  if (!latestReview) {
    return null;
  }

  const reviewSupport = readReviewSupportMetadata(latestReview.metadata);

  return {
    readinessStatus: latestReview.readiness_status as CaseReviewResult["readinessStatus"],
    readinessSummary: latestReview.readiness_summary,
    summary: latestReview.result_summary,
    timelineNote: latestReview.timeline_note ?? "",
    checklist: parseStoredChecklistItems(latestReview.checklist_items),
    missingItems: latestReview.missing_items,
    riskFlags: parseStoredRiskFlags(latestReview.risk_flags),
    nextSteps: latestReview.next_steps,
    supportingContextNotes: reviewSupport.supportingContextNotes,
    officialReferenceLabels: reviewSupport.officialReferenceLabels
  };
}

export function buildCaseFacts(caseRecord: Tables<"cases">, documents: Tables<"case_documents">[]) {
  const counts = getDocumentProgressCounts(
    documents.map((item) => ({
      status: item.status as CaseDocumentStatus,
      required: item.required
    }))
  );

  return [
    { label: "Use case", value: getUseCaseDefinition(caseRecord.use_case_slug)?.shortTitle ?? caseRecord.use_case_slug },
    { label: "Case status", value: formatCaseStatus(caseRecord.status) },
    { label: "Readiness", value: caseRecord.latest_readiness_status ? formatReadinessStatus(caseRecord.latest_readiness_status) : "Not reviewed yet" },
    { label: "Materials ready", value: `${counts.ready}/${counts.total}` },
    { label: "Last review", value: caseRecord.latest_reviewed_at ? formatDate(caseRecord.latest_reviewed_at) : "Not reviewed yet" },
    { label: "Updated", value: formatDate(caseRecord.updated_at) }
  ];
}

export function getCaseMaterialStatusCounts(documents: Tables<"case_documents">[]): CaseMaterialStatusCounts {
  let ready = 0;
  let collecting = 0;
  let needsRefresh = 0;
  let missing = 0;
  let notApplicable = 0;
  let requiredTotal = 0;
  let requiredReady = 0;

  for (const item of documents) {
    if (item.required) {
      requiredTotal += 1;
    }

    if (item.status === "ready") {
      ready += 1;
      if (item.required) {
        requiredReady += 1;
      }
      continue;
    }

    if (item.status === "collecting") {
      collecting += 1;
      continue;
    }

    if (item.status === "needs-refresh") {
      needsRefresh += 1;
      continue;
    }

    if (item.status === "missing") {
      missing += 1;
      continue;
    }

    if (item.status === "not-applicable") {
      notApplicable += 1;
      if (item.required) {
        requiredReady += 1;
      }
    }
  }

  return {
    total: documents.length,
    requiredTotal,
    ready,
    collecting,
    needsRefresh,
    missing,
    notApplicable,
    requiredReady,
    requiredActionCount: requiredTotal - requiredReady
  };
}

export function getCaseNextAction(caseRecord: Tables<"cases">, documents: Tables<"case_documents">[]): CaseNextAction {
  const counts = getDocumentProgressCounts(
    documents.map((item) => ({
      status: item.status as CaseDocumentStatus,
      required: item.required
    }))
  );

  if (normalizeCaseStatus(caseRecord.status) !== "reviewed") {
    return {
      label: "Finish materials and run review",
      href: `/upload-materials/${caseRecord.id}`,
      description:
        counts.actionNeeded > 0
          ? `${counts.actionNeeded} required material${counts.actionNeeded === 1 ? "" : "s"} still need work before the first clean review pass.`
          : "The intake is complete. The next step is to confirm the package state and generate the first review version."
    };
  }

  if (caseRecord.latest_readiness_status === "review-ready") {
    return {
      label: "Export the latest summary",
      href: `/review-results/${caseRecord.id}/export`,
      description: "The latest review looks ready enough to print, export, or carry into the next professional handoff."
    };
  }

  return {
    label: "Refresh materials and regenerate review",
    href: `/upload-materials/${caseRecord.id}`,
    description:
      caseRecord.latest_review_summary ||
      "The case already has a saved review version, but the next pass should tighten the package before export."
  };
}

export function buildCaseSnapshotFacts(caseRecord: Tables<"cases">) {
  const intake = readCaseIntake(caseRecord.intake_answers);

  return [
    { label: "Current status", value: formatStoredValue(intake.currentStatus) || "Not captured" },
    { label: "Expiry date", value: intake.currentPermitExpiry || "Not captured" },
    { label: "Timeline", value: formatStoredValue(intake.urgency) || "Not captured" },
    { label: "Passport validity", value: formatStoredValue(intake.passportValidity) || "Not captured" },
    { label: "Funds status", value: formatStoredValue(intake.proofOfFundsStatus) || "Not captured" },
    { label: "Support evidence", value: formatStoredValue(intake.supportEvidenceStatus) || "Not captured" },
    { label: "Case progress signal", value: formatStoredValue(intake.scenarioProgressStatus) || "Not captured" },
    { label: "Support entity", value: intake.supportEntityName || "Not captured" }
  ];
}

export function buildCaseNotes(caseRecord: Tables<"cases">) {
  return readCaseIntake(caseRecord.intake_answers).notes || "No case notes saved.";
}

export function getReviewHistoryFacts(reviewHistory: Tables<"case_review_versions">[]) {
  return reviewHistory.map((item) => ({
    label: `Version ${item.version_number}`,
    value: `${formatReadinessStatus(item.readiness_status)} · ${formatDate(item.created_at)}`
  }));
}

export function getCaseReviewDeltaSnapshot(latestReview: Tables<"case_review_versions"> | null) {
  return latestReview ? parseStoredReviewDelta(latestReview.metadata) : null;
}

export function getCaseHandoffIntelligenceSnapshot(latestReview: Tables<"case_review_versions"> | null) {
  return latestReview ? parseStoredHandoffIntelligence(latestReview.metadata) : null;
}

export function getCaseMaterialInterpretationSnapshot(caseRecord: Tables<"cases">) {
  return parseStoredMaterialInterpretation(caseRecord.metadata);
}

export function getCaseIntakeNormalizationSnapshot(caseRecord: Tables<"cases">) {
  return parseStoredIntakeNormalization(caseRecord.metadata);
}

export async function getCases(limit = 24): Promise<CaseListResult> {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      user: null,
      items: []
    };
  }

  const { data } = await supabase
    .from("cases")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(limit);

  return {
    user,
    items: data ?? []
  };
}

export async function getCaseDetail(caseId: string, options?: CaseDetailOptions): Promise<CaseDetailResult> {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      user: null,
      profile: null,
      caseRecord: null,
      documents: [],
      latestReview: null,
      reviewHistory: []
    };
  }

  const [{ data: profile }, { data: caseRecord }] = await Promise.all([
    supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle(),
    supabase.from("cases").select("*").eq("user_id", user.id).eq("id", caseId).maybeSingle()
  ]);

  if (!caseRecord) {
    return {
      user,
      profile: profile ?? null,
      caseRecord: null,
      documents: [],
      latestReview: null,
      reviewHistory: []
    };
  }

  const [{ data: documents }, { data: reviewHistory }] = await Promise.all([
    supabase.from("case_documents").select("*").eq("case_id", caseRecord.id).order("position", { ascending: true }),
    supabase.from("case_review_versions").select("*").eq("case_id", caseRecord.id).order("version_number", { ascending: false })
  ]);

  if (options?.resumeSource) {
    const status = normalizeCaseStatus(caseRecord.status) ?? getInitialCaseStatus();
    const eventError = await recordCaseEvent(supabase, {
      caseId: caseRecord.id,
      userId: user.id,
      eventType: "case_resumed",
      status,
      metadata: {
        source: options.resumeSource
      }
    });

    if (eventError) {
      console.error("Unable to record case resume event", eventError);
    }
  }

  return {
    user,
    profile: profile ?? null,
    caseRecord,
    documents: documents ?? [],
    latestReview: reviewHistory?.[0] ?? null,
    reviewHistory: reviewHistory ?? []
  };
}

export async function buildLatestReviewForCase(caseRecord: Tables<"cases">, documents: Tables<"case_documents">[]) {
  const intake = readCaseIntake(caseRecord.intake_answers);
  return buildCaseReviewResult(
    caseRecord.use_case_slug as SupportedUseCaseSlug,
    intake,
    documents.map((item) => ({
      key: item.document_key,
      label: item.label,
      description: item.description,
      required: item.required,
      status: item.status as CaseDocumentStatus,
      material_reference: item.material_reference
    }))
  );
}

function deriveInitialDocumentStatus(useCaseSlug: SupportedUseCaseSlug, documentKey: string, intake: CaseIntakeValues): CaseDocumentStatus {
  if (documentKey === "proof-of-funds") {
    return mapPreparednessToDocumentStatus(intake.proofOfFundsStatus);
  }

  if (
    (useCaseSlug === "visitor-record" && documentKey === "host-or-accommodation") ||
    (useCaseSlug === "study-permit-extension" && documentKey === "enrolment-letter")
  ) {
    return mapPreparednessToDocumentStatus(intake.supportEvidenceStatus);
  }

  if (
    (useCaseSlug === "visitor-record" && documentKey === "temporary-intent-support") ||
    (useCaseSlug === "study-permit-extension" && documentKey === "transcript-or-progress")
  ) {
    if (intake.scenarioProgressStatus === "clear" || intake.scenarioProgressStatus === "good-standing") {
      return "collecting";
    }

    if (intake.scenarioProgressStatus === "partial" || intake.scenarioProgressStatus === "needs-explanation") {
      return "needs-refresh";
    }

    if (intake.scenarioProgressStatus === "weak" || intake.scenarioProgressStatus === "at-risk") {
      return "missing";
    }
  }

  return "missing";
}

function mapPreparednessToDocumentStatus(value: string): CaseDocumentStatus {
  if (value === "ready") {
    return "collecting";
  }

  if (value === "partial") {
    return "needs-refresh";
  }

  if (value === "not-needed") {
    return "not-applicable";
  }

  return "missing";
}

export function readCaseIntake(value: Json) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
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

  const record = value as Record<string, Json>;

  return {
    title: readString(record.title),
    currentStatus: readString(record.currentStatus),
    currentPermitExpiry: readString(record.currentPermitExpiry),
    urgency: readString(record.urgency),
    passportValidity: readString(record.passportValidity),
    proofOfFundsStatus: readString(record.proofOfFundsStatus),
    refusalOrComplianceIssues: readString(record.refusalOrComplianceIssues),
    applicationReason: readString(record.applicationReason),
    supportEntityName: readString(record.supportEntityName),
    supportEvidenceStatus: readString(record.supportEvidenceStatus),
    scenarioProgressStatus: readString(record.scenarioProgressStatus),
    notes: readString(record.notes)
  };
}

function readString(value: Json | undefined) {
  return typeof value === "string" ? value : "";
}

function readReviewSupportMetadata(metadata: Json | null | undefined) {
  const record = readJsonRecord(metadata);
  const reviewSupport = readJsonRecord(record.reviewSupport);
  const knowledgeAdapter = readJsonRecord(record.knowledgeAdapter);
  const aiWorkflow = readJsonRecord(record.aiWorkflow);
  const reviewGeneration = readJsonRecord(aiWorkflow.reviewGeneration);
  const reviewOutput = readJsonRecord(reviewGeneration.output);

  return {
    supportingContextNotes: readStringArray(
      reviewSupport.supportingContextNotes ?? reviewOutput.supportingContextNotes ?? knowledgeAdapter.supportingContextNotes
    ),
    officialReferenceLabels: readStringArray(
      reviewSupport.officialReferenceLabels ?? reviewOutput.officialReferenceLabels ?? knowledgeAdapter.officialReferenceLabels
    )
  };
}

function readJsonRecord(value: Json | null | undefined): Record<string, Json> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, Json>;
}

function readStringArray(value: Json | undefined): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => (typeof item === "string" && item.trim() ? [item.trim()] : []));
}

function formatStoredValue(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-CA", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(value));
}
