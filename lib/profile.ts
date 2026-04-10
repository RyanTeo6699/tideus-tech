import type { User } from "@supabase/supabase-js";

import type { Tables, TablesUpdate } from "@/lib/database.types";
import { defaultLocale, type AppLocale } from "@/lib/i18n/config";

type ProfileOption = {
  label: string;
  value: string;
};

type ParseSuccess<T> = {
  success: true;
  data: T;
};

type ParseFailure = {
  success: false;
  message: string;
};

type ParseResult<T> = ParseSuccess<T> | ParseFailure;

export type ProfileFormValues = {
  fullName: string;
  currentStatus: string;
  goal: string;
  timeline: string;
  citizenship: string;
  ageBand: string;
  maritalStatus: string;
  educationLevel: string;
  englishTestStatus: string;
  canadianExperience: string;
  foreignExperience: string;
  jobOfferSupport: string;
  provincePreference: string;
  refusalHistoryFlag: string;
};

export type ProfileFact = {
  label: string;
  value: string;
};

const localizedOptions = {
  "zh-CN": {
    currentStatusOptions: [
      { label: "加拿大境外", value: "outside-canada" },
      { label: "加拿大访客身份", value: "visitor" },
      { label: "加拿大学生身份", value: "student" },
      { label: "加拿大工作身份", value: "worker" }
    ],
    goalOptions: [
      { label: "永久居民", value: "permanent-residence" },
      { label: "学签", value: "study-permit" },
      { label: "工签", value: "work-permit" },
      { label: "家庭担保", value: "family-sponsorship" }
    ],
    timelineOptions: [
      { label: "0 到 6 个月", value: "0-6" },
      { label: "6 到 12 个月", value: "6-12" },
      { label: "12 个月以上", value: "12-plus" }
    ],
    ageBandOptions: [
      { label: "18 到 24 岁", value: "18-24" },
      { label: "25 到 34 岁", value: "25-34" },
      { label: "35 到 44 岁", value: "35-44" },
      { label: "45 岁以上", value: "45-plus" }
    ],
    maritalStatusOptions: [
      { label: "单身", value: "single" },
      { label: "已婚或同居伴侣", value: "married-or-common-law" },
      { label: "分居或离婚", value: "separated-or-divorced" },
      { label: "丧偶", value: "widowed" }
    ],
    educationLevelOptions: [
      { label: "中学或以下", value: "secondary-or-less" },
      { label: "文凭或技工", value: "diploma-or-trade" },
      { label: "学士学位", value: "bachelors" },
      { label: "研究生学位", value: "graduate" }
    ],
    englishTestStatusOptions: [
      { label: "已完成", value: "completed" },
      { label: "已预约", value: "booked" },
      { label: "尚未开始", value: "not-started" }
    ],
    experienceOptions: [
      { label: "无", value: "none" },
      { label: "少于 1 年", value: "under-1-year" },
      { label: "1 到 3 年", value: "1-3-years" },
      { label: "3 年以上", value: "3-plus-years" }
    ],
    jobOfferSupportOptions: [
      { label: "已有明确 job offer 支持", value: "confirmed" },
      { label: "正在沟通中", value: "in-discussion" },
      { label: "目前没有支持", value: "none" }
    ],
    refusalHistoryOptions: [
      { label: "有", value: "yes" },
      { label: "无", value: "no" }
    ],
    factLabels: {
      currentStatus: "当前身份",
      goal: "主要目标",
      timeline: "时间规划",
      citizenship: "国籍",
      ageBand: "年龄段",
      maritalStatus: "婚姻状态",
      educationLevel: "教育程度",
      englishTestStatus: "英语考试",
      canadianExperience: "加拿大经验",
      foreignExperience: "海外经验",
      jobOfferSupport: "Job offer 支持",
      provincePreference: "省份偏好",
      refusalHistory: "拒签历史"
    },
    parseMessages: {
      invalidPayload: "资料内容无效。",
      currentStatus: "请选择当前身份。",
      goal: "请选择主要目标。",
      timeline: "请选择时间规划。",
      citizenship: "请输入国籍。",
      ageBand: "请选择年龄段。",
      maritalStatus: "请选择婚姻状态。",
      educationLevel: "请选择教育程度。",
      englishTestStatus: "请选择英语考试状态。",
      canadianExperience: "请选择加拿大经验。",
      foreignExperience: "请选择海外经验。",
      jobOfferSupport: "请选择 job offer 支持状态。",
      provincePreference: "请输入省份偏好。",
      refusalHistoryFlag: "请选择拒签历史。"
    }
  },
  "zh-TW": {
    currentStatusOptions: [
      { label: "加拿大境外", value: "outside-canada" },
      { label: "加拿大訪客身分", value: "visitor" },
      { label: "加拿大學生身分", value: "student" },
      { label: "加拿大工作身分", value: "worker" }
    ],
    goalOptions: [
      { label: "永久居民", value: "permanent-residence" },
      { label: "學簽", value: "study-permit" },
      { label: "工簽", value: "work-permit" },
      { label: "家庭擔保", value: "family-sponsorship" }
    ],
    timelineOptions: [
      { label: "0 到 6 個月", value: "0-6" },
      { label: "6 到 12 個月", value: "6-12" },
      { label: "12 個月以上", value: "12-plus" }
    ],
    ageBandOptions: [
      { label: "18 到 24 歲", value: "18-24" },
      { label: "25 到 34 歲", value: "25-34" },
      { label: "35 到 44 歲", value: "35-44" },
      { label: "45 歲以上", value: "45-plus" }
    ],
    maritalStatusOptions: [
      { label: "單身", value: "single" },
      { label: "已婚或同居伴侶", value: "married-or-common-law" },
      { label: "分居或離婚", value: "separated-or-divorced" },
      { label: "喪偶", value: "widowed" }
    ],
    educationLevelOptions: [
      { label: "中學或以下", value: "secondary-or-less" },
      { label: "文憑或技工", value: "diploma-or-trade" },
      { label: "學士學位", value: "bachelors" },
      { label: "研究所學位", value: "graduate" }
    ],
    englishTestStatusOptions: [
      { label: "已完成", value: "completed" },
      { label: "已預約", value: "booked" },
      { label: "尚未開始", value: "not-started" }
    ],
    experienceOptions: [
      { label: "無", value: "none" },
      { label: "少於 1 年", value: "under-1-year" },
      { label: "1 到 3 年", value: "1-3-years" },
      { label: "3 年以上", value: "3-plus-years" }
    ],
    jobOfferSupportOptions: [
      { label: "已有明確 job offer 支持", value: "confirmed" },
      { label: "正在討論中", value: "in-discussion" },
      { label: "目前沒有支持", value: "none" }
    ],
    refusalHistoryOptions: [
      { label: "有", value: "yes" },
      { label: "無", value: "no" }
    ],
    factLabels: {
      currentStatus: "目前身分",
      goal: "主要目標",
      timeline: "時間規劃",
      citizenship: "國籍",
      ageBand: "年齡帶",
      maritalStatus: "婚姻狀態",
      educationLevel: "教育程度",
      englishTestStatus: "英語考試",
      canadianExperience: "加拿大經驗",
      foreignExperience: "海外經驗",
      jobOfferSupport: "Job offer 支持",
      provincePreference: "省份偏好",
      refusalHistory: "拒簽歷史"
    },
    parseMessages: {
      invalidPayload: "資料內容無效。",
      currentStatus: "請選擇目前身分。",
      goal: "請選擇主要目標。",
      timeline: "請選擇時間規劃。",
      citizenship: "請輸入國籍。",
      ageBand: "請選擇年齡帶。",
      maritalStatus: "請選擇婚姻狀態。",
      educationLevel: "請選擇教育程度。",
      englishTestStatus: "請選擇英語考試狀態。",
      canadianExperience: "請選擇加拿大經驗。",
      foreignExperience: "請選擇海外經驗。",
      jobOfferSupport: "請選擇 job offer 支持狀態。",
      provincePreference: "請輸入省份偏好。",
      refusalHistoryFlag: "請選擇拒簽歷史。"
    }
  }
} as const;

