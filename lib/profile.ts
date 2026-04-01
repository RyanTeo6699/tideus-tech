import type { User } from "@supabase/supabase-js";
import type { Tables, TablesUpdate } from "@/lib/database.types";

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

export const currentStatusOptions: ProfileOption[] = [
  { label: "Outside Canada", value: "outside-canada" },
  { label: "Visitor in Canada", value: "visitor" },
  { label: "Student in Canada", value: "student" },
  { label: "Worker in Canada", value: "worker" }
];

export const goalOptions: ProfileOption[] = [
  { label: "Permanent residence", value: "permanent-residence" },
  { label: "Study permit", value: "study-permit" },
  { label: "Work permit", value: "work-permit" },
  { label: "Family sponsorship", value: "family-sponsorship" }
];

export const timelineOptions: ProfileOption[] = [
  { label: "0 to 6 months", value: "0-6" },
  { label: "6 to 12 months", value: "6-12" },
  { label: "12 months or more", value: "12-plus" }
];

export const ageBandOptions: ProfileOption[] = [
  { label: "18 to 24", value: "18-24" },
  { label: "25 to 34", value: "25-34" },
  { label: "35 to 44", value: "35-44" },
  { label: "45 or more", value: "45-plus" }
];

export const maritalStatusOptions: ProfileOption[] = [
  { label: "Single", value: "single" },
  { label: "Married or common-law", value: "married-or-common-law" },
  { label: "Separated or divorced", value: "separated-or-divorced" },
  { label: "Widowed", value: "widowed" }
];

export const educationLevelOptions: ProfileOption[] = [
  { label: "Secondary or less", value: "secondary-or-less" },
  { label: "Diploma or trade", value: "diploma-or-trade" },
  { label: "Bachelor's degree", value: "bachelors" },
  { label: "Graduate degree", value: "graduate" }
];

export const englishTestStatusOptions: ProfileOption[] = [
  { label: "Completed", value: "completed" },
  { label: "Booked", value: "booked" },
  { label: "Not started", value: "not-started" }
];

export const experienceOptions: ProfileOption[] = [
  { label: "None", value: "none" },
  { label: "Under 1 year", value: "under-1-year" },
  { label: "1 to 3 years", value: "1-3-years" },
  { label: "3 or more years", value: "3-plus-years" }
];

export const jobOfferSupportOptions: ProfileOption[] = [
  { label: "Confirmed job offer support", value: "confirmed" },
  { label: "In discussion", value: "in-discussion" },
  { label: "No current support", value: "none" }
];

export const refusalHistoryOptions: ProfileOption[] = [
  { label: "Yes", value: "yes" },
  { label: "No", value: "no" }
];

const currentStatusSet = new Set(currentStatusOptions.map((option) => option.value));
const goalSet = new Set(goalOptions.map((option) => option.value));
const timelineSet = new Set(timelineOptions.map((option) => option.value));
const ageBandSet = new Set(ageBandOptions.map((option) => option.value));
const maritalStatusSet = new Set(maritalStatusOptions.map((option) => option.value));
const educationLevelSet = new Set(educationLevelOptions.map((option) => option.value));
const englishTestStatusSet = new Set(englishTestStatusOptions.map((option) => option.value));
const experienceSet = new Set(experienceOptions.map((option) => option.value));
const jobOfferSupportSet = new Set(jobOfferSupportOptions.map((option) => option.value));
const refusalHistorySet = new Set(refusalHistoryOptions.map((option) => option.value));

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

export function getAssessmentInitialValues(profile: Tables<"profiles"> | null) {
  if (!profile) {
    return {};
  }

  return {
    currentStatus: profile.current_status ?? "",
    goal: profile.target_goal ?? "",
    timeline: profile.target_timeline ?? "",
    citizenship: profile.citizenship ?? "",
    ageBand: profile.age_band ?? "",
    maritalStatus: profile.marital_status ?? "",
    educationLevel: profile.education_level ?? "",
    englishTestStatus: profile.english_test_status ?? "",
    canadianExperience: profile.canadian_experience ?? "",
    foreignExperience: profile.foreign_experience ?? "",
    jobOfferSupport: profile.job_offer_support ?? "",
    provincePreference: profile.province_preference ?? "",
    refusalHistoryFlag: hasReusableProfileContext(profile) ? (profile.refusal_history_flag ? "yes" : "no") : ""
  };
}

