import "server-only";

import type { User } from "@supabase/supabase-js";

import type { Database, Tables } from "@/lib/database.types";
import type { HandoffPacketSummary, HandoffRequestRecord, HandoffRequestStatus } from "@/lib/handoffs";
import { isHandoffRequestStatus, parseHandoffRequestRecord } from "@/lib/handoffs";
import {
  buildCaseSnapshotFacts,
  getCaseHandoffIntelligenceSnapshot,
  getCaseMaterialStatusCounts,
  getCaseReviewSnapshot
} from "@/lib/cases";
import { getUseCaseDefinition } from "@/lib/case-workflows";
import type { AppLocale } from "@/lib/i18n/config";
import { pickLocale } from "@/lib/i18n/workspace";
import {
  canAccessProfessionalDashboard,
  getCurrentPermissionContext,
  type PermissionContext
} from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";

export const activeProfessionalHandoffStatuses = ["new", "opened", "in_review"] as const;

type BuildHandoffPacketSnapshotInput = {
  caseRecord: Tables<"cases">;
  documents: Tables<"case_documents">[];
  latestReview: Tables<"case_review_versions">;
  profile: Tables<"profiles"> | null;
  user: Pick<User, "email" | "user_metadata">;
  locale: AppLocale;
};

export function buildHandoffPacketSnapshot({
  caseRecord,
  documents,
  latestReview,
  profile,
  user,
  locale
}: BuildHandoffPacketSnapshotInput): HandoffPacketSummary {
  const review = getCaseReviewSnapshot(latestReview);

  if (!review) {
    throw new Error("Latest review snapshot is required to build a handoff packet.");
  }

  const handoffIntelligence = getCaseHandoffIntelligenceSnapshot(latestReview);
  const materialSummary = getCaseMaterialStatusCounts(documents);
  const riskSummary = {
    high: review.riskFlags.filter((item) => item.severity === "high").length,
    medium: review.riskFlags.filter((item) => item.severity === "medium").length,
    low: review.riskFlags.filter((item) => item.severity === "low").length
  };
  const displayName =
    profile?.full_name ??
    (typeof user.user_metadata?.full_name === "string" && user.user_metadata.full_name.trim()
      ? user.user_metadata.full_name.trim()
      : user.email?.split("@")[0] ?? pickLocale(locale, "未命名客户", "未命名客戶"));

  return {
    packetVersion: 1,
    locale,
    caseTitle: caseRecord.title,
    useCaseSlug: caseRecord.use_case_slug,
    useCaseTitle: getUseCaseDefinition(caseRecord.use_case_slug, locale)?.shortTitle ?? caseRecord.use_case_slug,
    clientSnapshot: {
      displayName,
      email: user.email ?? profile?.email ?? null
    },
    latestReviewVersion: latestReview.version_number,
    latestReviewedAt: latestReview.created_at,
    readinessStatus: review.readinessStatus,
    readinessSummary: review.readinessSummary,
    resultSummary: review.summary,
    timelineNote: review.timelineNote,
    keyFacts: buildCaseSnapshotFacts(caseRecord, locale).slice(0, 6),
    materialSummary,
    riskSummary,
    nextSteps: review.nextSteps,
    supportingContextNotes: review.supportingContextNotes,
    officialReferenceLabels: review.officialReferenceLabels,
    handoffIntelligence: handoffIntelligence
      ? {
          reviewReadyStatus: handoffIntelligence.reviewReadyStatus,
          externalSummary: handoffIntelligence.externalSummary,
          issuesNeedingHumanReview: handoffIntelligence.issuesNeedingHumanReview,
          escalationTriggers: handoffIntelligence.escalationTriggers,
          supportingNotes: handoffIntelligence.supportingNotes
        }
      : null
  };
}