export function getCurrentStatusOptions(locale: AppLocale = defaultLocale) {
  return localizedOptions[locale].currentStatusOptions;
}

export function getGoalOptions(locale: AppLocale = defaultLocale) {
  return localizedOptions[locale].goalOptions;
}

export function getTimelineOptions(locale: AppLocale = defaultLocale) {
  return localizedOptions[locale].timelineOptions;
}

export function getAgeBandOptions(locale: AppLocale = defaultLocale) {
  return localizedOptions[locale].ageBandOptions;
}

export function getMaritalStatusOptions(locale: AppLocale = defaultLocale) {
  return localizedOptions[locale].maritalStatusOptions;
}

export function getEducationLevelOptions(locale: AppLocale = defaultLocale) {
  return localizedOptions[locale].educationLevelOptions;
}

export function getEnglishTestStatusOptions(locale: AppLocale = defaultLocale) {
  return localizedOptions[locale].englishTestStatusOptions;
}

export function getExperienceOptions(locale: AppLocale = defaultLocale) {
  return localizedOptions[locale].experienceOptions;
}

export function getJobOfferSupportOptions(locale: AppLocale = defaultLocale) {
  return localizedOptions[locale].jobOfferSupportOptions;
}

export function getRefusalHistoryOptions(locale: AppLocale = defaultLocale) {
  return localizedOptions[locale].refusalHistoryOptions;
}

