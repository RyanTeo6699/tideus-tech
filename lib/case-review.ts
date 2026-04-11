import type { Json } from "@/lib/database.types";
import {
  formatUseCaseLabel,
  getCaseIntakeFields,
  getUseCaseDefinition,
  isSupportedUseCase,
  type CaseDocumentStatus,
  type CaseIntakeValues,
  type CaseReadinessStatus,
  type SupportedUseCaseSlug
} from "@/lib/case-workflows";
import { defaultLocale, type AppLocale } from "@/lib/i18n/config";
import { pickLocale } from "@/lib/i18n/workspace";

export type CaseChecklistItem = {
  key: string;
  label: string;
  detail: string;
  status: CaseDocumentStatus;
  materialReference?: string | null;
};

export type CaseRiskFlag = {
  label: string;
  severity: "low" | "medium" | "high";
  detail: string;
};

export type CaseReviewResult = {
  readinessStatus: CaseReadinessStatus;
  readinessSummary: string;
  summary: string;
  timelineNote: string;
  checklist: CaseChecklistItem[];
  missingItems: string[];
  riskFlags: CaseRiskFlag[];
  nextSteps: string[];
  supportingContextNotes: string[];
  officialReferenceLabels: string[];
};

export type CaseCreateInput = {
  useCase: SupportedUseCaseSlug;
  intake: CaseIntakeValues;
};

export type CaseDocumentUpdateInput = {
  documents: Array<{
    id: string;
    status: CaseDocumentStatus;
    materialReference?: string;
    notes?: string;
  }>;
};

export type StoredChecklistItem = CaseChecklistItem;
export type StoredRiskFlag = CaseRiskFlag;

type ParseSuccess<T> = {
  success: true;
  data: T;
};

type ParseFailure = {
  success: false;
  message: string;
};

type ParseResult<T> = ParseSuccess<T> | ParseFailure;

type ReviewDocument = {
  key: string;
  label: string;
  description: string;
  required: boolean;
  status: CaseDocumentStatus;
  material_reference?: string | null;
};

const documentStatusSet = new Set<CaseDocumentStatus>(["missing", "collecting", "needs-refresh", "ready", "not-applicable"]);

export function parseCaseCreateInput(value: unknown, locale: AppLocale = defaultLocale): ParseResult<CaseCreateInput> {
  const body = readObject(value);

  if (!body) {
    return { success: false, message: pickLocale(locale, "案件请求无效。", "案件請求無效。") };
  }

  const useCaseValue = body.useCase;

  if (typeof useCaseValue !== "string" || !isSupportedUseCase(useCaseValue)) {
    return { success: false, message: pickLocale(locale, "请选择受支持的使用场景。", "請選擇受支援的使用場景。") };
  }

  const definition = getUseCaseDefinition(useCaseValue, locale);

  if (!definition) {
    return { success: false, message: pickLocale(locale, "请选择受支持的使用场景。", "請選擇受支援的使用場景。") };
  }

  const intake = getEmptyCaseIntakeValues();

  for (const field of getCaseIntakeFields(definition, locale)) {
    const rawValue = body[field.name];

    if (field.type === "date") {
      if (typeof rawValue !== "string" || !rawValue.trim()) {
        if (field.required) {
          return {
            success: false,
            message: pickLocale(locale, `${field.label}为必填项。`, `${field.label}為必填項。`)
          };
        }

        continue;
      }

      if (!/^\d{4}-\d{2}-\d{2}$/.test(rawValue.trim())) {
        return {
          success: false,
          message: pickLocale(locale, `${field.label}必须是有效日期。`, `${field.label}必須是有效日期。`)
        };
      }

      intake[field.name] = rawValue.trim();
      continue;
    }

    if (typeof rawValue !== "string") {
      if (field.required) {
        return {
          success: false,
          message: pickLocale(locale, `${field.label}为必填项。`, `${field.label}為必填項。`)
        };
      }

      continue;
    }

    const trimmed = rawValue.trim();

    if (field.required && !trimmed) {
      return {
        success: false,
        message: pickLocale(locale, `${field.label}为必填项。`, `${field.label}為必填項。`)
      };
    }

    intake[field.name] = trimmed;
  }

  return {
    success: true,
    data: {
      useCase: useCaseValue,
      intake
    }
  };
}