export async function getLatestClientHandoffRequestForCase(caseId: string): Promise<HandoffRequestRecord | null> {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from("handoff_requests")
    .select("*")
    .eq("case_id", caseId)
    .eq("client_user_id", user.id)
    .in("status", ["new", "opened", "in_review", "requested", "queued"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? parseHandoffRequestRecord(data) : null;
}

export async function getProfessionalHandoffInbox(
  limit = 12,
  options?: {
    includeClosed?: boolean;
  }
): Promise<HandoffRequestRecord[]> {
  const permissionContext = await getCurrentPermissionContext();

  if (!permissionContext.user || !canAccessProfessionalDashboard(permissionContext)) {
    return [];
  }

  const supabase = await createClient();
  const statuses = options?.includeClosed ? ["new", "opened", "in_review", "closed"] : [...activeProfessionalHandoffStatuses];

  const { data, error } = await supabase
    .from("handoff_requests")
    .select("*")
    .in("status", statuses)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  return (data ?? [])
    .filter((record) => canAccessProfessionalHandoffRecord(record, permissionContext))
    .map(parseHandoffRequestRecord);
}

export async function getProfessionalHandoffDetail(handoffId: string): Promise<HandoffRequestRecord | null> {
  const permissionContext = await getCurrentPermissionContext();

  if (!permissionContext.user || !canAccessProfessionalDashboard(permissionContext)) {
    return null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase.from("handoff_requests").select("*").eq("id", handoffId).maybeSingle();

  if (error) {
    throw error;
  }

  if (!data || !canAccessProfessionalHandoffRecord(data, permissionContext)) {
    return null;
  }

  return parseHandoffRequestRecord(data);
}

export type ProfessionalHandoffOperationResult =
  | {
      status: "updated";
      record: HandoffRequestRecord;
    }
  | {
      status: "not_found" | "unauthorized" | "invalid_status" | "invalid_notes";
      record: null;
    };

export async function updateProfessionalHandoffOperation({
  handoffId,
  nextStatus,
  internalNotes
}: {
  handoffId: string;
  nextStatus?: HandoffRequestStatus;
  internalNotes?: string;
}): Promise<ProfessionalHandoffOperationResult> {
  const permissionContext = await getCurrentPermissionContext();

  if (!permissionContext.user || !canAccessProfessionalDashboard(permissionContext)) {
    return { status: "unauthorized", record: null };
  }

  if (nextStatus && !isHandoffRequestStatus(nextStatus)) {
    return { status: "invalid_status", record: null };
  }

  if (typeof internalNotes === "string" && internalNotes.length > 2000) {
    return { status: "invalid_notes", record: null };
  }

  const supabase = await createClient();
  const { data: existing, error: existingError } = await supabase
    .from("handoff_requests")
    .select("*")
    .eq("id", handoffId)
    .maybeSingle();

  if (existingError) {
    throw existingError;
  }

  if (!existing) {
    return { status: "not_found", record: null };
  }

  if (!canAccessProfessionalHandoffRecord(existing, permissionContext)) {
    return { status: "unauthorized", record: null };
  }

  const now = new Date().toISOString();
  const update: Database["public"]["Tables"]["handoff_requests"]["Update"] = {};

  if (nextStatus && nextStatus !== existing.status) {
    update.status = nextStatus;
    update.status_updated_at = now;
    update.status_updated_by = permissionContext.user.id;

    if (!existing.professional_user_id && (nextStatus === "opened" || nextStatus === "in_review")) {
      update.professional_user_id = permissionContext.user.id;
    }

    if ((nextStatus === "opened" || nextStatus === "in_review") && !existing.opened_at) {
      update.opened_at = now;
    }

    if (nextStatus === "in_review" && !existing.in_review_at) {
      update.in_review_at = now;
    }

    if (nextStatus === "closed" && !existing.closed_at) {
      update.closed_at = now;
    }
  }

  if (typeof internalNotes === "string") {
    update.internal_notes = internalNotes.trim() || null;
  }

  if (Object.keys(update).length === 0) {
    return {
      status: "updated",
      record: parseHandoffRequestRecord(existing)
    };
  }

  const { data: updated, error: updateError } = await supabase
    .from("handoff_requests")
    .update(update)
    .eq("id", handoffId)
    .select("*")
    .single();

  if (updateError) {
    throw updateError;
  }

  return {
    status: "updated",
    record: parseHandoffRequestRecord(updated)
  };
}

export function canAccessProfessionalHandoffRecord(
  record: Tables<"handoff_requests">,
  context: Pick<PermissionContext, "user" | "professionalProfile" | "organizationMemberships" | "roles">
) {
  if (!context.user) {
    return false;
  }

  if (context.roles.includes("internal_admin")) {
    return true;
  }

  if (record.professional_user_id === context.user.id) {
    return true;
  }

  const organizationIds = getProfessionalOrganizationIds(context);

  if (record.organization_id && organizationIds.includes(record.organization_id)) {
    return true;
  }

  return (
    !record.professional_user_id &&
    !record.organization_id &&
    (context.roles.includes("professional") || context.roles.includes("organization_member"))
  );
}

function getProfessionalOrganizationIds(
  context: Pick<PermissionContext, "professionalProfile" | "organizationMemberships">
) {
  return Array.from(
    new Set(
      [
        context.professionalProfile?.intake_status === "active" ? context.professionalProfile.organization_id : null,
        ...context.organizationMemberships
          .filter((membership) => membership.status === "active")
          .map((membership) => membership.organization_id)
      ].filter((value): value is string => Boolean(value))
    )
  );
}