const currentStatusSet = new Set(getCurrentStatusOptions().map((option) => option.value));
const goalSet = new Set(getGoalOptions().map((option) => option.value));
const timelineSet = new Set(getTimelineOptions().map((option) => option.value));
const ageBandSet = new Set(getAgeBandOptions().map((option) => option.value));
const maritalStatusSet = new Set(getMaritalStatusOptions().map((option) => option.value));
const educationLevelSet = new Set(getEducationLevelOptions().map((option) => option.value));
const englishTestStatusSet = new Set(getEnglishTestStatusOptions().map((option) => option.value));
const experienceSet = new Set(getExperienceOptions().map((option) => option.value));
const jobOfferSupportSet = new Set(getJobOfferSupportOptions().map((option) => option.value));
const refusalHistorySet = new Set(getRefusalHistoryOptions().map((option) => option.value));

export function getProfileFormValues(profile: Tables<"profiles"> | null, user: User | null): ProfileFormValues {
  const fallbackName =
    typeof user?.user_metadata?.full_name === "string" && user.user_metadata.full_name.trim()
      ? user.user_metadata.full_name.trim()
      : "";
  const hasSavedContext = hasReusableProfileContext(profile);

  return {
    fullName: profile?.full_name ?? fallbackName,
    currentStatus: profile?.current_status ?? "",
    goal: profile?.target_goal ?? "",
    timeline: profile?.target_timeline ?? "",
    citizenship: profile?.citizenship ?? "",
    ageBand: profile?.age_band ?? "",
    maritalStatus: profile?.marital_status ?? "",
    educationLevel: profile?.education_level ?? "",
    englishTestStatus: profile?.english_test_status ?? "",
    canadianExperience: profile?.canadian_experience ?? "",
    foreignExperience: profile?.foreign_experience ?? "",
    jobOfferSupport: profile?.job_offer_support ?? "",
    provincePreference: profile?.province_preference ?? "",
    refusalHistoryFlag: hasSavedContext ? (profile?.refusal_history_flag ? "yes" : "no") : ""
  };
}

export function hasReusableProfileContext(profile: Tables<"profiles"> | null) {
  return getProfileCompletion(profile).completed > 0 || Boolean(profile?.refusal_history_flag);
}

