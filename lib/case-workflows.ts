import { defaultLocale, type AppLocale } from "@/lib/i18n/config";

export type SupportedUseCaseSlug = "visitor-record" | "study-permit-extension";

export type CaseReadinessStatus = "not-ready" | "needs-attention" | "almost-ready" | "review-ready";

export type CaseDocumentStatus = "missing" | "collecting" | "needs-refresh" | "ready" | "not-applicable";

export type CaseSelectOption = {
  label: string;
  value: string;
};

export type CaseIntakeValues = {
  title: string;
  currentStatus: string;
  currentPermitExpiry: string;
  urgency: string;
  passportValidity: string;
  proofOfFundsStatus: string;
  refusalOrComplianceIssues: string;
  applicationReason: string;
  supportEntityName: string;
  supportEvidenceStatus: string;
  scenarioProgressStatus: string;
  notes: string;
};

export type CaseIntakeField = {
  name: keyof CaseIntakeValues;
  label: string;
  type: "text" | "textarea" | "select" | "date";
  placeholder?: string;
  helper?: string;
  options?: CaseSelectOption[];
  required?: boolean;
  wide?: boolean;
};

export type ExpectedDocumentDefinition = {
  key: string;
  label: string;
  description: string;
  required: boolean;
};

export type UseCaseDefinition = {
  slug: SupportedUseCaseSlug;
  shortTitle: string;
  title: string;
  eyebrow: string;
  homepageLabel: string;
  description: string;
  detailSummary: string;
  outcomeSummary: string;
  whatYouGet: string[];
  fitSignals: string[];
  notFor: string[];
  intakeTitle: string;
  intakeDescription: string;
  materialsTitle: string;
  reviewTitle: string;
  specificFields: CaseIntakeField[];
  expectedDocuments: ExpectedDocumentDefinition[];
};

const localizedLabels: Record<
  AppLocale,
  {
    currentStatusOptions: CaseSelectOption[];
    urgencyOptions: CaseSelectOption[];
    passportValidityOptions: CaseSelectOption[];
    proofOfFundsOptions: CaseSelectOption[];
    complianceOptions: CaseSelectOption[];
    supportEvidenceOptions: CaseSelectOption[];
    visitorRecord: Omit<UseCaseDefinition, "slug" | "specificFields" | "expectedDocuments"> & {
      specificFields: CaseIntakeField[];
      expectedDocuments: ExpectedDocumentDefinition[];
    };
    studyPermitExtension: Omit<UseCaseDefinition, "slug" | "specificFields" | "expectedDocuments"> & {
      specificFields: CaseIntakeField[];
      expectedDocuments: ExpectedDocumentDefinition[];
    };
    commonFields: CaseIntakeField[];
    readinessLabels: Record<CaseReadinessStatus, string>;
    documentStatusLabels: Record<CaseDocumentStatus, string>;
  }
