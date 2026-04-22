import type { Json, Tables } from "@/lib/database.types";
import type { AppLocale } from "@/lib/i18n/config";
import { pickLocale } from "@/lib/i18n/workspace";

export const consumerPlanTiers = ["free", "pro"] as const;

export type ConsumerPlanTier = (typeof consumerPlanTiers)[number];

export const consumerPlanStatuses = ["active", "inactive", "canceled", "expired", "trialing", "paused"] as const;

export type ConsumerPlanStatus = (typeof consumerPlanStatuses)[number];

export const consumerPlanCapabilities = [
  "active_case_slots",
  "workspace_case_questions",
  "workspace_material_actions",
  "review_delta",
  "handoff_intelligence"
] as const;

export type ConsumerPlanCapability = (typeof consumerPlanCapabilities)[number];

export type ConsumerPlanMetadata = {
  tier: ConsumerPlanTier;
  status: ConsumerPlanStatus;
  activatedAt: string | null;
  currentPeriodEnd: string | null;
  source: string | null;
};

export type ConsumerPlanState = ConsumerPlanMetadata & {
  isDefault: boolean;
};

export type ConsumerPlanDefinition = {
  tier: ConsumerPlanTier;
  badge: string;
  name: string;
  headline: string;
  summary: string;
  activation: string;
  features: string[];
  ctaLabel: string;
};

export type ConsumerCapabilityUpgradePrompt = {
  eyebrow: string;
  title: string;
  description: string;
  bullets: string[];
  primaryLabel: string;
  secondaryLabel: string;
};

const advancedConsumerCapabilitiesByTier: Record<ConsumerPlanTier, ConsumerPlanCapability[]> = {
  free: [],
  pro: [...consumerPlanCapabilities]
};

const activeCaseLimitByTier: Record<ConsumerPlanTier, number> = {
  free: 1,
  pro: 12
};

export function buildConsumerPlanMetadata(
  tier: ConsumerPlanTier,
  options?: {
    status?: ConsumerPlanStatus;
    activatedAt?: string | null;
    currentPeriodEnd?: string | null;
    source?: string | null;
  }
) {
  return {
    platformAccess: {
      consumerPlan: {
        tier,
        status: options?.status ?? "active",
        activatedAt: options?.activatedAt ?? new Date().toISOString(),
        currentPeriodEnd: options?.currentPeriodEnd ?? null,
        source: options?.source ?? "manual-activation"
      }
    }
  } as const;
}

export function getConsumerPlanState(
  profile: Pick<Tables<"profiles">, "metadata"> | null | undefined
): ConsumerPlanState {
  const durableTier = readConsumerPlanTier(readProfileString(profile, "consumer_plan_tier"));
  const durableStatus = readConsumerPlanStatus(readProfileString(profile, "consumer_plan_status"));
  const durableSource = readProfileString(profile, "consumer_plan_source");
  const durableActivatedAt = readProfileString(profile, "consumer_plan_activated_at");
  const durableCurrentPeriodEnd = readProfileString(profile, "consumer_plan_current_period_end");

  if (durableTier) {
    return {
      tier: durableTier,
      status: durableStatus ?? "active",
      activatedAt: durableActivatedAt,
      currentPeriodEnd: durableCurrentPeriodEnd,
      source: durableSource ?? (durableTier === "free" ? "default-free" : "durable-profile"),
      isDefault: false
    };
  }

  const metadata = readJsonRecord(profile?.metadata);
  const platformAccess = readJsonRecord(metadata.platformAccess);
  const consumerPlan = readJsonRecord(platformAccess.consumerPlan);
  const tier = readConsumerPlanTier(consumerPlan.tier);
  const status = readConsumerPlanStatus(consumerPlan.status) ?? "active";

  if (!tier) {
    return {
      tier: "free",
      status: "active",
      activatedAt: null,
      currentPeriodEnd: null,
      source: "default-free",
      isDefault: true
    };
  }

  return {
    tier,
    status,
    activatedAt: readOptionalString(consumerPlan.activatedAt),
    currentPeriodEnd: readOptionalString(consumerPlan.currentPeriodEnd),
    source: readOptionalString(consumerPlan.source),
    isDefault: false
  };
}