export function buildProfileSummaryFacts(profile: Tables<"profiles"> | null, locale: AppLocale = defaultLocale): ProfileFact[] {
  if (!profile) {
    return [];
  }

  const labels = localizedOptions[locale].factLabels;
  const includeRefusalHistory = hasReusableProfileContext(profile);

  const facts: Array<ProfileFact | null> = [
    fact(labels.currentStatus, formatStoredValue(profile.current_status, locale)),
    fact(labels.goal, formatStoredValue(profile.target_goal, locale)),
    fact(labels.timeline, formatStoredValue(profile.target_timeline, locale)),
    fact(labels.citizenship, profile.citizenship),
    fact(labels.ageBand, formatStoredValue(profile.age_band, locale)),
    fact(labels.maritalStatus, formatStoredValue(profile.marital_status, locale)),
    fact(labels.educationLevel, formatStoredValue(profile.education_level, locale)),
    fact(labels.englishTestStatus, formatStoredValue(profile.english_test_status, locale)),
    fact(labels.canadianExperience, formatStoredValue(profile.canadian_experience, locale)),
    fact(labels.foreignExperience, formatStoredValue(profile.foreign_experience, locale)),
    fact(labels.jobOfferSupport, formatStoredValue(profile.job_offer_support, locale)),
    fact(labels.provincePreference, profile.province_preference),
    includeRefusalHistory ? fact(labels.refusalHistory, profile.refusal_history_flag ? (locale === "zh-TW" ? "有" : "有") : locale === "zh-TW" ? "無" : "无") : null
  ];

  return facts.filter((item): item is ProfileFact => Boolean(item));
}

export function getProfileCompletion(profile: Tables<"profiles"> | null) {
  if (!profile) {
    return {
      completed: 0,
      total: 12
    };
  }

  const values = [
    profile.current_status,
    profile.target_goal,
    profile.target_timeline,
    profile.citizenship,
    profile.age_band,
    profile.marital_status,
    profile.education_level,
    profile.english_test_status,
    profile.canadian_experience,
    profile.foreign_experience,
    profile.job_offer_support,
    profile.province_preference
  ];

  return {
    completed: values.filter((value) => typeof value === "string" && value.trim()).length,
    total: values.length
  };
}

export function parseProfileFormInput(value: unknown, locale: AppLocale = defaultLocale): ParseResult<ProfileFormValues> {
  const body = readObject(value);
  const messages = localizedOptions[locale].parseMessages;

  if (!body) {
    return { success: false, message: messages.invalidPayload };
  }

  const fullName = readOptionalString(body, "fullName");
  const currentStatus = readEnum(body, "currentStatus", currentStatusSet, messages.currentStatus);
  const goal = readEnum(body, "goal", goalSet, messages.goal);
  const timeline = readEnum(body, "timeline", timelineSet, messages.timeline);
  const citizenship = readString(body, "citizenship", messages.citizenship);
  const ageBand = readEnum(body, "ageBand", ageBandSet, messages.ageBand);
  const maritalStatus = readEnum(body, "maritalStatus", maritalStatusSet, messages.maritalStatus);
  const educationLevel = readEnum(body, "educationLevel", educationLevelSet, messages.educationLevel);
  const englishTestStatus = readEnum(body, "englishTestStatus", englishTestStatusSet, messages.englishTestStatus);
  const canadianExperience = readEnum(body, "canadianExperience", experienceSet, messages.canadianExperience);
  const foreignExperience = readEnum(body, "foreignExperience", experienceSet, messages.foreignExperience);
  const jobOfferSupport = readEnum(body, "jobOfferSupport", jobOfferSupportSet, messages.jobOfferSupport);
  const provincePreference = readString(body, "provincePreference", messages.provincePreference);
  const refusalHistoryFlag = readEnum(body, "refusalHistoryFlag", refusalHistorySet, messages.refusalHistoryFlag);

  if (!currentStatus.success) return currentStatus;
  if (!goal.success) return goal;
  if (!timeline.success) return timeline;
  if (!citizenship.success) return citizenship;
  if (!ageBand.success) return ageBand;
  if (!maritalStatus.success) return maritalStatus;
  if (!educationLevel.success) return educationLevel;
  if (!englishTestStatus.success) return englishTestStatus;
  if (!canadianExperience.success) return canadianExperience;
  if (!foreignExperience.success) return foreignExperience;
  if (!jobOfferSupport.success) return jobOfferSupport;
  if (!provincePreference.success) return provincePreference;
  if (!refusalHistoryFlag.success) return refusalHistoryFlag;

  return {
    success: true,
    data: {
      fullName,
      currentStatus: currentStatus.data,
      goal: goal.data,
      timeline: timeline.data,
      citizenship: citizenship.data,
      ageBand: ageBand.data,
      maritalStatus: maritalStatus.data,
      educationLevel: educationLevel.data,
      englishTestStatus: englishTestStatus.data,
      canadianExperience: canadianExperience.data,
      foreignExperience: foreignExperience.data,
      jobOfferSupport: jobOfferSupport.data,
      provincePreference: provincePreference.data,
      refusalHistoryFlag: refusalHistoryFlag.data
    }
  };
}

