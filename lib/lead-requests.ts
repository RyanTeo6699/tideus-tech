export const leadUseCaseOptions = [
  { label: "Visitor Record", value: "visitor-record" },
  { label: "Study Permit Extension", value: "study-permit-extension" },
  { label: "Both", value: "both" },
  { label: "Not sure yet", value: "not-sure" }
] as const;

export const leadStageOptions = [
  { label: "Researching the process", value: "researching" },
  { label: "Organizing a case now", value: "organizing-now" },
  { label: "Need review soon", value: "review-soon" },
  { label: "Evaluating for a team", value: "team-evaluating" }
] as const;

export const leadRequestTypeOptions = [
  { label: "Book a demo", value: "demo" },
  { label: "Request early access", value: "early-access" },
  { label: "Both", value: "both" }
] as const;

export type LeadUseCaseInterest = (typeof leadUseCaseOptions)[number]["value"];
export type LeadCurrentStage = (typeof leadStageOptions)[number]["value"];
export type LeadRequestType = (typeof leadRequestTypeOptions)[number]["value"];

export type LeadRequestInput = {
  email: string;
  useCaseInterest: LeadUseCaseInterest;
  currentStage: LeadCurrentStage;
  requestType: LeadRequestType;
  note: string;
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

const leadUseCaseSet = new Set<LeadUseCaseInterest>(leadUseCaseOptions.map((item) => item.value));
const leadStageSet = new Set<LeadCurrentStage>(leadStageOptions.map((item) => item.value));
const leadRequestTypeSet = new Set<LeadRequestType>(leadRequestTypeOptions.map((item) => item.value));

export function parseLeadRequestInput(value: unknown): ParseResult<LeadRequestInput> {
  const body = readObject(value);

  if (!body) {
    return { success: false, message: "Invalid request payload." };
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";
  const useCaseInterest = typeof body.useCaseInterest === "string" ? body.useCaseInterest : "";
  const currentStage = typeof body.currentStage === "string" ? body.currentStage : "";
  const requestType = typeof body.requestType === "string" ? body.requestType : "";
  const note = typeof body.note === "string" ? body.note.trim() : "";

  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return { success: false, message: "Enter a valid email address." };
  }

  if (!leadUseCaseSet.has(useCaseInterest as LeadUseCaseInterest)) {
    return { success: false, message: "Select a use case of interest." };
  }

  if (!leadStageSet.has(currentStage as LeadCurrentStage)) {
    return { success: false, message: "Select the current stage." };
  }

  if (!leadRequestTypeSet.has(requestType as LeadRequestType)) {
    return { success: false, message: "Select whether you want a demo, early access, or both." };
  }

  return {
    success: true,
    data: {
      email,
      useCaseInterest: useCaseInterest as LeadUseCaseInterest,
      currentStage: currentStage as LeadCurrentStage,
      requestType: requestType as LeadRequestType,
      note
    }
  };
}

export function getLeadRequestFlags(requestType: LeadRequestType) {
  return {
    wantsDemo: requestType === "demo" || requestType === "both",
    wantsEarlyAccess: requestType === "early-access" || requestType === "both"
  };
}

function readObject(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}