export function parseCaseDocumentsInput(value: unknown, locale: AppLocale = defaultLocale): ParseResult<CaseDocumentUpdateInput> {
  const body = readObject(value);

  if (!body || !Array.isArray(body.documents)) {
    return { success: false, message: pickLocale(locale, "材料请求无效。", "材料請求無效。") };
  }

  if (body.documents.length === 0) {
    return { success: false, message: pickLocale(locale, "继续前至少更新一项材料。", "繼續前至少更新一項材料。") };
  }

  const documents = body.documents.map((item) => {
    const record = readObject(item);

    if (!record || typeof record.id !== "string" || !record.id.trim()) {
      return null;
    }

    if (typeof record.status !== "string" || !documentStatusSet.has(record.status as CaseDocumentStatus)) {
      return null;
    }

    return {
      id: record.id.trim(),
      status: record.status as CaseDocumentStatus,
      materialReference: typeof record.materialReference === "string" ? record.materialReference.trim() : "",
      notes: typeof record.notes === "string" ? record.notes.trim() : ""
    };
  });

  if (documents.some((item) => item === null)) {
    return { success: false, message: pickLocale(locale, "每一行材料都必须包含有效状态。", "每一列材料都必須包含有效狀態。") };
  }

  return {
    success: true,
    data: {
      documents: documents as CaseDocumentUpdateInput["documents"]
    }
  };
}

export function buildCaseReviewResult(
  useCaseSlug: SupportedUseCaseSlug,
  intake: CaseIntakeValues,
  documents: ReviewDocument[],
  locale: AppLocale = defaultLocale
): CaseReviewResult {
  const definition = getUseCaseDefinition(useCaseSlug, locale);

  if (!definition) {
    throw new Error(pickLocale(locale, "不支持的使用场景。", "不支援的使用場景。"));
  }

  const checklist = documents.map((document) => ({
    key: document.key,
    label: document.label,
    detail: buildChecklistDetail(useCaseSlug, intake, document, locale),
    status: document.status,
    materialReference: document.material_reference ?? null
  }));
  const missingRequiredDocuments = checklist.filter((item) =>
    item.status === "missing" || item.status === "collecting" ? isRequiredDocument(documents, item.key) : false
  );
  const staleDocuments = checklist.filter((item) => item.status === "needs-refresh");
  const riskFlags = buildRiskFlags(useCaseSlug, intake, missingRequiredDocuments.length, staleDocuments.length, locale);
  const readinessStatus = determineReadinessStatus(missingRequiredDocuments.length, staleDocuments.length, riskFlags);
  const timelineNote = buildTimelineNote(intake, locale);
  const summary = buildSummary(useCaseSlug, intake, readinessStatus, missingRequiredDocuments.length, riskFlags.length, locale);
  const readinessSummary = buildReadinessSummary(
    readinessStatus,
    missingRequiredDocuments.length,
    staleDocuments.length,
    riskFlags.length,
    locale
  );
  const missingItems = missingRequiredDocuments.map((item) => item.label);
  const nextSteps = buildNextSteps(useCaseSlug, intake, missingRequiredDocuments, riskFlags, locale);

  return {
    readinessStatus,
    readinessSummary,
    summary,
    timelineNote,
    checklist,
    missingItems,
    riskFlags,
    nextSteps,
    supportingContextNotes: [],
    officialReferenceLabels: []
  };
}

export function getDocumentProgressCounts(items: Array<{ status: CaseDocumentStatus; required: boolean }>) {
  let ready = 0;
  let actionNeeded = 0;

  for (const item of items) {
    if (item.status === "ready" || item.status === "not-applicable") {
      ready += 1;
      continue;
    }

    if (item.required) {
      actionNeeded += 1;
    }
  }

  return {
    ready,
    actionNeeded,
    total: items.length
  };
}

export function parseStoredChecklistItems(value: Json) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    const record = readObject(item);

    if (
      !record ||
      typeof record.key !== "string" ||
      typeof record.label !== "string" ||
      typeof record.detail !== "string" ||
      typeof record.status !== "string" ||
      !documentStatusSet.has(record.status as CaseDocumentStatus)
    ) {
      return [];
    }

    return [
      {
        key: record.key,
        label: record.label,
        detail: record.detail,
        status: record.status as CaseDocumentStatus,
        materialReference: typeof record.materialReference === "string" ? record.materialReference : null
      }
    ];
  });
}

export function parseStoredRiskFlags(value: Json) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    const record = readObject(item);

    if (
      !record ||
      typeof record.label !== "string" ||
      typeof record.severity !== "string" ||
      typeof record.detail !== "string" ||
      !["low", "medium", "high"].includes(record.severity)
    ) {
      return [];
    }

    return [
      {
        label: record.label,
        severity: record.severity as CaseRiskFlag["severity"],
        detail: record.detail
      }
    ];
  });
}

export function getEmptyCaseIntakeValues(): CaseIntakeValues {
  return {
    title: "",
    currentStatus: "",
    currentPermitExpiry: "",
    urgency: "",
    passportValidity: "",
    proofOfFundsStatus: "",
    refusalOrComplianceIssues: "",
    applicationReason: "",
    supportEntityName: "",
    supportEvidenceStatus: "",
    scenarioProgressStatus: "",
    notes: ""
  };
}