export function buildProfileUpdate(values: ProfileFormValues): TablesUpdate<"profiles"> {
  return {
    full_name: values.fullName.trim() || null,
    current_status: values.currentStatus,
    target_goal: values.goal,
    target_timeline: values.timeline,
    citizenship: values.citizenship.trim(),
    age_band: values.ageBand,
    marital_status: values.maritalStatus,
    education_level: values.educationLevel,
    english_test_status: values.englishTestStatus,
    canadian_experience: values.canadianExperience,
    foreign_experience: values.foreignExperience,
    job_offer_support: values.jobOfferSupport,
    province_preference: values.provincePreference.trim(),
    refusal_history_flag: values.refusalHistoryFlag === "yes"
  };
}

export function formatStoredValue(value: string | null | undefined, locale: AppLocale = defaultLocale) {
  if (!value) {
    return null;
  }

  const options = [
    ...getCurrentStatusOptions(locale),
    ...getGoalOptions(locale),
    ...getTimelineOptions(locale),
    ...getAgeBandOptions(locale),
    ...getMaritalStatusOptions(locale),
    ...getEducationLevelOptions(locale),
    ...getEnglishTestStatusOptions(locale),
    ...getExperienceOptions(locale),
    ...getJobOfferSupportOptions(locale),
    ...getRefusalHistoryOptions(locale)
  ];
  const matched = options.find((option) => option.value === value);

  if (matched) {
    return matched.label;
  }

  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export const currentStatusOptions = getCurrentStatusOptions();
export const goalOptions = getGoalOptions();
export const timelineOptions = getTimelineOptions();
export const ageBandOptions = getAgeBandOptions();
export const maritalStatusOptions = getMaritalStatusOptions();
export const educationLevelOptions = getEducationLevelOptions();
export const englishTestStatusOptions = getEnglishTestStatusOptions();
export const experienceOptions = getExperienceOptions();
export const jobOfferSupportOptions = getJobOfferSupportOptions();
export const refusalHistoryOptions = getRefusalHistoryOptions();

function fact(label: string, value: string | null) {
  if (!value) {
    return null;
  }

  return { label, value };
}

function readObject(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function readOptionalString(body: Record<string, unknown>, key: string) {
  return typeof body[key] === "string" ? body[key].trim() : "";
}

function readString(body: Record<string, unknown>, key: string, error: string): ParseResult<string> {
  const value = typeof body[key] === "string" ? body[key].trim() : "";

  if (!value) {
    return { success: false, message: error };
  }

  return { success: true, data: value };
}

function readEnum(
  body: Record<string, unknown>,
  key: string,
  set: Set<string>,
  error: string
): ParseResult<string> {
  const value = typeof body[key] === "string" ? body[key].trim() : "";

  if (!set.has(value)) {
    return { success: false, message: error };
  }

  return { success: true, data: value };
}
