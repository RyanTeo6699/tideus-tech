import type { CaseKnowledgeInput, CaseScenarioKnowledge } from "@/lib/knowledge/types";
import type { CaseDocumentStatus } from "@/lib/case-workflows";
import { pickLocale } from "@/lib/i18n/workspace";

export function buildVisitorRecordKnowledge(input: CaseKnowledgeInput): CaseScenarioKnowledge {
  return {
    processingTimeNote: {
      label: pickLocale(input.language, "官方处理时间需复核", "官方處理時間需複核"),
      note: pickLocale(
        input.language,
        "在最终交接前，请复核 IRCC 当前处理时间。Tideus 仅把它作为工作流提醒，不把它当作实时官方数据。",
        "在最終交接前，請複核 IRCC 目前處理時間。Tideus 只把它作為工作流程提醒，不把它當作即時官方資料。"
      ),
      referenceLabel: "IRCC: Check processing times",
      freshness: "live-check-required"
    },
    references: [
      {
        label: "IRCC: Check processing times",
        referenceType: "processing-time",
        trustLevel: "official-context",
        freshness: "live-check-required"
      },
      {
        label: "IRCC: Extend your stay in Canada as a visitor",
        referenceType: "official-context",
        trustLevel: "official-context",
        freshness: "static-adapter"
      },
      {
        label: "IRCC: Visitor record application guide",
        referenceType: "materials-guidance",
        trustLevel: "official-context",
        freshness: "static-adapter"
      }
    ],
    officialReferenceLabels: [
      "IRCC: Check processing times",
      "IRCC: Extend your stay in Canada as a visitor",
      "IRCC: Visitor record application guide"
    ],
    supportingContextNotes: [
      pickLocale(
        input.language,
        "访客记录案件应把申请停留控制在清晰、可支撑且具有时间边界的范围内。",
        "訪客紀錄案件應把申請停留控制在清晰、可支撐且具有時間邊界的範圍內。"
      ),
      pickLocale(
        input.language,
        "资金、当前身份、护照有效期以及延期说明，是这个场景里最核心的工作流锚点。",
        "資金、目前身分、護照效期以及延期說明，是這個場景裡最核心的工作流程錨點。"
      )
    ],
    materialsGuidanceNotes: [
      {
        documentKey: "extension-explanation",
        label: pickLocale(input.language, "延期说明信", "延期說明信"),
        note: pickLocale(
          input.language,
          "内部知识提示：说明信应把延期原因、临时居留意图、支持记录与计划结束点连成一个完整故事。",
          "內部知識提示：說明信應把延期原因、臨時居留意圖、支持記錄與計畫結束點連成一個完整故事。"
        ),
        appliesToStatuses: ["missing", "collecting", "needs-refresh", "ready"] satisfies CaseDocumentStatus[]
      },
      {
        documentKey: "proof-of-funds",
        label: pickLocale(input.language, "资金证明", "資金證明"),
        note: pickLocale(
          input.language,
          "内部知识提示：资金证明应与申请停留时长，以及说明信中的支持叙事保持一致。",
          "內部知識提示：資金證明應與申請停留時長，以及說明信中的支持敘事保持一致。"
        ),
        appliesToStatuses: ["missing", "collecting", "needs-refresh", "ready"] satisfies CaseDocumentStatus[]
      },
      {
        documentKey: "temporary-intent-support",
        label: pickLocale(input.language, "临时居留意图支持材料", "臨時居留意圖支持材料"),
        note: pickLocale(
          input.language,
          "内部知识提示：临时居留意图支持材料应让这次停留看起来有时间边界，而不是无限延伸。",
          "內部知識提示：臨時居留意圖支持材料應讓這次停留看起來有時間邊界，而不是無限延伸。"
        ),
        appliesToStatuses: ["missing", "collecting", "needs-refresh", "ready"] satisfies CaseDocumentStatus[]
      }
    ],
    scenarioSpecificWarnings: buildVisitorRecordWarnings(input)
  };
}

function buildVisitorRecordWarnings(input: CaseKnowledgeInput) {
  const { intake } = input;
  const warnings: string[] = [];

  if (intake.currentStatus && intake.currentStatus !== "visitor") {
    warnings.push(
      pickLocale(
        input.language,
        "这个访客记录工作流默认你是在准备访客身份延期，因此需要先确认当前身份是否匹配。",
        "這個訪客紀錄工作流程預設你是在準備訪客身分延期，因此需要先確認目前身分是否匹配。"
      )
    );
  }

  if (intake.scenarioProgressStatus === "weak" || input.intakeNormalization?.explanationSignals.temporaryIntentConcern) {
    warnings.push(
      pickLocale(
        input.language,
        "临时居留意图是这个场景中的关键压力点，必须由明确事实支持，而不是泛泛说明。",
        "臨時居留意圖是這個場景中的關鍵壓力點，必須由明確事實支持，而不是泛泛說明。"
      )
    );
  }

  if (intake.applicationReason === "family-or-host" && intake.supportEvidenceStatus !== "ready") {
    warnings.push(
      pickLocale(
        input.language,
        "接待方或住宿支持已经进入案件叙事，但对应的支持记录还不够干净。",
        "接待方或住宿支持已經進入案件敘事，但對應的支持記錄還不夠乾淨。"
      )
    );
  }

  return warnings;
}