export function hasConsumerPlanCapability(
  profileOrPlan: ConsumerPlanState | Pick<Tables<"profiles">, "metadata"> | null | undefined,
  capability: ConsumerPlanCapability
) {
  const plan = isConsumerPlanState(profileOrPlan) ? profileOrPlan : getConsumerPlanState(profileOrPlan);
  return isConsumerPlanEntitled(plan) && advancedConsumerCapabilitiesByTier[plan.tier].includes(capability);
}

export function getConsumerPlanActiveCaseLimit(
  profileOrPlan: ConsumerPlanState | Pick<Tables<"profiles">, "metadata"> | null | undefined
) {
  const plan = isConsumerPlanState(profileOrPlan) ? profileOrPlan : getConsumerPlanState(profileOrPlan);
  return isConsumerPlanEntitled(plan) ? activeCaseLimitByTier[plan.tier] : activeCaseLimitByTier.free;
}

export function isConsumerPlanEntitled(plan: Pick<ConsumerPlanState, "tier" | "status">) {
  return plan.tier === "pro" && (plan.status === "active" || plan.status === "trialing");
}

export function formatConsumerPlanStatus(status: ConsumerPlanStatus | string | null | undefined, locale: AppLocale) {
  switch (status) {
    case "active":
      return pickLocale(locale, "生效中", "生效中");
    case "trialing":
      return pickLocale(locale, "试用中", "試用中");
    case "inactive":
      return pickLocale(locale, "未生效", "未生效");
    case "canceled":
      return pickLocale(locale, "已取消", "已取消");
    case "expired":
      return pickLocale(locale, "已过期", "已過期");
    case "paused":
      return pickLocale(locale, "已暂停", "已暫停");
    default:
      return pickLocale(locale, "未设置", "未設定");
  }
}

export function formatConsumerPlanName(tier: ConsumerPlanTier, locale: AppLocale) {
  if (tier === "pro") {
    return "Pro";
  }

  return pickLocale(locale, "免费版", "免費版");
}

export function getConsumerPlanDefinitions(locale: AppLocale): ConsumerPlanDefinition[] {
  return [
    {
      tier: "free",
      badge: pickLocale(locale, "当前基础层", "目前基礎層"),
      name: formatConsumerPlanName("free", locale),
      headline: pickLocale(locale, "先建立案件，再把基础工作流跑通。", "先建立案件，再把基礎工作流程跑通。"),
      summary: pickLocale(
        locale,
        "适合先把案件、材料和基础审查版本稳定保存下来。",
        "適合先把案件、材料和基礎審查版本穩定儲存下來。"
      ),
      activation: pickLocale(locale, "当前开放", "目前開放"),
      features: [
        pickLocale(locale, "保留 1 个活跃案件工作台", "保留 1 個活躍案件工作台"),
        pickLocale(locale, "保存案件工作台与材料状态", "儲存案件工作台與材料狀態"),
        pickLocale(locale, "生成结构化审查与基础导出摘要", "產生結構化審查與基礎匯出摘要"),
        pickLocale(locale, "通过公共信息问答入口创建或继续案件", "透過公共資訊提問入口建立或繼續案件")
      ],
      ctaLabel: pickLocale(locale, "开始免费使用", "開始免費使用")
    },
    {
      tier: "pro",
      badge: "Pro",
      name: "Pro",
      headline: pickLocale(locale, "把 AI 变成案件里的持续工作层。", "把 AI 變成案件裡的持續工作層。"),
      summary: pickLocale(
        locale,
        "适合需要持续追问、变化追踪和更强交接输出的用户。",
        "適合需要持續追問、變化追蹤和更強交接輸出的使用者。"
      ),
      activation: pickLocale(locale, "通过安全结账开通", "透過安全結帳開通"),
      features: [
        pickLocale(locale, "最多保留 12 个活跃案件工作台", "最多保留 12 個活躍案件工作台"),
        pickLocale(locale, "案件内 AI 提问与下一步解释", "案件內 AI 提問與下一步解釋"),
        pickLocale(locale, "材料工作动作建议与补充材料提示", "材料工作動作建議與補充材料提示"),
        pickLocale(locale, "审查版本变化对比与优先动作整理", "審查版本變化對比與優先動作整理"),
        pickLocale(locale, "更强的交接摘要、人工审阅问题与升级触发点", "更強的交接摘要、人工審閱問題與升級觸發點")
      ],
      ctaLabel: pickLocale(locale, "预约升级 Pro", "預約升級 Pro")
    }
  ];
}