function determineReadinessStatus(
  missingRequiredCount: number,
  staleDocumentsCount: number,
  riskFlags: CaseRiskFlag[]
): CaseReadinessStatus {
  const highRiskCount = riskFlags.filter((item) => item.severity === "high").length;
  const mediumRiskCount = riskFlags.filter((item) => item.severity === "medium").length;

  if (missingRequiredCount >= 3 || highRiskCount >= 2) {
    return "not-ready";
  }

  if (missingRequiredCount >= 1 || highRiskCount >= 1 || staleDocumentsCount >= 2 || mediumRiskCount >= 3) {
    return "needs-attention";
  }

  if (staleDocumentsCount >= 1 || mediumRiskCount >= 1) {
    return "almost-ready";
  }

  return "review-ready";
}

function buildRiskFlags(
  useCaseSlug: SupportedUseCaseSlug,
  intake: CaseIntakeValues,
  missingRequiredCount: number,
  staleDocumentsCount: number,
  locale: AppLocale = defaultLocale
) {
  const riskFlags: CaseRiskFlag[] = [];
  const daysUntilExpiry = readDaysUntil(intake.currentPermitExpiry);

  if (daysUntilExpiry !== null && daysUntilExpiry <= 30) {
    riskFlags.push({
      label: pickLocale(locale, "时间压力", "時間壓力"),
      severity: "high",
      detail: pickLocale(locale, "当前临时身份会在 30 天内到期，因此材料补齐与说明质量必须立刻推进。", "目前臨時身分會在 30 天內到期，因此材料補齊與說明品質必須立刻推進。")
    });
  } else if (daysUntilExpiry !== null && daysUntilExpiry <= 60) {
    riskFlags.push({
      label: pickLocale(locale, "提交窗口较短", "提交窗口較短"),
      severity: "medium",
      detail: pickLocale(locale, "当前可提交窗口较短，未解决的材料问题会很快拖慢整个包件。", "目前可提交窗口較短，未解決的材料問題會很快拖慢整個包件。")
    });
  }

  if (intake.passportValidity === "under-6") {
    riskFlags.push({
      label: pickLocale(locale, "护照有效期", "護照效期"),
      severity: "high",
      detail: pickLocale(locale, "护照有效期少于六个月时，若不尽早处理，案件会明显变弱或变复杂。", "護照效期少於六個月時，若不盡早處理，案件會明顯變弱或變複雜。")
    });
  }

  if (useCaseSlug === "visitor-record" && intake.currentStatus !== "visitor") {
    riskFlags.push({
      label: pickLocale(locale, "当前身份不匹配", "目前身分不匹配"),
      severity: "medium",
      detail: pickLocale(locale, "这条工作流默认是在访客身份基础上准备延期，因此在按常规案件处理前应先确认当前身份。", "這條工作流預設是在訪客身分基礎上準備延期，因此在按常規案件處理前應先確認目前身分。")
    });
  }

  if (useCaseSlug === "study-permit-extension" && intake.currentStatus !== "student") {
    riskFlags.push({
      label: pickLocale(locale, "学生身份不匹配", "學生身分不匹配"),
      severity: "high",
      detail: pickLocale(locale, "这条工作流默认是处于有效学生身份下的延期准备，因此在按标准延期案件处理前应先确认当前身份。", "這條工作流預設是處於有效學生身分下的延期準備，因此在按標準延期案件處理前應先確認目前身分。")
    });
  }

  if (intake.refusalOrComplianceIssues === "yes") {
    riskFlags.push({
      label: pickLocale(locale, "既往问题需解释", "既往問題需解釋"),
      severity: "high",
      detail: pickLocale(locale, "既往拒签或合规问题意味着说明材料需要先收紧，再把案件视为可审阅。", "既往拒簽或合規問題意味著說明材料需要先收緊，再把案件視為可審閱。")
    });
  } else if (intake.refusalOrComplianceIssues === "unclear") {
    riskFlags.push({
      label: pickLocale(locale, "历史情况不清楚", "歷史情況不清楚"),
      severity: "medium",
      detail: pickLocale(locale, "案件历史尚未完全明确，因此当前审查不应默认记录是干净的。", "案件歷史尚未完全明確，因此目前審查不應預設記錄是乾淨的。")
    });
  }

  if (intake.proofOfFundsStatus === "missing") {
    riskFlags.push({
      label: pickLocale(locale, "资金证明缺失", "資金證明缺失"),
      severity: "high",
      detail: pickLocale(locale, "所需资金支持证据仍然缺失，会明显削弱整个包件。", "所需資金支持證據仍然缺失，會明顯削弱整個包件。")
    });
  } else if (intake.proofOfFundsStatus === "partial") {
    riskFlags.push({
      label: pickLocale(locale, "资金证明不完整", "資金證明不完整"),
      severity: "medium",
      detail: pickLocale(locale, "资金材料虽然存在，但仍显得不完整，因此在进入审查前可能还需要再整理一轮。", "資金材料雖然存在，但仍顯得不完整，因此在進入審查前可能還需要再整理一輪。")
    });
  }

  if (missingRequiredCount >= 2) {
    riskFlags.push({
      label: pickLocale(locale, "核心材料缺失", "核心材料缺失"),
      severity: "high",
      detail: pickLocale(locale, "仍有多份必需材料缺失，因此当前包件还不适合进入干净的专业审查。", "仍有多份必需材料缺失，因此目前包件還不適合進入乾淨的專業審查。")
    });
  } else if (staleDocumentsCount >= 1) {
    riskFlags.push({
      label: pickLocale(locale, "材料需更新", "材料需更新"),
      severity: "medium",
      detail: pickLocale(locale, "至少有一份必需材料需要更新后，案件才能被视为干净。", "至少有一份必需材料需要更新後，案件才能被視為乾淨。")
    });
  }

  if (useCaseSlug === "visitor-record") {
    if (intake.supportEvidenceStatus === "missing" && intake.applicationReason === "family-or-host") {
      riskFlags.push({
        label: pickLocale(locale, "邀请方支持缺口", "邀請方支援缺口"),
        severity: "medium",
        detail: pickLocale(locale, "案件依赖邀请方或家人支持，但相应支持证据仍未补齐。", "案件依賴邀請方或家人支援，但相應支援證據仍未補齊。")
      });
    }

    if (intake.supportEvidenceStatus === "partial" && intake.applicationReason === "family-or-host") {
      riskFlags.push({
        label: pickLocale(locale, "邀请方支持仍不完整", "邀請方支援仍不完整"),
        severity: "medium",
        detail: pickLocale(locale, "邀请方或家人支持证据虽已存在，但仍需要更完整的最终版本，案件才会显得更扎实。", "邀請方或家人支援證據雖已存在，但仍需要更完整的最終版本，案件才會顯得更扎實。")
      });
    }

    if (intake.applicationReason === "family-or-host" && !intake.supportEntityName.trim()) {
      riskFlags.push({
        label: pickLocale(locale, "支持来源不清楚", "支援來源不清楚"),
        severity: "medium",
        detail: pickLocale(locale, "看起来此次停留依赖邀请方或家人支持，但资料收集中并未清楚写明支持主体。", "看起來此次停留依賴邀請方或家人支援，但資料收集中並未清楚寫明支援主體。")
      });
    }

    if (intake.scenarioProgressStatus === "weak") {
      riskFlags.push({
        label: pickLocale(locale, "临时停留意图偏弱", "臨時停留意圖偏弱"),
        severity: "high",
        detail: pickLocale(locale, "当前对临时停留意图的解释仍然偏弱，这是访客记录准备中最常见的压力点之一。", "目前對臨時停留意圖的解釋仍然偏弱，這是訪客紀錄準備中最常見的壓力點之一。")
      });
    } else if (intake.scenarioProgressStatus === "partial") {
      riskFlags.push({
        label: pickLocale(locale, "临时停留意图仍需收紧", "臨時停留意圖仍需收緊"),
        severity: "medium",
        detail: pickLocale(locale, "临时停留意图说明虽然存在，但仍需收紧后案件才会显得更完整。", "臨時停留意圖說明雖然存在，但仍需收緊後案件才會顯得更完整。")
      });
    }

    if (intake.applicationReason === "awaiting-next-step" && intake.scenarioProgressStatus !== "clear") {
      riskFlags.push({
        label: pickLocale(locale, "过渡计划尚不清楚", "過渡計畫尚不清楚"),
        severity: "medium",
        detail: pickLocale(locale, "如果此次停留建立在等待下一步移民安排上，说明仍应保持临时性、时间边界与证据支持。", "如果此次停留建立在等待下一步移民安排上，說明仍應保持臨時性、時間邊界與證據支援。")
      });
    }
  }

  if (useCaseSlug === "study-permit-extension") {
    if (intake.supportEvidenceStatus === "missing") {
      riskFlags.push({
        label: pickLocale(locale, "在学证明缺失", "在學證明缺失"),
        severity: "high",
        detail: pickLocale(locale, "当前在学证明缺失，这是学签延期材料包中的核心缺口。", "目前在學證明缺失，這是學簽延期材料包中的核心缺口。")
      });
    }

    if (intake.supportEvidenceStatus === "partial") {
      riskFlags.push({
        label: pickLocale(locale, "在学证明仍不完整", "在學證明仍不完整"),
        severity: "medium",
        detail: pickLocale(locale, "虽然已有在学记录，但材料包仍需要一份更新且与延期周期匹配的学校文件。", "雖然已有在學記錄，但材料包仍需要一份更新且與延期週期匹配的學校文件。")
      });
    }

    if (intake.scenarioProgressStatus === "at-risk") {
      riskFlags.push({
        label: pickLocale(locale, "学业或学费问题", "學業或學費問題"),
        severity: "high",
        detail: pickLocale(locale, "学业状态或学费情况看起来仍未解决，因此在视为可提交前需要补强说明。", "學業狀態或學費情況看起來仍未解決，因此在視為可提交前需要補強說明。")
      });
    } else if (intake.scenarioProgressStatus === "needs-explanation") {
      riskFlags.push({
        label: pickLocale(locale, "需要学业说明", "需要學業說明"),
        severity: "medium",
        detail: pickLocale(locale, "延期案件仍有推进空间，但学业或学费记录需要更清楚的解释。", "延期案件仍有推進空間，但學業或學費記錄需要更清楚的解釋。")
      });
    }
  }

  return dedupeRiskFlags(riskFlags);
}