> = {
  "zh-CN": {
    currentStatusOptions: [
      { label: "加拿大访客身份", value: "visitor" },
      { label: "加拿大学生身份", value: "student" },
      { label: "加拿大工作身份", value: "worker" },
      { label: "其他临时身份", value: "other" }
    ],
    urgencyOptions: [
      { label: "30 天内", value: "under-30" },
      { label: "31 到 60 天内", value: "30-60" },
      { label: "60 天以上", value: "over-60" }
    ],
    passportValidityOptions: [
      { label: "少于 6 个月", value: "under-6" },
      { label: "6 到 12 个月", value: "6-12" },
      { label: "超过 12 个月", value: "12-plus" },
      { label: "暂未确认", value: "unknown" }
    ],
    proofOfFundsOptions: [
      { label: "已准备", value: "ready" },
      { label: "部分准备", value: "partial" },
      { label: "缺失", value: "missing" },
      { label: "仍不清楚", value: "unknown" }
    ],
    complianceOptions: [
      { label: "暂无已知问题", value: "no" },
      { label: "有，需要解释", value: "yes" },
      { label: "仍不清楚", value: "unclear" }
    ],
    supportEvidenceOptions: [
      { label: "已准备", value: "ready" },
      { label: "部分准备", value: "partial" },
      { label: "缺失", value: "missing" },
      { label: "本案不需要", value: "not-needed" }
    ],
    commonFields: [
      {
        name: "title",
        label: "案件标题",
        type: "text",
        placeholder: "例如：6 月到期的访客记录延期",
        helper: "可选。不填时，Tideus 会自动命名案件。"
      },
      {
        name: "currentStatus",
        label: "当前临时身份",
        type: "select",
        required: true
      },
      {
        name: "currentPermitExpiry",
        label: "当前身份到期日",
        type: "date",
        required: true
      },
      {
        name: "urgency",
        label: "当前时间窗口",
        type: "select",
        required: true
      },
      {
        name: "passportValidity",
        label: "护照有效期",
        type: "select",
        required: true
      },
      {
        name: "proofOfFundsStatus",
        label: "资金证明状态",
        type: "select",
        required: true
      },
      {
        name: "refusalOrComplianceIssues",
        label: "曾有拒签或合规问题",
        type: "select",
        required: true
      },
      {
        name: "notes",
        label: "案件备注",
        type: "textarea",
        wide: true,
        placeholder: "可选。补充仍需解释的事实、影响递交流程的约束，或后续专业审查绝不能忽略的内容。",
        helper: "在条件允许时，Tideus 会把这些备注规范化为结构化工作流信号。"
      }
    ],
    visitorRecord: {
      shortTitle: "访客记录",
      title: "访客记录案件准备工作台",
      eyebrow: "当前支持",
      homepageLabel: "访客记录",
      description: "围绕访客记录延期案件完成结构化资料收集、材料清单跟踪、风险审查和可保存的工作台历史。",
      detailSummary:
        "这个工作流面向高频访客记录准备场景。规则相对清晰，但案件质量仍然高度依赖材料完整度与解释质量。",
      outcomeSummary:
        "最终结果会给出就绪信号、实用清单、缺失项、案件风险，以及交给专业人士或进入正式递交前的下一步。",
      whatYouGet: [
        "围绕具体案件的资料收集，而不是泛化移民问卷",
        "适用于访客记录资料包的预期材料跟踪",
        "包含缺失项和风险标记的结构化就绪输出",
        "可在仪表盘继续推进的保存型案件记录"
      ],
      fitSignals: [
        "当前访客身份临近到期，需要把资料包整理清楚",
        "希望在付费专业审查前，先看清还缺哪些证据",
        "需要把临时居留意图和支持材料整理得更清楚"
      ],
      notFor: ["复杂不准入或诉讼事务", "广泛的多路径资格搜索", "代理或法律建议"],
      intakeTitle: "采集影响访客记录案件的关键信息",
      intakeDescription:
        "把资料收集聚焦在时间压力、资金、临时居留意图和支持材料上，让后续审查始终围绕真实案件展开。",
      materialsTitle: "标记你已经拥有的访客记录材料",
      reviewTitle: "在专业交接前先审查这个案件资料包",
      specificFields: [
        {
          name: "applicationReason",
          label: "申请访客记录的原因",
          type: "select",
          required: true,
          options: [
            { label: "与家人或接待方继续停留", value: "family-or-host" },
            { label: "旅游或个人行程", value: "tourism" },
            { label: "离境前处理事务", value: "wrap-up" },
            { label: "等待另一项身份决定", value: "awaiting-next-step" },
            { label: "其他原因", value: "other" }
          ]
        },
        {
          name: "supportEntityName",
          label: "接待人、家属联系人或主要支持人",
          type: "text",
          placeholder: "例如：卡尔加里的姐姐",
          helper: "可选。如果停留安排依赖他人，这一项会更有帮助。"
        },
        {
          name: "supportEvidenceStatus",
          label: "接待或住宿支持材料",
          type: "select",
          required: true
        },
        {
          name: "scenarioProgressStatus",
          label: "临时居留意图说明状态",
          type: "select",
          required: true,
          options: [
            { label: "清楚且有材料支持", value: "clear" },
            { label: "只有部分草稿或证据混杂", value: "partial" },
            { label: "较弱或仍不清楚", value: "weak" }
          ]
        }
      ],
      expectedDocuments: [
        {
          key: "passport-copy",
          label: "护照复印件",
          description: "护照首页以及支持身份和有效期判断所需的页面。",
          required: true
        },
        {
          key: "current-status-proof",
          label: "当前身份证明",
          description: "当前访客身份文件、入境章或此前授权记录。",
          required: true
        },
        {
          key: "extension-explanation",
          label: "延期解释信",
          description: "简明说明为何需要延期，以及停留为何仍然具有临时性质。",
          required: true
        },
        {
          key: "proof-of-funds",
          label: "资金证明",
          description: "与停留安排相关的银行流水、支持材料或其他财务证明。",
          required: true
        },
        {
          key: "host-or-accommodation",
          label: "接待或住宿证明",
          description: "如果停留依赖接待方，应提供邀请信、住宿信息或支持说明。",
          required: false
        },
        {
          key: "temporary-intent-support",
          label: "临时居留意图支持材料",
          description: "用于支持临时停留、预期离境或下一合法步骤的证据。",
          required: true
        }
      ]
    },
    studyPermitExtension: {
      shortTitle: "学签延期",
      title: "学签延期案件准备工作台",
      eyebrow: "当前支持",
      homepageLabel: "学签延期",
      description: "围绕学签延期案件完成结构化资料收集、预期材料跟踪，以及适用于高频延期场景的审查输出。",
      detailSummary:
        "这个工作流刻意保持很窄：它帮助整理学签延期案件，重点关注资金、在读证明、学业进展和解释质量。",
      outcomeSummary:
        "系统会返回就绪信号、材料清单、缺失项、风险标记和具体下一步，帮助你在最终审查前先清理资料包。",
      whatYouGet: [
        "围绕延期场景的资料收集，而不是广泛路径探索",
        "针对在读、学费、资金和解释材料的预期文档跟踪",
        "包含就绪度、风险和下一步的结构化审查输出",
        "可在仪表盘重新打开的保存型案件记录"
      ],
      fitSignals: [
        "当前学生身份临近到期",
        "需要把在读、学费和资金材料集中整理在一起",
        "希望在专业审查前先发现需要解释的问题"
      ],
      notFor: ["从零开始的初次学签策略", "广泛的永久居民规划", "法律代理或持牌建议"],
      intakeTitle: "采集影响学签延期案件的关键信息",
      intakeDescription: "把资料收集聚焦在到期压力、在读证明、资金情况和学业进展上，让审查真正反映延期资料包。",
      materialsTitle: "标记你已经拥有的学签延期材料",
      reviewTitle: "在最终交接前先审查延期资料包",
      specificFields: [
        {
          name: "applicationReason",
          label: "申请学签延期的原因",
          type: "select",
          required: true,
          options: [
            { label: "继续当前项目", value: "continue-program" },
            { label: "需要更多时间完成学业", value: "more-time-needed" },
            { label: "注册或排课延迟", value: "registration-delay" },
            { label: "项目或学校转换", value: "program-transition" },
            { label: "其他原因", value: "other" }
          ]
        },
        {
          name: "supportEntityName",
          label: "学校或教育机构",
          type: "text",
          required: true,
          placeholder: "例如：Northern Alberta Institute of Technology"
        },
        {
          name: "supportEvidenceStatus",
          label: "在读证明状态",
          type: "select",
          required: true,
          options: [
            { label: "已准备", value: "ready" },
            { label: "部分准备", value: "partial" },
            { label: "缺失", value: "missing" }
          ]
        },
        {
          name: "scenarioProgressStatus",
          label: "学业状态与学费情况",
          type: "select",
          required: true,
          options: [
            { label: "状态良好且费用已清", value: "good-standing" },
            { label: "需要解释但可修复", value: "needs-explanation" },
            { label: "存在风险或仍未解决", value: "at-risk" }
          ]
        }
      ],
      expectedDocuments: [
        {
          key: "passport-copy",
          label: "护照复印件",
          description: "用于确认身份和有效期的护照页面。",
          required: true
        },
        {
          key: "current-study-permit",
          label: "当前学签",
          description: "当前许可或与延期相关的其他身份文件。",
          required: true
        },
        {
          key: "enrolment-letter",
          label: "在读证明",
          description: "当前在读确认或同等学校证明。",
          required: true
        },
        {
          key: "transcript-or-progress",
          label: "成绩单或学业进展证明",
          description: "支持延期的学业状态、出勤或进度记录。",
          required: true
        },
        {
          key: "tuition-evidence",
          label: "学费证明",
          description: "学费收据、付款计划证明或学校财务确认。",
          required: true
        },
        {
          key: "proof-of-funds",
          label: "资金证明",
          description: "覆盖剩余学习期和生活费用的资金材料。",
          required: true
        },
        {
          key: "extension-explanation",
          label: "延期解释信",
          description: "简要说明为何需要延期，以及当前学习计划为何仍然合理。",
          required: true
        }
      ]
    },
    readinessLabels: {
      "not-ready": "未就绪",
      "needs-attention": "需要关注",
      "almost-ready": "接近就绪",
      "review-ready": "可进入审查"
    },
    documentStatusLabels: {
      missing: "缺失",
      collecting: "收集中",
      "needs-refresh": "需要更新",
      ready: "已就绪",
      "not-applicable": "不适用"
    }
  },
  "zh-TW": {
    currentStatusOptions: [
      { label: "加拿大訪客身分", value: "visitor" },
      { label: "加拿大學生身分", value: "student" },
      { label: "加拿大工作身分", value: "worker" },
      { label: "其他臨時身分", value: "other" }
    ],
    urgencyOptions: [
      { label: "30 天內", value: "under-30" },
      { label: "31 到 60 天內", value: "30-60" },
      { label: "60 天以上", value: "over-60" }
    ],
    passportValidityOptions: [
      { label: "少於 6 個月", value: "under-6" },
      { label: "6 到 12 個月", value: "6-12" },
      { label: "超過 12 個月", value: "12-plus" },
      { label: "尚未確認", value: "unknown" }
    ],
    proofOfFundsOptions: [
      { label: "已準備", value: "ready" },
      { label: "部分準備", value: "partial" },
      { label: "缺失", value: "missing" },
      { label: "仍不清楚", value: "unknown" }
    ],
    complianceOptions: [
      { label: "暫無已知問題", value: "no" },
      { label: "有，需要解釋", value: "yes" },
      { label: "仍不清楚", value: "unclear" }
    ],
    supportEvidenceOptions: [
      { label: "已準備", value: "ready" },
      { label: "部分準備", value: "partial" },
      { label: "缺失", value: "missing" },
      { label: "本案不需要", value: "not-needed" }
    ],
    commonFields: [
      {
        name: "title",
        label: "案件標題",
        type: "text",
        placeholder: "例如：6 月到期的訪客紀錄延期",
        helper: "可選。不填時，Tideus 會自動命名案件。"
      },
      {
        name: "currentStatus",
        label: "目前臨時身分",
        type: "select",
        required: true
      },
      {
        name: "currentPermitExpiry",
        label: "目前身分到期日",
        type: "date",
        required: true
      },
      {
        name: "urgency",
        label: "目前時間視窗",
        type: "select",
        required: true
      },
      {
        name: "passportValidity",
        label: "護照有效期",
        type: "select",
        required: true
      },
      {
        name: "proofOfFundsStatus",
        label: "資金證明狀態",
        type: "select",
        required: true
      },
      {
        name: "refusalOrComplianceIssues",
        label: "曾有拒簽或合規問題",
        type: "select",
        required: true
      },
      {
        name: "notes",
        label: "案件備註",
        type: "textarea",
        wide: true,
        placeholder: "可選。補充仍需解釋的事實、影響遞交流程的限制，或後續專業審查絕不能忽略的內容。",
        helper: "在條件允許時，Tideus 會把這些備註規範化為結構化工作流程訊號。"
      }
    ],
    visitorRecord: {
      shortTitle: "訪客紀錄",
      title: "訪客紀錄案件準備工作台",
      eyebrow: "目前支援",
      homepageLabel: "訪客紀錄",
      description: "圍繞訪客紀錄延期案件完成結構化資料收集、材料清單追蹤、風險審查和可保存的工作台歷史。",
      detailSummary:
        "這個工作流程面向高頻訪客紀錄準備情境。規則相對清晰，但案件品質仍高度依賴材料完整度與解釋品質。",
      outcomeSummary:
        "最終結果會給出就緒訊號、實用清單、缺失項、案件風險，以及交給專業人士或進入正式遞交前的下一步。",
      whatYouGet: [
        "圍繞具體案件的資料收集，而不是泛化移民問卷",
        "適用於訪客紀錄資料包的預期材料追蹤",
        "包含缺失項和風險標記的結構化就緒輸出",
        "可在儀表板繼續推進的保存型案件紀錄"
      ],
      fitSignals: [
        "目前訪客身分接近到期，需要把資料包整理清楚",
        "希望在付費專業審查前，先看清還缺哪些證據",
        "需要把臨時居留意圖和支持材料整理得更清楚"
      ],
      notFor: ["複雜不准入或訴訟事務", "廣泛的多路徑資格搜尋", "代理或法律建議"],
      intakeTitle: "蒐集影響訪客紀錄案件的關鍵資訊",
      intakeDescription:
        "把資料收集聚焦在時間壓力、資金、臨時居留意圖和支持材料上，讓後續審查始終圍繞真實案件展開。",
      materialsTitle: "標記你已經擁有的訪客紀錄材料",
      reviewTitle: "在專業交接前先審查這個案件資料包",
      specificFields: [
        {
          name: "applicationReason",
          label: "申請訪客紀錄的原因",
          type: "select",
          required: true,
          options: [
            { label: "與家人或接待方繼續停留", value: "family-or-host" },
            { label: "旅遊或個人行程", value: "tourism" },
            { label: "離境前處理事務", value: "wrap-up" },
            { label: "等待另一項身分決定", value: "awaiting-next-step" },
            { label: "其他原因", value: "other" }
          ]
        },
        {
          name: "supportEntityName",
          label: "接待人、家屬聯絡人或主要支持人",
          type: "text",
          placeholder: "例如：卡加利的姐姐",
          helper: "可選。如果停留安排依賴他人，這一項會更有幫助。"
        },
        {
          name: "supportEvidenceStatus",
          label: "接待或住宿支持材料",
          type: "select",
          required: true
        },
        {
          name: "scenarioProgressStatus",
          label: "臨時居留意圖說明狀態",
          type: "select",
          required: true,
          options: [
            { label: "清楚且有材料支持", value: "clear" },
            { label: "只有部分草稿或證據混雜", value: "partial" },
            { label: "較弱或仍不清楚", value: "weak" }
          ]
        }
      ],
      expectedDocuments: [
        {
          key: "passport-copy",
          label: "護照影本",
          description: "護照首頁以及支持身分與有效期判斷所需的頁面。",
          required: true
        },
        {
          key: "current-status-proof",
          label: "目前身分證明",
          description: "目前訪客身分文件、入境章或此前授權紀錄。",
          required: true
        },
        {
          key: "extension-explanation",
          label: "延期解釋信",
          description: "簡明說明為何需要延期，以及停留為何仍具有臨時性質。",
          required: true
        },
        {
          key: "proof-of-funds",
          label: "資金證明",
          description: "與停留安排相關的銀行流水、支持材料或其他財務證明。",
          required: true
        },
        {
          key: "host-or-accommodation",
          label: "接待或住宿證明",
          description: "如果停留依賴接待方，應提供邀請信、住宿資訊或支持說明。",
          required: false
        },
        {
          key: "temporary-intent-support",
          label: "臨時居留意圖支持材料",
          description: "用於支持臨時停留、預期離境或下一合法步驟的證據。",
          required: true
        }
      ]
    },
    studyPermitExtension: {
      shortTitle: "學簽延期",
      title: "學簽延期案件準備工作台",
      eyebrow: "目前支援",
      homepageLabel: "學簽延期",
      description: "圍繞學簽延期案件完成結構化資料收集、預期材料追蹤，以及適用於高頻延期情境的審查輸出。",
      detailSummary:
        "這個工作流程刻意保持很窄：它幫助整理學簽延期案件，重點關注資金、在讀證明、學業進展和解釋品質。",
      outcomeSummary:
        "系統會回傳就緒訊號、材料清單、缺失項、風險標記和具體下一步，幫助你在最終審查前先清理資料包。",
      whatYouGet: [
        "圍繞延期情境的資料收集，而不是廣泛路徑探索",
        "針對在讀、學費、資金和解釋材料的預期文件追蹤",
        "包含就緒度、風險和下一步的結構化審查輸出",
        "可在儀表板重新打開的保存型案件紀錄"
      ],
      fitSignals: [
        "目前學生身分接近到期",
        "需要把在讀、學費和資金材料集中整理在一起",
        "希望在專業審查前先發現需要解釋的問題"
      ],
      notFor: ["從零開始的初次學簽策略", "廣泛的永久居民規劃", "法律代理或持牌建議"],
      intakeTitle: "蒐集影響學簽延期案件的關鍵資訊",
      intakeDescription: "把資料收集聚焦在到期壓力、在讀證明、資金情況和學業進展上，讓審查真正反映延期資料包。",
      materialsTitle: "標記你已經擁有的學簽延期材料",
      reviewTitle: "在最終交接前先審查延期資料包",
      specificFields: [
        {
          name: "applicationReason",
          label: "申請學簽延期的原因",
          type: "select",
          required: true,
          options: [
            { label: "繼續目前課程", value: "continue-program" },
            { label: "需要更多時間完成學業", value: "more-time-needed" },
            { label: "註冊或排課延遲", value: "registration-delay" },
            { label: "課程或學校轉換", value: "program-transition" },
            { label: "其他原因", value: "other" }
          ]
        },
        {
          name: "supportEntityName",
          label: "學校或教育機構",
          type: "text",
          required: true,
          placeholder: "例如：Northern Alberta Institute of Technology"
        },
        {
          name: "supportEvidenceStatus",
          label: "在讀證明狀態",
          type: "select",
          required: true,
          options: [
            { label: "已準備", value: "ready" },
            { label: "部分準備", value: "partial" },
            { label: "缺失", value: "missing" }
          ]
        },
        {
          name: "scenarioProgressStatus",
          label: "學業狀態與學費情況",
          type: "select",
          required: true,
          options: [
            { label: "狀態良好且費用已清", value: "good-standing" },
            { label: "需要解釋但可修復", value: "needs-explanation" },
            { label: "存在風險或仍未解決", value: "at-risk" }
          ]
        }
      ],
      expectedDocuments: [
        {
          key: "passport-copy",
          label: "護照影本",
          description: "用於確認身分和有效期的護照頁面。",
          required: true
        },
        {
          key: "current-study-permit",
          label: "目前學簽",
          description: "目前許可或與延期相關的其他身分文件。",
          required: true
        },
        {
          key: "enrolment-letter",
          label: "在讀證明",
          description: "目前在讀確認或同等學校證明。",
          required: true
        },
        {
          key: "transcript-or-progress",
          label: "成績單或學業進展證明",
          description: "支持延期的學業狀態、出勤或進度紀錄。",
          required: true
        },
        {
          key: "tuition-evidence",
          label: "學費證明",
          description: "學費收據、付款計畫證明或學校財務確認。",
          required: true
        },
        {
          key: "proof-of-funds",
          label: "資金證明",
          description: "覆蓋剩餘學習期和生活費用的資金材料。",
          required: true
        },
        {
          key: "extension-explanation",
          label: "延期解釋信",
          description: "簡要說明為何需要延期，以及目前學習計畫為何仍然合理。",
          required: true
        }
      ]
    },
    readinessLabels: {
      "not-ready": "未就緒",
      "needs-attention": "需要關注",
      "almost-ready": "接近就緒",
      "review-ready": "可進入審查"
    },
    documentStatusLabels: {
      missing: "缺失",
      collecting: "收集中",
      "needs-refresh": "需要更新",
      ready: "已就緒",
      "not-applicable": "不適用"
    }
  }
};