export function getConsumerCapabilityUpgradePrompt(
  capability: ConsumerPlanCapability,
  locale: AppLocale
): ConsumerCapabilityUpgradePrompt {
  const primaryLabel = pickLocale(locale, "查看 Free / Pro 差异", "查看 Free / Pro 差異");
  const secondaryLabel = pickLocale(locale, "立即升级 Pro", "立即升級 Pro");
  const eyebrow = pickLocale(locale, "Pro 工作流层", "Pro 工作流程層");

  switch (capability) {
    case "active_case_slots":
      return {
        eyebrow,
        title: pickLocale(locale, "更多活跃案件属于 Pro", "更多活躍案件屬於 Pro"),
        description: pickLocale(
          locale,
          "Free 版保留 1 个活跃案件工作台，适合先跑通单一工作流。Pro 解锁多案件连续推进，避免不同申请准备混在一个案件里。",
          "免費版保留 1 個活躍案件工作台，適合先跑通單一工作流程。Pro 解鎖多案件連續推進，避免不同申請準備混在一個案件裡。"
        ),
        bullets: [
          pickLocale(locale, "为不同申请或不同家庭成员保留独立案件记录", "為不同申請或不同家庭成員保留獨立案件紀錄"),
          pickLocale(locale, "每个案件单独保留材料、审查版本与交接上下文", "每個案件單獨保留材料、審查版本與交接脈絡"),
          pickLocale(locale, "适合同时推进多个准备任务或需要长期连续跟进的用户", "適合同時推進多個準備任務或需要長期連續跟進的使用者")
        ],
        primaryLabel,
        secondaryLabel
      };
    case "workspace_case_questions":
      return {
        eyebrow,
        title: pickLocale(locale, "案件内 AI 提问属于 Pro", "案件內 AI 提問屬於 Pro"),
        description: pickLocale(
          locale,
          "Free 版保留保存案件、材料跟踪和基础审查。案件内的持续追问与 why / next-step 解释放在 Pro 工作流层。",
          "免費版保留儲存案件、材料追蹤和基礎審查。案件內的持續追問與 why / next-step 解釋放在 Pro 工作流程層。"
        ),
        bullets: [
          pickLocale(locale, "围绕当前案件、最新审查和材料状态继续追问", "圍繞目前案件、最新審查和材料狀態持續追問"),
          pickLocale(locale, "得到结构化的 whyThisMatters、nextSteps 与 trackerActions", "得到結構化的 whyThisMatters、nextSteps 與 trackerActions"),
          pickLocale(locale, "把连续 AI 协作保留在案件工作台，而不是散落在外部对话里", "把連續 AI 協作保留在案件工作台，而不是散落在外部對話裡")
        ],
        primaryLabel,
        secondaryLabel
      };
    case "workspace_material_actions":
      return {
        eyebrow,
        title: pickLocale(locale, "材料工作动作属于 Pro", "材料工作動作屬於 Pro"),
        description: pickLocale(
          locale,
          "Free 版允许整理材料和生成基础审查。单份材料的结构化解释、补充材料建议和重审时机判断放在 Pro。",
          "免費版允許整理材料並產生基礎審查。單份材料的結構化解釋、補充材料建議和重審時機判斷放在 Pro。"
        ),
        bullets: [
          pickLocale(locale, "解释为什么这份材料仍缺失或仍需人工关注", "解釋為什麼這份材料仍缺失或仍需人工關注"),
          pickLocale(locale, "提示可能还需要的补充材料与建议状态", "提示可能還需要的補充材料與建議狀態"),
          pickLocale(locale, "帮助判断是否值得立刻重新生成审查", "幫助判斷是否值得立刻重新產生審查")
        ],
        primaryLabel,
        secondaryLabel
      };
    case "review_delta":
      return {
        eyebrow,
        title: pickLocale(locale, "审查变化对比属于 Pro", "審查變化對比屬於 Pro"),
        description: pickLocale(
          locale,
          "Free 版会继续给出最新结构化审查。版本之间的改善点、剩余缺口和新增风险对比放在 Pro。",
          "免費版會繼續給出最新結構化審查。版本之間的改善點、剩餘缺口和新增風險對比放在 Pro。"
        ),
        bullets: [
          pickLocale(locale, "比较 improvedAreas、remainingGaps 与 newRisks", "比較 improvedAreas、remainingGaps 與 newRisks"),
          pickLocale(locale, "把 review-to-review 变化直接留在案件时间线上", "把 review-to-review 變化直接留在案件時間線上"),
          pickLocale(locale, "帮助你判断下一轮该更新材料还是直接交接", "幫助你判斷下一輪該更新材料還是直接交接")
        ],
        primaryLabel,
        secondaryLabel
      };
    case "handoff_intelligence":
      return {
        eyebrow,
        title: pickLocale(locale, "交接增强摘要属于 Pro", "交接增強摘要屬於 Pro"),
        description: pickLocale(
          locale,
          "Free 版保留基础导出摘要。更强的 externalSummary、人工审阅问题和 escalationTriggers 放在 Pro。",
          "免費版保留基礎匯出摘要。更強的 externalSummary、人工審閱問題和 escalationTriggers 放在 Pro。"
        ),
        bullets: [
          pickLocale(locale, "生成更适合外部自查或专业交接的摘要", "產生更適合外部自查或專業交接的摘要"),
          pickLocale(locale, "明确标出 issuesNeedingHumanReview 与 escalationTriggers", "明確標出 issuesNeedingHumanReview 與 escalationTriggers"),
          pickLocale(locale, "让交接输出和后续人工跟进更清晰", "讓交接輸出和後續人工跟進更清晰")
        ],
        primaryLabel,
        secondaryLabel
      };
  }
}

