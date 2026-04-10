import type { Tables } from "@/lib/database.types";
import { formatStoredValue, hasReusableProfileContext, type ProfileFact } from "@/lib/profile";

// Legacy profile adapters support archived assessment/comparison routes only.
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

  return ["Saved profile context:", ...facts.map((item) => `- ${item.label}: ${item.value}`)].join("\n");
}

function fact(label: string, value: string | null) {
  if (!value) {
    return null;
  }

  return { label, value };
}