function buildUseCases(locale: AppLocale): UseCaseDefinition[] {
  const labels = localizedLabels[locale];

  return [
    {
      slug: "visitor-record",
      ...labels.visitorRecord,
      specificFields: labels.visitorRecord.specificFields.map((field) =>
        field.name === "supportEvidenceStatus"
          ? { ...field, options: labels.supportEvidenceOptions }
          : field
      )
    },
    {
      slug: "study-permit-extension",
      ...labels.studyPermitExtension
    }
  ];
}

const localizedUseCases = {
  "zh-CN": buildUseCases("zh-CN"),
  "zh-TW": buildUseCases("zh-TW")
} as const satisfies Record<AppLocale, UseCaseDefinition[]>;

const localizedUseCaseMaps = {
  "zh-CN": new Map(localizedUseCases["zh-CN"].map((item) => [item.slug, item])),
  "zh-TW": new Map(localizedUseCases["zh-TW"].map((item) => [item.slug, item]))
} as const;

export function getCurrentStatusOptions(locale: AppLocale = defaultLocale) {
  return localizedLabels[locale].currentStatusOptions;
}

export function getUrgencyOptions(locale: AppLocale = defaultLocale) {
  return localizedLabels[locale].urgencyOptions;
}

export function getPassportValidityOptions(locale: AppLocale = defaultLocale) {
  return localizedLabels[locale].passportValidityOptions;
}