export function buildCompareProfileNotes(profile: Tables<"profiles"> | null) {
  if (!profile || !hasReusableProfileContext(profile)) {
    return "";
  }

  const facts = [
    fact("Current status", formatStoredValue(profile.current_status)),
    fact("Primary goal", formatStoredValue(profile.target_goal)),
    fact("Timeline", formatStoredValue(profile.target_timeline)),
    fact("Citizenship", profile.citizenship),
    fact("Education", formatStoredValue(profile.education_level)),
    fact("English test status", formatStoredValue(profile.english_test_status)),
    fact("Canadian experience", formatStoredValue(profile.canadian_experience)),
    fact("Foreign experience", formatStoredValue(profile.foreign_experience)),
    fact("Employer support", formatStoredValue(profile.job_offer_support)),
    fact("Location preference", profile.province_preference),
    fact("Refusal history", profile.refusal_history_flag ? "Yes" : "No")
  ].filter((item): item is ProfileFact => Boolean(item));

  if (facts.length === 0) {
    return "";
  }

  return ["Saved profile context:", ...facts.map((fact) => `- ${fact.label}: ${fact.value}`)].join("\n");
}

export function hasReusableProfileContext(profile: Tables<"profiles"> | null) {
  return getProfileCompletion(profile).completed > 0 || Boolean(profile?.refusal_history_flag);
}

export function buildProfileSummaryFacts(profile: Tables<"profiles"> | null): ProfileFact[] {
  if (!profile) {
    return [];
  }

  const includeRefusalHistory = hasReusableProfileContext(profile);

  const facts: Array<ProfileFact | null> = [
    fact("Current status", formatStoredValue(profile.current_status)),
    fact("Primary goal", formatStoredValue(profile.target_goal)),
    fact("Timeline", formatStoredValue(profile.target_timeline)),
    fact("Citizenship", profile.citizenship),
    fact("Age band", formatStoredValue(profile.age_band)),
    fact("Marital status", formatStoredValue(profile.marital_status)),
    fact("Education", formatStoredValue(profile.education_level)),
    fact("English test", formatStoredValue(profile.english_test_status)),
    fact("Canadian experience", formatStoredValue(profile.canadian_experience)),
    fact("Foreign experience", formatStoredValue(profile.foreign_experience)),
    fact("Job offer support", formatStoredValue(profile.job_offer_support)),
    fact("Province preference", profile.province_preference),
    includeRefusalHistory ? fact("Refusal history", profile.refusal_history_flag ? "Yes" : "No") : null
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

export function parseProfileFormInput(value: unknown): ParseResult<ProfileFormValues> {
  const body = readObject(value);

  if (!body) {
    return { success: false, message: "Invalid profile payload." };
  }

  const fullName = readOptionalString(body, "fullName");
  const currentStatus = readEnum(body, "currentStatus", currentStatusSet, "Select a current status.");
  const goal = readEnum(body, "goal", goalSet, "Select a primary goal.");
  const timeline = readEnum(body, "timeline", timelineSet, "Select a timeline.");
  const citizenship = readString(body, "citizenship", "Enter citizenship.");
  const ageBand = readEnum(body, "ageBand", ageBandSet, "Select an age band.");
  const maritalStatus = readEnum(body, "maritalStatus", maritalStatusSet, "Select a marital status.");
  const educationLevel = readEnum(body, "educationLevel", educationLevelSet, "Select an education level.");
  const englishTestStatus = readEnum(
    body,
    "englishTestStatus",
    englishTestStatusSet,
    "Select an English test status."
  );
  const canadianExperience = readEnum(
    body,
    "canadianExperience",
    experienceSet,
    "Select current Canadian experience."
  );
  const foreignExperience = readEnum(body, "foreignExperience", experienceSet, "Select current foreign experience.");
  const jobOfferSupport = readEnum(
    body,
    "jobOfferSupport",
    jobOfferSupportSet,
    "Select current job offer support."
  );
  const provincePreference = readString(body, "provincePreference", "Enter a province preference.");
  const refusalHistoryFlag = readEnum(
    body,
    "refusalHistoryFlag",
    refusalHistorySet,
    "Select refusal history."
  );

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
      fullName: fullName,
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

export function formatStoredValue(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

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

function readString(body: Record<string, unknown>, key: string, message: string): ParseResult<string> {
  const value = body[key];

  if (typeof value !== "string" || !value.trim()) {
    return { success: false, message };
  }

  return {
    success: true,
    data: value.trim()
  };
}

function readOptionalString(body: Record<string, unknown>, key: string) {
  const value = body[key];

  if (typeof value !== "string" || !value.trim()) {
    return "";
  }

  return value.trim();
}

function readEnum(
  body: Record<string, unknown>,
  key: string,
  allowedValues: Set<string>,
  message: string
): ParseResult<string> {
  const value = body[key];

  if (typeof value !== "string" || !allowedValues.has(value)) {
    return { success: false, message };
  }

  return {
    success: true,
    data: value
  };
}