function buildTimelineNote(intake: CaseIntakeValues, locale: AppLocale = defaultLocale) {
  const daysUntilExpiry = readDaysUntil(intake.currentPermitExpiry);

  if (daysUntilExpiry === null) {
    return pickLocale(locale, "请先确认真实到期日期，才能正确安排案件节奏。", "請先確認真實到期日期，才能正確安排案件節奏。");
  }

  if (daysUntilExpiry <= 30) {
    return pickLocale(locale, "当前身份会在 30 天内到期，下一轮工作应优先处理能真正支撑提交的关键材料。", "目前身分會在 30 天內到期，下一輪工作應優先處理能真正支撐提交的關鍵材料。");
  }

  if (daysUntilExpiry <= 60) {
    return pickLocale(locale, "仍有时间收紧案件，但材料包应尽快从资料收集进入补齐阶段。", "仍有時間收緊案件，但材料包應盡快從資料收集進入補齊階段。");
  }

  return pickLocale(locale, "案件仍有操作时间，因此在进入交接前应优先追求完整度。", "案件仍有操作時間，因此在進入交接前應優先追求完整度。");
}

function buildSummary(
  useCaseSlug: SupportedUseCaseSlug,
  intake: CaseIntakeValues,
  readinessStatus: CaseReadinessStatus,
  missingRequiredCount: number,
  riskCount: number,
  locale: AppLocale = defaultLocale
) {
  if (useCaseSlug === "visitor-record") {
    if (readinessStatus === "review-ready") {
      return pickLocale(locale, "这份访客记录材料包已经足够体现时间边界、支持逻辑与结构清晰度，可作为可信的讨论或交接摘要保存。", "這份訪客紀錄材料包已經足夠體現時間邊界、支援邏輯與結構清晰度，可作為可信的討論或交接摘要儲存。");
    }

    if (readinessStatus === "almost-ready") {
      return pickLocale(locale, "访客记录材料包已经接近完成，但最后一轮仍需把临时停留叙事收紧，并让支持材料更容易快速扫读。", "訪客紀錄材料包已經接近完成，但最後一輪仍需把臨時停留敘事收緊，並讓支援材料更容易快速掃讀。");
    }

    if (readinessStatus === "needs-attention") {
      return missingRequiredCount > 0
        ? pickLocale(locale, "访客记录材料包仍缺少一个或多个核心项目，因此下一轮应先把文件补齐，再把它视为可交接。", "訪客紀錄材料包仍缺少一個或多個核心項目，因此下一輪應先把檔案補齊，再把它視為可交接。")
        : pickLocale(locale, "访客记录材料包仍可继续推进，但说明材料与支持故事还需要再收紧一轮，才适合专业讨论。", "訪客紀錄材料包仍可繼續推進，但說明材料與支援敘事還需要再收緊一輪，才適合專業討論。");
    }

    if (intake.scenarioProgressStatus === "weak") {
      return pickLocale(locale, "访客记录材料包目前还未就绪，因为临时停留意图说明仍偏弱，支持证据之间也还不够紧密。", "訪客紀錄材料包目前還未就緒，因為臨時停留意圖說明仍偏弱，支援證據之間也還不夠緊密。");
    }

    return pickLocale(locale, "访客记录材料包目前还未就绪，因为仍有过多核心材料或说明问题未关闭。", "訪客紀錄材料包目前還未就緒，因為仍有過多核心材料或說明問題未關閉。");
  }

  if (readinessStatus === "review-ready") {
    return pickLocale(locale, "这份学签延期材料包已经足够内部一致，可保存为较干净的审查摘要；在学、资金与说明材料基本齐备。", "這份學簽延期材料包已經足夠內部一致，可儲存為較乾淨的審查摘要；在學、資金與說明材料基本齊備。");
  }

  if (readinessStatus === "almost-ready") {
    return pickLocale(locale, "学签延期材料包已经接近完成，但最后一轮仍需让学校记录、资金证明与延期说明更加一致。", "學簽延期材料包已經接近完成，但最後一輪仍需讓學校記錄、資金證明與延期說明更加一致。");
  }

  if (readinessStatus === "needs-attention") {
    return missingRequiredCount > 0
      ? pickLocale(locale, "学签延期材料包仍缺少核心学校或资金材料，因此下一轮应先补齐这些内容，再把案件视为可交接。", "學簽延期材料包仍缺少核心學校或資金材料，因此下一輪應先補齊這些內容，再把案件視為可交接。")
      : pickLocale(locale, "学签延期材料包仍可继续推进，但学业记录或延期说明还需要再收紧一轮。", "學簽延期材料包仍可繼續推進，但學業記錄或延期說明還需要再收緊一輪。");
  }

  if (intake.scenarioProgressStatus === "at-risk") {
    return pickLocale(locale, "学签延期材料包目前还未就绪，因为学业或学费记录仍构成明显审查风险，需在交接前直接处理。", "學簽延期材料包目前還未就緒，因為學業或學費記錄仍構成明顯審查風險，需在交接前直接處理。");
  }

  return riskCount > 0
    ? pickLocale(locale, "学签延期材料包目前还未就绪，因为未解决的材料与说明压力仍让案件在审查中暴露过多。", "學簽延期材料包目前還未就緒，因為未解決的材料與說明壓力仍讓案件在審查中暴露過多。")
    : pickLocale(locale, "学签延期材料包目前还未就绪，因为仍有过多核心材料未关闭。", "學簽延期材料包目前還未就緒，因為仍有過多核心材料未關閉。");
}

