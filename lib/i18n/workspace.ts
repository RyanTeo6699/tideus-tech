import type { AppLocale } from "@/lib/i18n/config";

export function pickLocale(locale: AppLocale, zhCN: string, zhTW: string) {
  return locale === "zh-TW" ? zhTW : zhCN;
}

export function formatRiskSeverityLabel(severity: "low" | "medium" | "high", locale: AppLocale) {
  if (severity === "high") {
    return pickLocale(locale, "高", "高");
  }

  if (severity === "medium") {
    return pickLocale(locale, "中", "中");
  }

  return pickLocale(locale, "低", "低");
}

export function formatRegenerateRecommendationLabel(
  value: "not-needed" | "consider-after-material-update" | "recommended-now",
  locale: AppLocale
) {
  if (value === "recommended-now") {
    return pickLocale(locale, "现在重新生成", "現在重新生成");
  }

  if (value === "consider-after-material-update") {
    return pickLocale(locale, "更新材料后再生成", "更新材料後再生成");
  }

  return pickLocale(locale, "暂时不需要", "暫時不需要");
}

export function getWorkspaceCopy(locale: AppLocale) {
  return {
    actions: {
      backToOverview: pickLocale(locale, "返回总览", "返回總覽"),
      backToCases: pickLocale(locale, "返回案件列表", "返回案件列表"),
      viewCase: pickLocale(locale, "查看案件", "查看案件"),
      viewDetail: pickLocale(locale, "查看详情", "查看詳情"),
      viewAll: pickLocale(locale, "查看全部", "查看全部"),
      resume: pickLocale(locale, "继续办理", "繼續辦理"),
      resumeCase: pickLocale(locale, "继续案件", "繼續案件"),
      resumeFromReview: pickLocale(locale, "从审查继续", "從審查繼續"),
      startCase: pickLocale(locale, "开始案件", "開始案件"),
      manageProfile: pickLocale(locale, "管理资料档案", "管理資料檔案"),
      updateMaterials: pickLocale(locale, "更新材料", "更新材料"),
      exportSummary: pickLocale(locale, "导出摘要", "匯出摘要"),
      backToReview: pickLocale(locale, "返回审查结果", "返回審查結果"),
      returnToMaterials: pickLocale(locale, "返回材料页", "返回材料頁"),
      openArchive: pickLocale(locale, "打开迁移归档链接", "打開遷移歸檔連結")
    },
    shell: {
      dashboardEyebrow: pickLocale(locale, "案件总览", "案件總覽"),
      casesEyebrow: pickLocale(locale, "案件工作台", "案件工作台"),
      caseDetailEyebrow: pickLocale(locale, "案件详情", "案件詳情"),
      reviewEyebrow: pickLocale(locale, "审查结果", "審查結果"),
      materialsEyebrow: pickLocale(locale, "材料工作台", "材料工作台"),
      profileEyebrow: pickLocale(locale, "资料档案", "資料檔案")
    },
    common: {
      account: pickLocale(locale, "账户", "帳戶"),
      status: pickLocale(locale, "状态", "狀態"),
      ready: pickLocale(locale, "就绪", "就緒"),
      saving: pickLocale(locale, "保存中", "儲存中"),
      saved: pickLocale(locale, "已保存", "已儲存"),
      working: pickLocale(locale, "处理中", "處理中"),
      error: pickLocale(locale, "错误", "錯誤"),
      optional: pickLocale(locale, "可选", "可選"),
      required: pickLocale(locale, "必需", "必需"),
      yes: pickLocale(locale, "是", "是"),
      no: pickLocale(locale, "否", "否"),
      notSet: pickLocale(locale, "尚未设置", "尚未設定"),
      notCaptured: pickLocale(locale, "尚未记录", "尚未記錄"),
      noVersionYet: pickLocale(locale, "尚无版本", "尚無版本"),
      noReviewYet: pickLocale(locale, "尚未生成审查版本", "尚未生成審查版本"),
      noFile: pickLocale(locale, "尚未附加文件", "尚未附加檔案"),
      uploaded: pickLocale(locale, "已上传", "已上傳"),
      selected: pickLocale(locale, "已选择", "已選擇"),
      reference: pickLocale(locale, "参考", "參考")
    },
    dashboard: {
      sidebarTagline: pickLocale(locale, "案件工作台", "案件工作台"),
      profileSnapshot: pickLocale(locale, "资料档案概览", "資料檔案概覽"),
      currentStatus: pickLocale(locale, "当前身份", "目前身分"),
      primaryGoal: pickLocale(locale, "主要目标", "主要目標"),
      provinceFocus: pickLocale(locale, "省份偏好", "省份偏好"),
      welcome: pickLocale(locale, "欢迎回来", "歡迎回來"),
      description: pickLocale(
        locale,
        "继续推进受支持案件工作流，让 intake、材料状态与结构化审查版本保持一致。",
        "繼續推進受支援案件工作流，讓 intake、材料狀態與結構化審查版本保持一致。"
      ),
      activeCases: pickLocale(locale, "进行中案件", "進行中案件"),
      activeCasesDetail: pickLocale(
        locale,
        "仍需要继续操作、材料更新或再次生成审查的案件。",
        "仍需要繼續操作、材料更新或再次生成審查的案件。"
      ),
      reviewReady: pickLocale(locale, "可进入外部审查", "可進入外部審查"),
      reviewReadyDetail: pickLocale(
        locale,
        "最新保存审查结果显示为可审阅的案件。",
        "最新儲存審查結果顯示為可審閱的案件。"
      ),
      needsAttention: pickLocale(locale, "需要处理", "需要處理"),
      needsAttentionDetail: pickLocale(
        locale,
        "当前仍显示未就绪、需关注或尚无审查的案件。",
        "目前仍顯示未就緒、需關注或尚無審查的案件。"
      ),
      resumeCases: pickLocale(locale, "继续案件", "繼續案件"),
      resumeCasesDescription: pickLocale(
        locale,
        "总览页应直接指向下一步真实工作，而不是回到泛化工具菜单。",
        "總覽頁應直接指向下一步真實工作，而不是回到泛化工具選單。"
      ),
      noCases: pickLocale(
        locale,
        "还没有保存的案件。先从受支持场景开始，Tideus 会把 intake、材料和审查版本保存在同一条记录里。",
        "還沒有儲存的案件。先從受支援場景開始，Tideus 會把 intake、材料和審查版本保存在同一條記錄裡。"
      ),
      latestReviewNote: pickLocale(locale, "最新审查备注", "最新審查備註"),
      defaultReviewNote: pickLocale(
        locale,
        "intake 已保存。继续到材料页生成第一版审查结果。",
        "intake 已儲存。繼續到材料頁生成第一版審查結果。"
      ),
      profileCoverage: pickLocale(locale, "资料档案完整度", "資料檔案完整度"),
      lastSaved: pickLocale(locale, "最近保存", "最近儲存")
    },
    archive: {
      title: pickLocale(locale, "迁移归档", "遷移歸檔"),
      description: pickLocale(
        locale,
        "较早的 assessment、comparison 与 assistant 线程记录仅为迁移连续性而保留。它们明确从属于当前案件工作台。",
        "較早的 assessment、comparison 與 assistant 執行緒記錄僅為遷移連續性而保留。它們明確從屬於目前案件工作台。"
      ),
      summaryTitle: pickLocale(locale, "打开迁移归档链接", "打開遷移歸檔連結"),
      summaryDescription: pickLocale(
        locale,
        "仅在需要查看旧工作流记录时使用这些链接。",
        "僅在需要查看舊工作流記錄時使用這些連結。"
      ),
      secondary: pickLocale(locale, "次要", "次要"),
      linkDescription: pickLocale(locale, "仅供归档连续性使用。", "僅供歸檔連續性使用。")
    },
    cases: {
      allCasesTitle: pickLocale(locale, "已保存案件", "已儲存案件"),
      allCasesDescription: pickLocale(
        locale,
        "每个保存案件都会保留最新审查信号与正确的继续路径。",
        "每個儲存案件都會保留最新審查訊號與正確的繼續路徑。"
      ),
      caseStatus: pickLocale(locale, "案件状态", "案件狀態"),
      readiness: pickLocale(locale, "就绪度", "就緒度"),
      latestReview: pickLocale(locale, "最新审查", "最新審查")
    },
    profile: {
      title: pickLocale(locale, "管理已保存资料档案", "管理已儲存資料檔案"),
      description: pickLocale(
        locale,
        "把核心背景信息集中保存，让案件 intake 更短，并让审查工作流复用相同背景脉络。",
        "把核心背景資訊集中儲存，讓案件 intake 更短，並讓審查工作流重用相同背景脈絡。"
      ),
      savedProfileTitle: pickLocale(locale, "已保存的移民资料档案", "已儲存的移民資料檔案"),
      savedProfileDescription: pickLocale(
        locale,
        "把核心事实保存一次，Tideus 就能在案件 intake 与审查工作流中重复使用，而不用每次重问。",
        "把核心事實儲存一次，Tideus 就能在案件 intake 與審查工作流中重複使用，而不用每次重問。"
      )
    },
    materials: {
      title: pickLocale(locale, "更新案件材料", "更新案件材料"),
      description: pickLocale(
        locale,
        "整理预期材料，让系统根据真实材料状态生成结构化审查。",
        "整理預期材料，讓系統根據真實材料狀態生成結構化審查。"
      ),
      intro: pickLocale(
        locale,
        "把已有文件直接上传到对应条目，再用状态和备注说明仍缺哪些内容或哪些内容需要更新。",
        "把已有檔案直接上傳到對應條目，再用狀態和備註說明仍缺哪些內容或哪些內容需要更新。"
      ),
      allowedFormats: pickLocale(locale, "允许格式", "允許格式"),
      maxFileSize: pickLocale(locale, "单个文件大小上限", "單一檔案大小上限"),
      attachedFile: pickLocale(locale, "已附加文件", "已附加檔案"),
      noAttachedFile: pickLocale(
        locale,
        "该条目还没有附加文件。若材料仍在线下收集，也可以先继续使用状态与备注字段。",
        "該條目還沒有附加檔案。若材料仍在線下收集，也可以先繼續使用狀態與備註欄位。"
      ),
      materialStatus: pickLocale(locale, "材料状态", "材料狀態"),
      materialReference: pickLocale(locale, "材料引用名", "材料引用名稱"),
      shortNote: pickLocale(locale, "简短备注", "簡短備註"),
      shortNotePlaceholder: pickLocale(locale, "说明仍需处理的内容", "說明仍需處理的內容"),
      referencePlaceholder: pickLocale(locale, "例如：bank-statements-mar-2026.pdf", "例如：bank-statements-mar-2026.pdf"),
      chooseFileFirst: pickLocale(locale, "请先选择文件。", "請先選擇檔案。"),
      fileTooLarge: pickLocale(locale, "文件过大。", "檔案過大。"),
      unsupportedType: pickLocale(locale, "文件类型不受支持。", "檔案類型不受支援。"),
      uploading: pickLocale(locale, "正在上传文件...", "正在上傳檔案..."),
      uploadFailed: pickLocale(locale, "暂时无法上传文件。", "暫時無法上傳檔案。"),
      uploadSuccess: pickLocale(
        locale,
        "材料文件已上传。等整个材料包整理好后，再保存整体状态并决定是否重新生成审查。",
        "材料檔案已上傳。等整個材料包整理好後，再儲存整體狀態並決定是否重新生成審查。"
      ),
      saving: pickLocale(locale, "正在保存材料...", "正在儲存材料..."),
      savingAndReview: pickLocale(locale, "正在保存材料并生成审查...", "正在儲存材料並生成審查..."),
      saveError: pickLocale(locale, "暂时无法保存材料。", "暫時無法儲存材料。"),
      continueError: pickLocale(locale, "暂时无法继续。", "暫時無法繼續。"),
      saveMaterials: pickLocale(locale, "保存材料", "儲存材料"),
      saveAndGenerate: pickLocale(locale, "保存材料并生成审查", "儲存材料並生成審查"),
      savingButton: pickLocale(locale, "正在保存...", "正在儲存..."),
      generatingButton: pickLocale(locale, "正在生成审查...", "正在生成審查..."),
      uploadFile: pickLocale(locale, "上传文件", "上傳檔案"),
      replaceFile: pickLocale(locale, "替换文件", "替換檔案"),
      selectedPrefix: pickLocale(locale, "已选择", "已選擇"),
      uploadedAt: pickLocale(locale, "上传时间", "上傳時間"),
      buildImpactFallback: pickLocale(locale, "保存后再观察材料影响。", "儲存後再觀察材料影響。")
    },
    materialActions: {
      badge: pickLocale(locale, "材料工作动作", "材料工作動作"),
      title: pickLocale(locale, "让工作流告诉你这份材料下一步该怎么处理", "讓工作流告訴你這份材料下一步該怎麼處理"),
      description: pickLocale(
        locale,
        "这些动作只使用已保存的材料元数据与最新审查脉络，不读取文件内容，也不会变成泛化聊天。",
        "這些動作只使用已儲存的材料中介資料與最新審查脈絡，不讀取檔案內容，也不會變成泛化聊天。"
      ),
      initialMessage: pickLocale(locale, "选择一项材料并运行结构化动作。", "選擇一項材料並執行結構化動作。"),
      chooseMaterial: pickLocale(locale, "请先选择材料。", "請先選擇材料。"),
      loading: pickLocale(locale, "正在读取材料元数据、最新审查脉络与知识支持...", "正在讀取材料中介資料、最新審查脈絡與知識支援..."),
      success: pickLocale(locale, "结构化材料动作已保存到案件追踪记录。", "結構化材料動作已儲存到案件追蹤記錄。"),
      error: pickLocale(locale, "暂时无法运行这项材料动作。", "暫時無法執行這項材料動作。"),
      materialLabel: pickLocale(locale, "材料", "材料"),
      actionLabel: pickLocale(locale, "动作", "動作"),
      likelyType: pickLocale(locale, "可能材料类型", "可能材料類型"),
      recommendedStatus: pickLocale(locale, "建议状态", "建議狀態"),
      reviewTiming: pickLocale(locale, "重新审查时机", "重新審查時機"),
      possibleIssues: pickLocale(locale, "可能问题", "可能問題"),
      likelySupportingDocs: pickLocale(locale, "可能需要的补充材料", "可能需要的補充材料"),
      suggestedNextAction: pickLocale(locale, "建议下一步", "建議下一步"),
      reasoningSummary: pickLocale(locale, "判断摘要", "判斷摘要"),
      noIssue: pickLocale(locale, "当前没有明显的材料问题信号。", "目前沒有明顯的材料問題訊號。"),
      noSupportingDocs: pickLocale(locale, "根据当前元数据，没有额外补充材料建议。", "根據目前中介資料，沒有額外補充材料建議。"),
      noItems: pickLocale(locale, "当前没有可展示的项目。", "目前沒有可顯示的項目。"),
      options: {
        explainMissing: {
          label: pickLocale(locale, "说明为何仍缺失", "說明為何仍缺失"),
          description: pickLocale(locale, "解释这项材料为什么仍阻塞案件。", "解釋這項材料為什麼仍阻塞案件。")
        },
        explainReviewNeeded: {
          label: pickLocale(locale, "说明为何仍需审查", "說明為何仍需審查"),
          description: pickLocale(locale, "解释这份材料为什么仍值得关注。", "解釋這份材料為什麼仍值得關注。")
        },
        suggestNextAction: {
          label: pickLocale(locale, "建议下一步", "建議下一步"),
          description: pickLocale(locale, "告诉你这项材料现在最该做什么。", "告訴你這項材料現在最該做什麼。")
        },
        suggestRegenerateReview: {
          label: pickLocale(locale, "建议何时重审", "建議何時重審"),
          description: pickLocale(locale, "判断现在是否值得重新生成审查。", "判斷現在是否值得重新生成審查。")
        },
        suggestSupportingDocs: {
          label: pickLocale(locale, "建议补充材料", "建議補充材料"),
          description: pickLocale(locale, "提示可能还需要核对的补充证据。", "提示可能還需要核對的補充證據。")
        }
      }
    },
    review: {
      exportReadyBadge: pickLocale(locale, "可导出的审查摘要", "可匯出的審查摘要"),
      readinessSummary: pickLocale(locale, "就绪快照", "就緒快照"),
      timelineNote: pickLocale(locale, "时间说明", "時間說明"),
      latestReviewTimestamp: pickLocale(locale, "最新审查时间", "最新審查時間"),
      checklistReady: pickLocale(locale, "已就绪清单", "已就緒清單"),
      needsWork: pickLocale(locale, "仍需处理", "仍需處理"),
      missingItems: pickLocale(locale, "缺失项目", "缺失項目"),
      riskFlags: pickLocale(locale, "风险标记", "風險標記"),
      checklist: pickLocale(locale, "检查清单", "檢查清單"),
      checklistDescription: pickLocale(locale, "让材料状态持续可见，下一轮审查就能基于事实而不是记忆。", "讓材料狀態持續可見，下一輪審查就能基於事實而不是記憶。"),
      noMissing: pickLocale(locale, "当前没有必需材料被标记为缺失。", "目前沒有必需材料被標記為缺失。"),
      noRisk: pickLocale(locale, "当前版本没有明显的主要风险标记。", "目前版本沒有明顯的主要風險標記。"),
      nextSteps: pickLocale(locale, "下一步动作", "下一步動作"),
      reviewHistory: pickLocale(locale, "审查历史", "審查歷史"),
      reviewHistoryDescription: pickLocale(locale, "每次生成都会保存成一个版本，方便回看案件演进。", "每次生成都會儲存成一個版本，方便回看案件演進。"),
      supportingContext: pickLocale(locale, "支持性背景", "支援性背景"),
      supportingContextDescription: pickLocale(locale, "用于强化结构化审查的内部知识注释。", "用於強化結構化審查的內部知識註記。"),
      officialReferences: pickLocale(locale, "官方背景参考标签", "官方背景參考標籤"),
      officialReferencesDescription: pickLocale(locale, "仅为可追溯性而保留的参考标签，并非公共数据门户。", "僅為可追溯性而保留的參考標籤，並非公共資料入口。"),
      noSupportingContext: pickLocale(locale, "这个版本没有保存支持性背景注释。", "這個版本沒有儲存支援性背景註記。"),
      noOfficialReferences: pickLocale(locale, "这个版本没有保存官方参考标签。", "這個版本沒有儲存官方參考標籤。")
    },
    export: {
      badge: pickLocale(locale, "可交接摘要", "可交接摘要"),
      preparedDescription: pickLocale(
        locale,
        "基于 Tideus 最新保存的审查版本生成，适用于自查、内部讨论或与专业人士沟通时快速交接。",
        "基於 Tideus 最新儲存的審查版本生成，適用於自查、內部討論或與專業人士溝通時快速交接。"
      ),
      caseType: pickLocale(locale, "案件类型", "案件類型"),
      readinessStatus: pickLocale(locale, "就绪状态", "就緒狀態"),
      latestReviewTimestamp: pickLocale(locale, "最新审查时间", "最新審查時間"),
      readinessSnapshot: pickLocale(locale, "就绪快照", "就緒快照"),
      externalReviewSummary: pickLocale(locale, "外部审阅摘要", "外部審閱摘要"),
      reviewReadyStatus: pickLocale(locale, "适合外部审阅的状态", "適合外部審閱的狀態"),
      humanReviewIssues: pickLocale(locale, "需要人工关注的问题", "需要人工關注的問題"),
      escalationTriggers: pickLocale(locale, "升级触发点", "升級觸發點"),
      supportingNotes: pickLocale(locale, "补充说明", "補充說明"),
      keyFacts: pickLocale(locale, "关键案件事实", "關鍵案件事實"),
      packetSummary: pickLocale(locale, "摘要概览", "摘要概覽"),
      checklistSummary: pickLocale(locale, "清单摘要", "清單摘要"),
      riskSummary: pickLocale(locale, "风险摘要", "風險摘要"),
      checklistDetail: pickLocale(locale, "清单明细", "清單明細"),
      nextSteps: pickLocale(locale, "下一步动作", "下一步動作"),
      supportingContextNotes: pickLocale(locale, "支持性背景注释", "支援性背景註記"),
      officialReferenceLabels: pickLocale(locale, "官方参考标签", "官方參考標籤"),
      trustFooterTitle: pickLocale(locale, "信任与边界说明", "信任與邊界說明"),
      trustFooterBody: pickLocale(
        locale,
        "Tideus 提供的是案件整理、材料缺口识别与交接辅助，不提供法律意见，也不替代持牌专业人士。",
        "Tideus 提供的是案件整理、材料缺口識別與交接輔助，不提供法律意見，也不取代持牌專業人士。"
      ),
      noMissing: pickLocale(locale, "当前没有必需项目被标记为缺失。", "目前沒有必需項目被標記為缺失。"),
      noRisk: pickLocale(locale, "当前版本没有明显的主要风险标记。", "目前版本沒有明顯的主要風險標記。"),
      noSupportingContext: pickLocale(locale, "这个版本没有保存支持性背景注释。", "這個版本沒有儲存支援性背景註記。"),
      noOfficialReferences: pickLocale(locale, "这个版本没有保存官方参考标签。", "這個版本沒有儲存官方參考標籤。")
    }
  };
}