export function getProofOfFundsOptions(locale: AppLocale = defaultLocale) {
  return localizedLabels[locale].proofOfFundsOptions;
}

export function getComplianceOptions(locale: AppLocale = defaultLocale) {
  return localizedLabels[locale].complianceOptions;
}

export function getSupportEvidenceOptions(locale: AppLocale = defaultLocale) {
  return localizedLabels[locale].supportEvidenceOptions;
}

export function getSupportedUseCases(locale: AppLocale = defaultLocale) {
  return localizedUseCases[locale];
}

export function getUseCaseDefinition(slug: string | null | undefined, locale: AppLocale = defaultLocale) {
  if (!slug) {
    return null;
  }

  return localizedUseCaseMaps[locale].get(slug as SupportedUseCaseSlug) ?? null;
}

export function getDocumentDefinition(
  useCaseSlug: SupportedUseCaseSlug,
  documentKey: string,
  locale: AppLocale = defaultLocale
) {
  return getUseCaseDefinition(useCaseSlug, locale)?.expectedDocuments.find((item) => item.key === documentKey) ?? null;
}

export function isSupportedUseCase(value: string): value is SupportedUseCaseSlug {
  return localizedUseCaseMaps[defaultLocale].has(value as SupportedUseCaseSlug);
}

export function getCaseStartHref(slug: SupportedUseCaseSlug) {
  return `/case-intake?useCase=${slug}`;
}

