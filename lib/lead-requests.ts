import { defaultLocale, type AppLocale } from "@/lib/i18n/config";

const localizedOptions = {
  "zh-CN": {
    useCases: [
      { label: "访客记录", value: "visitor-record" },
      { label: "学签延期", value: "study-permit-extension" },
      { label: "两者都关注", value: "both" },
      { label: "暂时不确定", value: "not-sure" }
    ],
    stages: [
      { label: "正在了解流程", value: "researching" },
      { label: "正在整理案件", value: "organizing-now" },
      { label: "很快需要审查", value: "review-soon" },
      { label: "代表团队评估", value: "team-evaluating" }
    ],
    requestTypes: [
      { label: "预约演示", value: "demo" },
      { label: "申请早期访问", value: "early-access" },
      { label: "两者都要", value: "both" }
    ],
    messages: {
      invalidPayload: "请求内容无效。",
      invalidEmail: "请输入有效的邮箱地址。",
      invalidUseCase: "请选择感兴趣的使用场景。",
      invalidStage: "请选择当前阶段。",
      invalidRequestType: "请选择是要预约演示、申请早期访问，还是两者都要。"
    }
  },
  "zh-TW": {
    useCases: [
      { label: "訪客紀錄", value: "visitor-record" },
      { label: "學簽延期", value: "study-permit-extension" },
      { label: "兩者都關注", value: "both" },
      { label: "暫時不確定", value: "not-sure" }
    ],
    stages: [
      { label: "正在了解流程", value: "researching" },
      { label: "正在整理案件", value: "organizing-now" },
      { label: "很快需要審查", value: "review-soon" },
      { label: "代表團隊評估", value: "team-evaluating" }
    ],
    requestTypes: [
      { label: "預約示範", value: "demo" },
      { label: "申請早期存取", value: "early-access" },
      { label: "兩者都要", value: "both" }
    ],
    messages: {
      invalidPayload: "請求內容無效。",
      invalidEmail: "請輸入有效的電子郵件地址。",
      invalidUseCase: "請選擇感興趣的使用情境。",
      invalidStage: "請選擇目前階段。",
      invalidRequestType: "請選擇是要預約示範、申請早期存取，還是兩者都要。"
    }
  }
} as const;

export type LeadUseCaseInterest = (typeof localizedOptions)[typeof defaultLocale]["useCases"][number]["value"];
export type LeadCurrentStage = (typeof localizedOptions)[typeof defaultLocale]["stages"][number]["value"];
export type LeadRequestType = (typeof localizedOptions)[typeof defaultLocale]["requestTypes"][number]["value"];

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

const leadUseCaseSet = new Set<LeadUseCaseInterest>(localizedOptions[defaultLocale].useCases.map((item) => item.value));
const leadStageSet = new Set<LeadCurrentStage>(localizedOptions[defaultLocale].stages.map((item) => item.value));
const leadRequestTypeSet = new Set<LeadRequestType>(localizedOptions[defaultLocale].requestTypes.map((item) => item.value));

export function getLeadUseCaseOptions(locale: AppLocale = defaultLocale) {
  return localizedOptions[locale].useCases;
}

export function getLeadStageOptions(locale: AppLocale = defaultLocale) {
  return localizedOptions[locale].stages;
}

export function getLeadRequestTypeOptions(locale: AppLocale = defaultLocale) {
  return localizedOptions[locale].requestTypes;
}

export function parseLeadRequestInput(value: unknown, locale: AppLocale = defaultLocale): ParseResult<LeadRequestInput> {
  const body = readObject(value);
  const messages = localizedOptions[locale].messages;

  if (!body) {
    return { success: false, message: messages.invalidPayload };
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";
  const useCaseInterest = typeof body.useCaseInterest === "string" ? body.useCaseInterest : "";
  const currentStage = typeof body.currentStage === "string" ? body.currentStage : "";
  const requestType = typeof body.requestType === "string" ? body.requestType : "";
  const note = typeof body.note === "string" ? body.note.trim() : "";

  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return { success: false, message: messages.invalidEmail };
  }

  if (!leadUseCaseSet.has(useCaseInterest as LeadUseCaseInterest)) {
    return { success: false, message: messages.invalidUseCase };
  }

  if (!leadStageSet.has(currentStage as LeadCurrentStage)) {
    return { success: false, message: messages.invalidStage };
  }

  if (!leadRequestTypeSet.has(requestType as LeadRequestType)) {
    return { success: false, message: messages.invalidRequestType };
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

export const leadUseCaseOptions = getLeadUseCaseOptions();
export const leadStageOptions = getLeadStageOptions();
export const leadRequestTypeOptions = getLeadRequestTypeOptions();

function readObject(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}
