import "server-only";

import type { User } from "@supabase/supabase-js";

import type { Tables } from "@/lib/database.types";
import type { AppLocale } from "@/lib/i18n/config";
import { pickLocale } from "@/lib/i18n/workspace";
import {
  getConsumerPlanActiveCaseLimit,
  getConsumerPlanState,
  hasConsumerPlanCapability,
  isConsumerPlanEntitled,
  type ConsumerPlanCapability,
  type ConsumerPlanState
} from "@/lib/plans";
import { ensureProfile } from "@/lib/profile-server";
import { createClient } from "@/lib/supabase/server";

export type PlatformRole =
  | "anonymous"
  | "consumer"
  | "consumer_pro"
  | "professional"
  | "organization_member"
  | "internal_admin";

export type PermissionContext = {
  user: User | null;
  profile: Tables<"profiles"> | null;
  consumerPlan: ConsumerPlanState;
  professionalProfile: Tables<"professional_profiles"> | null;
  organizationMemberships: Tables<"organization_members">[];
  roles: PlatformRole[];
};

export type ConsumerCaseCreationAccess = {
  user: User | null;
  profile: Tables<"profiles"> | null;
  consumerPlan: ConsumerPlanState;
  activeCaseCount: number;
  activeCaseLimit: number;
  allowed: boolean;
};

export async function getCurrentPermissionContext(): Promise<PermissionContext> {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return buildAnonymousPermissionContext();
  }

  await ensureProfile(supabase, user);

  const [profileResult, professionalProfileResult, membershipResult] = await Promise.all([
    supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle(),
    supabase.from("professional_profiles").select("*").eq("user_id", user.id).maybeSingle(),
    supabase.from("organization_members").select("*").eq("user_id", user.id).order("created_at", { ascending: true })
  ]);

  if (profileResult.error) {
    throw profileResult.error;
  }

  if (professionalProfileResult.error) {
    throw professionalProfileResult.error;
  }

  if (membershipResult.error) {
    throw membershipResult.error;
  }

  const profile = profileResult.data ?? null;
  const professionalProfile = professionalProfileResult.data ?? null;
  const organizationMemberships = membershipResult.data ?? [];
  const consumerPlan = getConsumerPlanState(profile);

  return {
    user,
    profile,
    consumerPlan,
    professionalProfile,
    organizationMemberships,
    roles: buildPlatformRoles({
      profile,
      consumerPlan,
      professionalProfile,
      organizationMemberships
    })
  };
}

export async function getConsumerCaseCreationAccess(): Promise<ConsumerCaseCreationAccess> {
  const context = await getCurrentPermissionContext();
  const activeCaseLimit = getConsumerPlanActiveCaseLimit(context.consumerPlan);

  if (!context.user) {
    return {
      user: null,
      profile: null,
      consumerPlan: context.consumerPlan,
      activeCaseCount: 0,
      activeCaseLimit,
      allowed: false
    };
  }

  const supabase = await createClient();
  const { count, error } = await supabase
    .from("cases")
    .select("id", { count: "exact", head: true })
    .eq("user_id", context.user.id);

  if (error) {
    throw error;
  }

  const activeCaseCount = count ?? 0;

  return {
    user: context.user,
    profile: context.profile,
    consumerPlan: context.consumerPlan,
    activeCaseCount,
    activeCaseLimit,
    allowed: activeCaseCount < activeCaseLimit || isInternalAdmin(context)
  };
}

export function canAccessConsumerDashboard(context: PermissionContext) {
  return Boolean(context.user);
}

export function canAccessProfessionalDashboard(context: PermissionContext) {
  return isInternalAdmin(context) || context.roles.includes("professional") || context.roles.includes("organization_member");
}

export function canUseConsumerCapability(context: PermissionContext, capability: ConsumerPlanCapability) {
  return isInternalAdmin(context) || hasConsumerPlanCapability(context.consumerPlan, capability);
}

export function canRequestProfessionalHandoff(context: PermissionContext) {
  return canUseConsumerCapability(context, "handoff_intelligence");
}

export function formatConsumerCaseLimitMessage(access: ConsumerCaseCreationAccess, locale: AppLocale) {
  if (access.consumerPlan.tier === "pro") {
    if (!isConsumerPlanEntitled(access.consumerPlan)) {
      return pickLocale(
        locale,
        `当前 Pro 订阅未生效，系统会按 Free 上限保留 ${access.activeCaseLimit} 个活跃案件。请重新开通 Pro 后再创建新的工作台。`,
        `目前 Pro 訂閱未生效，系統會按免費版上限保留 ${access.activeCaseLimit} 個活躍案件。請重新開通 Pro 後再建立新的工作台。`
      );
    }

    return pickLocale(
      locale,
      `Pro 当前最多保留 ${access.activeCaseLimit} 个活跃案件。你已经有 ${access.activeCaseCount} 个案件，请整理旧案件或联系 Tideus 支持后再创建新的工作台。`,
      `Pro 目前最多保留 ${access.activeCaseLimit} 個活躍案件。你已經有 ${access.activeCaseCount} 個案件，請整理舊案件或聯絡 Tideus 支援後再建立新的工作台。`
    );
  }

  return pickLocale(
    locale,
    `Free 当前最多保留 ${access.activeCaseLimit} 个活跃案件。你已经有 ${access.activeCaseCount} 个案件，请升级 Pro 后再创建新的工作台。`,
    `免費版目前最多保留 ${access.activeCaseLimit} 個活躍案件。你已經有 ${access.activeCaseCount} 個案件，請升級 Pro 後再建立新的工作台。`
  );
}

export function formatProfessionalAccessDeniedMessage(locale: AppLocale) {
  return pickLocale(
    locale,
    "该账号还没有 active 专业档案或 active 组织成员关系，因此不能进入专业端收件箱。",
    "此帳號還沒有 active 專業檔案或 active 組織成員關係，因此不能進入專業端收件箱。"
  );
}

function buildAnonymousPermissionContext(): PermissionContext {
  return {
    user: null,
    profile: null,
    consumerPlan: {
      tier: "free",
      status: "active",
      activatedAt: null,
      currentPeriodEnd: null,
      source: "anonymous",
      isDefault: true
    },
    professionalProfile: null,
    organizationMemberships: [],
    roles: ["anonymous"]
  };
}

function buildPlatformRoles({
  profile,
  consumerPlan,
  professionalProfile,
  organizationMemberships
}: {
  profile: Tables<"profiles"> | null;
  consumerPlan: ConsumerPlanState;
  professionalProfile: Tables<"professional_profiles"> | null;
  organizationMemberships: Tables<"organization_members">[];
}) {
  const roles: PlatformRole[] = ["consumer"];

  if (isConsumerPlanEntitled(consumerPlan)) {
    roles.push("consumer_pro");
  }

  if (professionalProfile?.intake_status === "active") {
    roles.push("professional");
  }

  if (organizationMemberships.some((item) => item.status === "active")) {
    roles.push("organization_member");
  }

  if (readInternalAdminFlag(profile)) {
    roles.push("internal_admin");
  }

  return roles;
}

function isInternalAdmin(context: Pick<PermissionContext, "roles">) {
  return context.roles.includes("internal_admin");
}

function readInternalAdminFlag(profile: Tables<"profiles"> | null) {
  const metadata = profile?.metadata;

  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return false;
  }

  const platformAccess = (metadata as Record<string, unknown>).platformAccess;

  if (!platformAccess || typeof platformAccess !== "object" || Array.isArray(platformAccess)) {
    return false;
  }

  return (platformAccess as Record<string, unknown>).internalAdmin === true;
}