export function formatUseCaseLabel(slug: SupportedUseCaseSlug | string, locale: AppLocale = defaultLocale) {
  return getUseCaseDefinition(slug, locale)?.shortTitle ?? slug;
}

export function formatReadinessStatus(status: CaseReadinessStatus | string, locale: AppLocale = defaultLocale) {
  return localizedLabels[locale].readinessLabels[status as CaseReadinessStatus] ?? status;
}

export function formatDocumentStatus(status: CaseDocumentStatus | string, locale: AppLocale = defaultLocale) {
  return localizedLabels[locale].documentStatusLabels[status as CaseDocumentStatus] ?? status;
}

export function getCaseIntakeFields(useCase: UseCaseDefinition, locale: AppLocale = defaultLocale) {
  return [
    ...localizedLabels[locale].commonFields.map((field) => {
      if (field.name === "currentStatus") {
        return { ...field, options: localizedLabels[locale].currentStatusOptions };
      }

      if (field.name === "urgency") {
        return { ...field, options: localizedLabels[locale].urgencyOptions };
      }

      if (field.name === "passportValidity") {
        return { ...field, options: localizedLabels[locale].passportValidityOptions };
      }

      if (field.name === "proofOfFundsStatus") {
        return { ...field, options: localizedLabels[locale].proofOfFundsOptions };
      }

      if (field.name === "refusalOrComplianceIssues") {
        return { ...field, options: localizedLabels[locale].complianceOptions };
      }

      return field;
    }),
    ...useCase.specificFields
  ];
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

export const supportedUseCases: UseCaseDefinition[] = getSupportedUseCases();
