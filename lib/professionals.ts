import "server-only";

import type { User } from "@supabase/supabase-js";

import type { Tables } from "@/lib/database.types";
import type { HandoffRequestRecord } from "@/lib/handoffs";
import type { AppLocale } from "@/lib/i18n/config";
import { pickLocale } from "@/lib/i18n/workspace";
import { canAccessProfessionalDashboard, getCurrentPermissionContext } from "@/lib/permissions";
import { getProfessionalHandoffInbox } from "@/lib/server/handoffs";
import { createClient } from "@/lib/supabase/server";

export type ProfessionalMembershipRecord = Tables<"organization_members"> & {
  organization: Tables<"organizations"> | null;
};

export type ProfessionalDashboardData = {
  user: User;
  professionalProfile: Tables<"professional_profiles"> | null;
  primaryOrganization: Tables<"organizations"> | null;
  memberships: ProfessionalMembershipRecord[];
  handoffRequests: HandoffRequestRecord[];
  handoffSummary: ProfessionalHandoffSummary;
};

export type ProfessionalHandoffSummary = {
  activeCount: number;
  newCount: number;
  openedCount: number;
  inReviewCount: number;
  assignedToCurrentUserCount: number;
  highRiskCount: number;
  missingMaterialCount: number;
};

export async function getProfessionalDashboardData(): Promise<ProfessionalDashboardData | null> {
  const permissionContext = await getCurrentPermissionContext();

  if (!permissionContext.user || !canAccessProfessionalDashboard(permissionContext)) {
    return null;
  }

  const supabase = await createClient();
  const user = permissionContext.user;

  const [professionalProfileResult, membershipResult] = await Promise.all([
    supabase.from("professional_profiles").select("*").eq("user_id", user.id).maybeSingle(),
    supabase.from("organization_members").select("*").eq("user_id", user.id).order("created_at", { ascending: true })
  ]);

  const professionalProfile = professionalProfileResult.data ?? null;
  const memberships = membershipResult.data ?? [];
  const organizationIds = Array.from(
    new Set(
      [
        professionalProfile?.organization_id ?? null,
        ...memberships.map((item) => item.organization_id)
      ].filter((value): value is string => Boolean(value))
    )
  );

  if (professionalProfileResult.error) {
    throw professionalProfileResult.error;
  }

  if (membershipResult.error) {
    throw membershipResult.error;
  }

  let organizations: Tables<"organizations">[] = [];

  if (organizationIds.length > 0) {
    const organizationsResult = await supabase.from("organizations").select("*").in("id", organizationIds);

    if (organizationsResult.error) {
      throw organizationsResult.error;
    }

    organizations = organizationsResult.data ?? [];
  }
  const organizationsById = new Map(organizations.map((item) => [item.id, item] as const));
  const membershipRecords = memberships.map((item) => ({
    ...item,
    organization: organizationsById.get(item.organization_id) ?? null
  }));
  const primaryOrganization =
    (professionalProfile?.organization_id ? organizationsById.get(professionalProfile.organization_id) ?? null : null) ??
    membershipRecords.find((item) => item.status === "active")?.organization ??
    membershipRecords[0]?.organization ??
    null;
  const handoffRequests = await getProfessionalHandoffInbox();

  return {
    user,
    professionalProfile,
    primaryOrganization,
    memberships: membershipRecords,
    handoffRequests,
    handoffSummary: buildProfessionalHandoffSummary(handoffRequests, user.id)
  };
}

export function buildProfessionalHandoffSummary(records: HandoffRequestRecord[], userId: string): ProfessionalHandoffSummary {
  return records.reduce<ProfessionalHandoffSummary>(
    (summary, item) => {
      const status = item.handoffRequest.status;
      const highRiskTotal = item.packet?.riskSummary.high ?? 0;
      const missingTotal = item.packet?.materialSummary.requiredActionCount ?? item.packet?.materialSummary.missing ?? 0;

      if (status !== "closed") {
        summary.activeCount += 1;
      }

      if (status === "new") {
        summary.newCount += 1;
      }

      if (status === "opened") {
        summary.openedCount += 1;
      }

      if (status === "in_review") {
        summary.inReviewCount += 1;
      }

      if (item.handoffRequest.professional_user_id === userId) {
        summary.assignedToCurrentUserCount += 1;
      }

      if (highRiskTotal > 0) {
        summary.highRiskCount += 1;
      }

      if (missingTotal > 0) {
        summary.missingMaterialCount += 1;
      }

      return summary;
    },
    {
      activeCount: 0,
      newCount: 0,
      openedCount: 0,
      inReviewCount: 0,
      assignedToCurrentUserCount: 0,
      highRiskCount: 0,
      missingMaterialCount: 0
    }
  );
}

export function formatProfessionalIntakeStatus(status: string | null | undefined, locale: AppLocale) {
  switch (status) {
    case "active":
      return pickLocale(locale, "已启用", "已啟用");
    case "paused":
      return pickLocale(locale, "已暂停", "已暫停");
    case "pending":
      return pickLocale(locale, "待开通", "待開通");
    default:
      return pickLocale(locale, "未设置", "未設定");
  }
}

export function formatOrganizationStatus(status: string | null | undefined, locale: AppLocale) {
  switch (status) {
    case "active":
      return pickLocale(locale, "运行中", "運行中");
    case "paused":
      return pickLocale(locale, "已暂停", "已暫停");
    case "archived":
      return pickLocale(locale, "已归档", "已歸檔");
    case "setup":
      return pickLocale(locale, "搭建中", "搭建中");
    default:
      return pickLocale(locale, "未设置", "未設定");
  }
}

export function formatOrganizationMemberRole(role: string | null | undefined, locale: AppLocale) {
  switch (role) {
    case "owner":
      return pickLocale(locale, "负责人", "負責人");
    case "admin":
      return pickLocale(locale, "管理员", "管理員");
    case "reviewer":
      return pickLocale(locale, "审阅成员", "審閱成員");
    case "member":
      return pickLocale(locale, "成员", "成員");
    default:
      return pickLocale(locale, "未设置", "未設定");
  }
}

export function formatOrganizationMemberStatus(status: string | null | undefined, locale: AppLocale) {
  switch (status) {
    case "active":
      return pickLocale(locale, "活跃", "活躍");
    case "paused":
      return pickLocale(locale, "暂停", "暫停");
    case "invited":
      return pickLocale(locale, "已邀请", "已邀請");
    default:
      return pickLocale(locale, "未设置", "未設定");
  }
}