export function getConsumerCapabilityAccessDeniedMessage(
  capability: ConsumerPlanCapability,
  locale: AppLocale
) {
  switch (capability) {
    case "active_case_slots":
      return pickLocale(
        locale,
        "Free 当前最多保留 1 个活跃案件。请先升级 Pro，再创建新的案件工作台。",
        "免費版目前最多保留 1 個活躍案件。請先升級 Pro，再建立新的案件工作台。"
      );
    case "workspace_case_questions":
      return pickLocale(
        locale,
        "案件内 AI 提问属于 Pro。请先升级，再继续在工作台里追问这个案件。",
        "案件內 AI 提問屬於 Pro。請先升級，再繼續在工作台裡追問這個案件。"
      );
    case "workspace_material_actions":
      return pickLocale(
        locale,
        "材料工作动作属于 Pro。请先升级，再继续运行这项材料解释能力。",
        "材料工作動作屬於 Pro。請先升級，再繼續執行這項材料解讀能力。"
      );
    case "review_delta":
      return pickLocale(
        locale,
        "审查变化对比属于 Pro。请先升级，再查看版本之间的结构化变化。",
        "審查變化對比屬於 Pro。請先升級，再查看版本之間的結構化變化。"
      );
    case "handoff_intelligence":
      return pickLocale(
        locale,
        "交接增强摘要属于 Pro。请先升级，再解锁更强的外部审阅与交接输出。",
        "交接增強摘要屬於 Pro。請先升級，再解鎖更強的外部審閱與交接輸出。"
      );
  }
}

function isConsumerPlanState(value: unknown): value is ConsumerPlanState {
  return Boolean(value && typeof value === "object" && "tier" in value && "isDefault" in value);
}

function readConsumerPlanTier(value: Json | undefined): ConsumerPlanTier | null {
  return typeof value === "string" && consumerPlanTiers.includes(value as ConsumerPlanTier)
    ? (value as ConsumerPlanTier)
    : null;
}

function readConsumerPlanStatus(value: Json | undefined): ConsumerPlanStatus | null {
  return typeof value === "string" && consumerPlanStatuses.includes(value as ConsumerPlanStatus)
    ? (value as ConsumerPlanStatus)
    : null;
}

function readProfileString(profile: Pick<Tables<"profiles">, "metadata"> | null | undefined, key: string) {
  if (!profile || !(key in profile)) {
    return null;
  }

  const value = (profile as Record<string, unknown>)[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function readOptionalString(value: Json | undefined) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function readJsonRecord(value: Json | null | undefined): Record<string, Json> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, Json>;
}
