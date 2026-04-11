import type { CaseKnowledgeInput, CaseKnowledgePackLocalePayload } from "@/lib/knowledge/types";
import type { CaseDocumentStatus } from "@/lib/case-workflows";
import type { AppLocale } from "@/lib/i18n/config";
import { pickLocale } from "@/lib/i18n/workspace";

export function buildStudyPermitExtensionKnowledgePackLocale(locale: AppLocale): CaseKnowledgePackLocalePayload {
  return {
    processingTimeNote: {
      label: pickLocale(locale, "官方处理时间需复核", "官方處理時間需複核"),
      note: pickLocale(
        locale,
        "在最终交接前，请复核 IRCC 当前处理时间。Tideus 只把它作为内部工作流提醒，不把它当作实时官方数据。",
        "在最終交接前，請複核 IRCC 目前處理時間。Tideus 只把它作為內部工作流程提醒，不把它當作即時官方資料。"
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
        label: "IRCC: Extend your study permit",
        referenceType: "official-context",
        trustLevel: "official-context",
        freshness: "seed-pack"
      },
      {
        label: "IRCC: Study permit extension document checklist",
        referenceType: "materials-guidance",
        trustLevel: "official-context",
        freshness: "seed-pack"
      }
    ],
    officialReferenceLabels: [
      "IRCC: Check processing times",
      "IRCC: Extend your study permit",
      "IRCC: Study permit extension document checklist"
    ],
    supportingContextNotes: [
      pickLocale(
        locale,
        "学签延期案件应把在学状态、学习进度、资金与延期时间线整理成同一个干净记录。",
        "學簽延期案件應把在學狀態、學習進度、資金與延期時間線整理成同一個乾淨記錄。"
      ),
      pickLocale(
        locale,
        "学校文件与资金证明应真正支撑申请中的延期周期，而不只是证明手上有一些材料。",
        "學校文件與資金證明應真正支撐申請中的延期週期，而不只是證明手上有一些材料。"
      ),
      pickLocale(
        locale,
        "内部知识层只服务学签延期工作流、审查输出和交接准备，不把这个场景扩展成公共信息门户。",
        "內部知識層只服務學簽延期工作流程、審查輸出和交接準備，不把這個場景擴展成公共資訊入口。"
      )
    ],
    materialsGuidanceNotes: [
      {
        documentKey: "enrolment-letter",
        label: pickLocale(locale, "在学证明", "在學證明"),
        note: pickLocale(
          locale,
          "内部知识提示：在学证明应是最新版本，并与申请中的延期周期保持一致。",
          "內部知識提示：在學證明應是最新版本，並與申請中的延期週期保持一致。"
        ),
        appliesToStatuses: ["missing", "collecting", "needs-refresh", "ready"] satisfies CaseDocumentStatus[]
      },
      {
        documentKey: "transcript-or-progress",
        label: pickLocale(locale, "成绩单或学习进度材料", "成績單或學習進度材料"),
        note: pickLocale(
          locale,
          "内部知识提示：进度材料应让学业状态与任何延误原因都能被快速理解。",
          "內部知識提示：進度材料應讓學業狀態與任何延誤原因都能被快速理解。"
        ),
        appliesToStatuses: ["missing", "collecting", "needs-refresh", "ready"] satisfies CaseDocumentStatus[]
      },
      {
        documentKey: "proof-of-funds",
        label: pickLocale(locale, "资金证明", "資金證明"),
        note: pickLocale(
          locale,
          "内部知识提示：资金证明应覆盖剩余学习周期与生活成本，而不只是补充学校文件。",
          "內部知識提示：資金證明應覆蓋剩餘學習週期與生活成本，而不只是補充學校文件。"
        ),
        appliesToStatuses: ["missing", "collecting", "needs-refresh", "ready"] satisfies CaseDocumentStatus[]
      },
      {
        documentKey: "extension-explanation",
        label: pickLocale(locale, "延期说明信", "延期說明信"),
        note: pickLocale(
          locale,
          "内部知识提示：说明信应把课程时间线、资金、当前身份与延期原因串联成一体。",
          "內部知識提示：說明信應把課程時間線、資金、目前身分與延期原因串聯成一體。"
        ),
        appliesToStatuses: ["missing", "collecting", "needs-refresh", "ready"] satisfies CaseDocumentStatus[]
      }
    ],
    scenarioSpecificWarnings: [
      pickLocale(
        locale,
        "学签延期工作流聚焦当前学习身份下的延期准备，不替代更广泛的长期路径规划。",
        "學簽延期工作流程聚焦目前學習身分下的延期準備，不取代更廣泛的長期路徑規劃。"
      )
    ]
  };
}

export function buildStudyPermitExtensionScenarioWarnings(input: CaseKnowledgeInput) {
  const { intake } = input;
  const warnings: string[] = [];

  if (intake.currentStatus && intake.currentStatus !== "student") {
    warnings.push(
      pickLocale(
        input.language,
        "这个学签延期工作流默认你是在以学生身份准备延期，因此需要先确认当前身份是否匹配。",
        "這個學簽延期工作流程預設你是在以學生身分準備延期，因此需要先確認目前身分是否匹配。"
      )
    );
  }

  if (intake.scenarioProgressStatus !== "good-standing" || input.intakeNormalization?.explanationSignals.schoolProgressConcern) {
    warnings.push(
      pickLocale(
        input.language,
        "学业状态、学费或学习进度问题，应在把包件视为干净前被直接说明。",
        "學業狀態、學費或學習進度問題，應在把包件視為乾淨前被直接說明。"
      )
    );
  }

  if (intake.supportEvidenceStatus !== "ready") {
    warnings.push(
      pickLocale(
        input.language,
        "当前在学证明是这个场景中的核心材料，在最终交接前应先补齐或更新。",
        "目前在學證明是這個場景中的核心材料，在最終交接前應先補齊或更新。"
      )
    );
  }

  return warnings;
}