function buildReadinessSummary(
  readinessStatus: CaseReadinessStatus,
  missingRequiredCount: number,
  staleDocumentsCount: number,
  riskCount: number,
  locale: AppLocale = defaultLocale
) {
  const labels: Record<CaseReadinessStatus, string> = {
    "not-ready": pickLocale(locale, "案件在进入正式审查前仍需要先完成材料收紧。", "案件在進入正式審查前仍需要先完成材料收緊。"),
    "needs-attention": pickLocale(locale, "案件可以继续推进，但下一轮必须先关闭主要缺口。", "案件可以繼續推進，但下一輪必須先關閉主要缺口。"),
    "almost-ready": pickLocale(locale, "材料包已经接近完成，剩余工作更多是收紧而不是重建。", "材料包已經接近完成，剩餘工作更多是收緊而不是重建。"),
    "review-ready": pickLocale(locale, "材料包已经足够有序，可进入聚焦式专业审查或最终质量检查。", "材料包已經足夠有序，可進入聚焦式專業審查或最終品質檢查。")
  };

  const detail =
    missingRequiredCount === 0 && staleDocumentsCount === 0 && riskCount === 0
      ? pickLocale(locale, "这个保存版本里已没有必需缺口、需刷新项目或可见风险标记。", "這個儲存版本裡已沒有必需缺口、需刷新項目或可見風險標記。")
      : pickLocale(
          locale,
          `仍有 ${missingRequiredCount} 个必需项目需要处理，${staleDocumentsCount} 个项目需要刷新，且还有 ${riskCount} 个风险标记可见。`,
          `仍有 ${missingRequiredCount} 個必需項目需要處理，${staleDocumentsCount} 個項目需要刷新，且還有 ${riskCount} 個風險標記可見。`
        );

  return `${labels[readinessStatus]} ${detail}`;
}

