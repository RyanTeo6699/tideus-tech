import "server-only";

import type { User } from "@supabase/supabase-js";

import type { Tables } from "@/lib/database.types";
import type { HandoffPacketSummary, HandoffRequestRecord } from "@/lib/handoffs";
import { parseHandoffRequestRecord } from "@/lib/handoffs";
import {
  buildCaseSnapshotFacts,
  getCaseHandoffIntelligenceSnapshot,
  getCaseMaterialStatusCounts,
  getCaseReviewSnapshot
} from "@/lib/cases";
import { getUseCaseDefinition } from "@/lib/case-workflows";
import type { AppLocale } from "@/lib/i18n/config";
import { pickLocale } from "@/lib/i18n/workspace";
import { createClient } from "@/lib/supabase/server";

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
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? parseHandoffRequestRecord(data) : null;
}

export async function getProfessionalHandoffInbox(limit = 12): Promise<HandoffRequestRecord[]> {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from("handoff_requests")
    .select("*")
    .in("status", ["requested", "queued"])
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  return (data ?? []).map(parseHandoffRequestRecord);
}