function buildNextSteps(
  useCaseSlug: SupportedUseCaseSlug,
  intake: CaseIntakeValues,
  missingRequiredDocuments: CaseChecklistItem[],
  riskFlags: CaseRiskFlag[],
  locale: AppLocale = defaultLocale
) {
  const nextSteps: string[] = [];
  const missingKeys = new Set(missingRequiredDocuments.map((item) => item.key));
  const hasHighRisk = riskFlags.some((item) => item.severity === "high");

  if (useCaseSlug === "visitor-record") {
    if (missingKeys.has("extension-explanation") || missingKeys.has("temporary-intent-support")) {
      nextSteps.push(
        pickLocale(locale, "把说明信与临时停留支持材料一起完成，让案件能够清楚说明为什么继续停留、为什么仍属临时性质，以及最终如何结束。", "把說明信與臨時停留支持材料一起完成，讓案件能夠清楚說明為什麼繼續停留、為什麼仍屬臨時性質，以及最終如何結束。")
      );
    } else if (missingRequiredDocuments[0]) {
      nextSteps.push(
        pickLocale(locale, `先补齐 ${missingRequiredDocuments[0].label}，让下一轮审查面对的是完整包件而不是半成品。`, `先補齊 ${missingRequiredDocuments[0].label}，讓下一輪審查面對的是完整包件而不是半成品。`)
      );
    } else {
      nextSteps.push(pickLocale(locale, "先冻结当前材料包版本，让下一轮审查从稳定基线开始。", "先凍結目前材料包版本，讓下一輪審查從穩定基線開始。"));
    }

    if (intake.applicationReason === "family-or-host" && intake.supportEvidenceStatus !== "ready") {
      nextSteps.push(
        pickLocale(locale, "补齐最终邀请函、住宿安排或邀请方支持记录，避免案件只依赖模糊的家人 / 邀请方叙事。", "補齊最終邀請函、住宿安排或邀請方支援記錄，避免案件只依賴模糊的家人 / 邀請方敘事。")
      );
    }

    if (intake.proofOfFundsStatus !== "ready") {
      nextSteps.push(
        pickLocale(locale, "补入与停留时长和说明信叙事相匹配的最新资金证明。", "補入與停留時長和說明信敘事相匹配的最新資金證明。")
      );
    }

    if (intake.scenarioProgressStatus === "clear") {
      nextSteps.push(
        pickLocale(locale, "再做一轮干净的说明收紧，让临时停留、支持证据与离境逻辑保持一致。", "再做一輪乾淨的說明收緊，讓臨時停留、支援證據與離境邏輯保持一致。")
      );
    }
  } else {
    if (
      missingKeys.has("enrolment-letter") ||
      missingKeys.has("transcript-or-progress") ||
      missingKeys.has("tuition-evidence")
    ) {
      nextSteps.push(
        pickLocale(locale, "把在学、进度与学费记录整理成一套相互匹配的材料包，让学校脉络能被一次看清。", "把在學、進度與學費記錄整理成一套相互匹配的材料包，讓學校脈絡能被一次看清。")
      );
    } else if (missingRequiredDocuments[0]) {
      nextSteps.push(
        pickLocale(locale, `先补齐 ${missingRequiredDocuments[0].label}，让下一轮审查面对的是完整包件而不是半成品。`, `先補齊 ${missingRequiredDocuments[0].label}，讓下一輪審查面對的是完整包件而不是半成品。`)
      );
    } else {
      nextSteps.push(pickLocale(locale, "先冻结当前材料包版本，让下一轮审查从稳定基线开始。", "先凍結目前材料包版本，讓下一輪審查從穩定基線開始。"));
    }

    if (intake.supportEvidenceStatus !== "ready") {
      nextSteps.push(
        pickLocale(locale, "补齐与实际延期周期相匹配的最新在学证明或等效学校文件。", "補齊與實際延期週期相匹配的最新在學證明或等效學校文件。")
      );
    }

    if (intake.scenarioProgressStatus !== "good-standing") {
      nextSteps.push(
        pickLocale(locale, "准备一段简短的学业进度或学费说明，让延期申请仍显得可信且有条理。", "準備一段簡短的學業進度或學費說明，讓延期申請仍顯得可信且有條理。")
      );
    } else {
      nextSteps.push(
        pickLocale(locale, "确认说明信已经把学习计划、资金情况与延期原因连成一条清晰叙事。", "確認說明信已經把學習計畫、資金情況與延期原因連成一條清晰敘事。")
      );
    }

    if (intake.proofOfFundsStatus !== "ready") {
      nextSteps.push(
        pickLocale(locale, "补入覆盖剩余学习周期的最新资金证据，避免延期包件只靠学校材料支撑。", "補入覆蓋剩餘學習週期的最新資金證據，避免延期包件只靠學校材料支撐。")
      );
    }

    if (intake.applicationReason === "program-transition" || intake.applicationReason === "registration-delay") {
      nextSteps.push(
        pickLocale(locale, "在说明信中明确写清项目时间安排或过渡问题，让延期申请显得受控而非临时拼凑。", "在說明信中明確寫清項目時間安排或過渡問題，讓延期申請顯得受控而非臨時拼湊。")
      );
    }
  }

  nextSteps.push(
    hasHighRisk
      ? pickLocale(locale, "先把高风险点记录清楚，再转交专业人士审阅。", "先把高風險點記錄清楚，再轉交專業人士審閱。")
      : pickLocale(locale, "再做一轮材料检查，确认每份必需文件都有清楚的引用或最终版本。", "再做一輪材料檢查，確認每份必需文件都有清楚的引用或最終版本。")
  );

  if (intake.urgency === "under-30") {
    nextSteps.push(pickLocale(locale, "为本周剩余证据工作排出明确时间，避免提交窗口继续收缩。", "為本週剩餘證據工作排出明確時間，避免提交窗口繼續收縮。"));
  }

  return dedupeStrings(nextSteps).slice(0, 5);
}

function buildChecklistDetail(
  useCaseSlug: SupportedUseCaseSlug,
  intake: CaseIntakeValues,
  document: ReviewDocument,
  locale: AppLocale = defaultLocale
) {
  const statusNotes: Record<CaseDocumentStatus, string> = {
    missing: pickLocale(locale, "当前材料包里仍缺少这项内容，应在下一轮正式审查前先解决。", "目前材料包裡仍缺少這項內容，應在下一輪正式審查前先解決。"),
    collecting: pickLocale(locale, "该项仍在收集中，下一轮审查前请确认最终版本与清晰引用名。", "該項仍在收集中，下一輪審查前請確認最終版本與清晰引用名稱。"),
    "needs-refresh": pickLocale(locale, "目前已有版本，但在把材料包视为干净前，应先刷新、更新或替换。", "目前已有版本，但在把材料包視為乾淨前，應先刷新、更新或替換。"),
    ready: pickLocale(locale, "该项已在当前材料包中可用，可进入下一轮审查。", "該項已在目前材料包中可用，可進入下一輪審查。"),
    "not-applicable": pickLocale(locale, "按当前案件框架，该项被标记为不适用。", "按目前案件框架，該項被標記為不適用。")
  };

  return [document.description, buildDocumentExpectation(useCaseSlug, intake, document.key, locale), statusNotes[document.status]]
    .filter(Boolean)
    .join(" ");
}

function buildDocumentExpectation(
  useCaseSlug: SupportedUseCaseSlug,
  intake: CaseIntakeValues,
  documentKey: string,
  locale: AppLocale = defaultLocale
) {
  if (useCaseSlug === "visitor-record") {
    const notes: Partial<Record<string, string>> = {
      "passport-copy": pickLocale(locale, "应使用身份页，以及能体现当前有效期或相关旅行历史的页面。", "應使用身分頁，以及能體現目前效期或相關旅行歷史的頁面。"),
      "current-status-proof": pickLocale(locale, "身份证明应与当前访客停留状态以及案件时间线中的到期日期保持一致。", "身分證明應與目前訪客停留狀態以及案件時間線中的到期日期保持一致。"),
      "extension-explanation": pickLocale(locale, "说明信应解释为什么继续停留、为何仍属临时性质、由谁支持，以及停留最终如何结束。", "說明信應解釋為什麼繼續停留、為何仍屬臨時性質、由誰支持，以及停留最終如何結束。"),
      "proof-of-funds": pickLocale(locale, "资金记录应与剩余停留时长，以及说明信中的支持叙事保持一致。", "資金記錄應與剩餘停留時長，以及說明信中的支援敘事保持一致。"),
      "temporary-intent-support": pickLocale(locale, "这项材料应用来支持离境逻辑、后续安排或下一步合法身份计划，同时避免案件显得没有时间边界。", "這項材料應用來支援離境邏輯、後續安排或下一步合法身分計畫，同時避免案件顯得沒有時間邊界。")
    };

    if (documentKey === "host-or-accommodation") {
      return intake.applicationReason === "family-or-host"
        ? pickLocale(locale, "由于停留依赖邀请方或家人支持，这项证据应清楚写明人物、地点与支持安排。", "由於停留依賴邀請方或家人支援，這項證據應清楚寫明人物、地點與支援安排。")
        : pickLocale(locale, "只有在住宿或邀请方支持属于案件一部分时才需要这项材料。", "只有在住宿或邀請方支援屬於案件一部分時才需要這項材料。");
    }

    return notes[documentKey] ?? "";
  }

  const notes: Partial<Record<string, string>> = {
    "passport-copy": pickLocale(locale, "应使用身份页以及能体现延期期间有效期的相关页面。", "應使用身分頁以及能體現延期期間效期的相關頁面。"),
    "current-study-permit": pickLocale(locale, "当前学签应与案件中的到期日期及延期时间线保持一致。", "目前學簽應與案件中的到期日期及延期時間線保持一致。"),
    "enrolment-letter": pickLocale(locale, "该文件应与当前学期或延期周期匹配，并清楚确认学生与学校的关系。", "該文件應與目前學期或延期週期匹配，並清楚確認學生與學校的關係。"),
    "transcript-or-progress": pickLocale(locale, "应使用最新的进度、在学状态或出勤证据，让学业脉络能被一次看清。", "應使用最新的進度、在學狀態或出勤證據，讓學業脈絡能被一次看清。"),
    "tuition-evidence": pickLocale(locale, "付款证明或付款计划记录应与延期申请中说明的剩余学习周期保持一致。", "付款證明或付款計畫記錄應與延期申請中說明的剩餘學習週期保持一致。"),
    "proof-of-funds": pickLocale(locale, "资金记录应能支持剩余学习期与生活成本，而不只是补充学校文件。", "資金記錄應能支援剩餘學習期與生活成本，而不只是補充學校文件。"),
    "extension-explanation": pickLocale(locale, "说明信应解释为什么需要延期，以及学习计划、资金与身份历史如何仍能形成连贯叙事。", "說明信應解釋為什麼需要延期，以及學習計畫、資金與身分歷史如何仍能形成連貫敘事。")
  };

  return notes[documentKey] ?? "";
}

function readDaysUntil(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const now = new Date();
  const target = new Date(`${value}T00:00:00Z`);

  if (Number.isNaN(target.getTime())) {
    return null;
  }

  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function readObject(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function isRequiredDocument(documents: ReviewDocument[], key: string) {
  return documents.find((item) => item.key === key)?.required ?? false;
}

function dedupeStrings(items: string[]) {
  return items.filter((item, index) => items.indexOf(item) === index);
}

function dedupeRiskFlags(items: CaseRiskFlag[]) {
  return items.filter((item, index) => items.findIndex((entry) => entry.label === item.label) === index);
}
