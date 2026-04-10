import { defaultLocale, type AppLocale } from "@/lib/i18n/config";

export type AppMessages = {
  languageNames: Record<AppLocale, string>;
  common: {
    ready: string;
    working: string;
    error: string;
    saved: string;
    actionNeeded: string;
    selectOne: string;
    noItems: string;
    notReviewedYet: string;
    notAvailable: string;
    noEmailAvailable: string;
    fileUploaded: string;
  };
  switcher: {
    label: string;
    saving: string;
  };
  site: {
    tagline: string;
    footerTagline: string;
    footerDescription: string;
    mainNav: Array<{
      label: string;
      href: string;
    }>;
    footerGroups: Array<{
      title: string;
      links: Array<{
        label: string;
        href: string;
      }>;
    }>;
  };
  hero: {
    badge: string;
    title: string;
    description: string;
    startCase: string;
    bookDemo: string;
    stats: Array<{
      value: string;
      label: string;
    }>;
    exampleBadge: string;
    exampleTitle: string;
    exampleDescription: string;
    exampleReviewTitle: string;
    exampleReviewSummary: string;
    exampleMissingLabel: string;
    exampleMissingValue: string;
    exampleNextStepLabel: string;
    exampleNextStepValue: string;
    materialsLabel: string;
    materialsDescription: string;
    reviewHistoryLabel: string;
    reviewHistoryDescription: string;
  };
  ctaSection: {
    badge: string;
    title: string;
    description: string;
    startCase: string;
    bookDemo: string;
  };
  home: {
    valuePropsEyebrow: string;
    valuePropsTitle: string;
    valuePropsDescription: string;
    supportedEyebrow: string;
    supportedTitle: string;
    supportedDescription: string;
    viewWorkflow: string;
    workflowEyebrow: string;
    workflowTitle: string;
    workflowDescription: string;
    trustEyebrow: string;
    trustTitle: string;
    trustCardTitle: string;
    faqEyebrow: string;
    faqTitle: string;
    narrowingEyebrow: string;
    narrowingTitle: string;
    narrowingDescription: string;
  };
  howItWorks: {
    eyebrow: string;
    title: string;
    description: string;
    startCase: string;
    bookDemo: string;
    structuredOutputEyebrow: string;
    structuredOutputTitle: string;
    reviewBlockBadge: string;
    reviewBlockTitle: string;
    reviewBlockItems: string[];
    trustEyebrow: string;
    trustTitle: string;
    trustCardTitle: string;
  };
  useCases: {
    eyebrow: string;
    title: string;
    description: string;
    startCase: string;
    reviewBoundaries: string;
    detailCta: string;
    outOfScopeTitle: string;
    outOfScopeDescription: string;
    outOfScopeItems: string[];
  };
  useCaseDetail: {
    startThisCase: string;
    bookDemo: string;
    designedTitle: string;
    goodFitTitle: string;
    goodFitDescription: string;
    materialsEyebrow: string;
    materialsDescription: string;
    reviewEyebrow: string;
    reviewDescription: string;
    reviewBullets: string[];
    notForTitle: string;
    notForDescription: string;
  };
  startCase: {
    eyebrow: string;
    title: string;
    description: string;
    bookDemo: string;
    openWorkspace: string;
    loginToSave: string;
    startUseCase: string;
    viewWorkflowDetail: string;
  };
  caseQuestionPage: {
    eyebrow: string;
    title: string;
    description: string;
    startCase: string;
    bookDemo: string;
    boundaryCardTitle: string;
    boundaryItems: string[];
  };
  caseQuestionEntry: {
    initialMessage: string;
    tooShortQuestion: string;
    generating: string;
    answerReady: string;
    generateError: string;
    saveBeforeGenerate: string;
    creatingWorkspace: string;
    signInToSave: string;
    saveError: string;
    savedWorkspace: string;
    taskBadge: string;
    title: string;
    description: string;
    scenarioLabel: string;
    questionLabel: string;
    questionPlaceholder: string;
    questionHelper: string;
    caseQuestionLabel: string;
    generateButton: string;
    generatingButton: string;
    workspaceTitle: string;
    workspaceDescription: string;
    saveToWorkspace: string;
    generateChecklist: string;
    startTracking: string;
    continueInWorkspace: string;
    openSavedWorkspace: string;
    emptyTitle: string;
    emptyDescription: string;
    structuredAnswerTitle: string;
    summaryTitle: string;
    whyMattersTitle: string;
    contextTitle: string;
    warningsTitle: string;
    nextStepsTitle: string;
    trackerActionsTitle: string;
    emptyWarnings: string;
    emptyItems: string;
  };
  caseQuestionPanel: {
    presetQuestions: string[];
    initialMessage: string;
    tooShortQuestion: string;
    loading: string;
    success: string;
    error: string;
    badge: string;
    title: string;
    descriptionTemplate: string;
    questionLabel: string;
    latestReviewContext: string;
    answerButton: string;
    answeringButton: string;
    summaryTitle: string;
    whyTitle: string;
    nextStepsTitle: string;
    warningsTitle: string;
    trackerActionsTitle: string;
    emptyWarning: string;
    emptyItems: string;
  };
  authLayout: {
    secureAccess: string;
    backHome: string;
  };
  authPage: {
    loginBadge: string;
    loginTitle: string;
    loginDescription: string;
    loginHighlights: string[];
    signupBadge: string;
    signupTitle: string;
    signupDescription: string;
    signupHighlights: string[];
  };
  authForm: {
    callbackError: string;
    loginIntro: string;
    signupIntro: string;
    fullNameRequired: string;
    invalidEmail: string;
    passwordLength: string;
    fixFields: string;
    signingIn: string;
    creatingAccount: string;
    authFailed: string;
    authComplete: string;
    badge: string;
    loginTitle: string;
    signupTitle: string;
    description: string;
    fullNameLabel: string;
    fullNamePlaceholder: string;
    emailLabel: string;
    emailPlaceholder: string;
    passwordLabel: string;
    passwordPlaceholder: string;
    workingButton: string;
    loginButton: string;
    signupButton: string;
    needAccount: string;
    haveAccount: string;
    createOne: string;
    loginLink: string;
  };
};

const zhCnMessages: AppMessages = {
  languageNames: {
    "zh-CN": "简体中文",
    "zh-TW": "繁體中文"
  },
  common: {
    ready: "就绪",
    working: "处理中",
    error: "出错",
    saved: "已保存",
    actionNeeded: "需要处理",
    selectOne: "请选择",
    noItems: "暂无内容",
    notReviewedYet: "尚未生成审查",
    notAvailable: "暂无",
    noEmailAvailable: "暂无邮箱",
    fileUploaded: "文件已上传"
  },
  switcher: {
    label: "语言",
    saving: "正在切换语言..."
  },
  site: {
    tagline: "面向延期准备的案件工作台",
    footerTagline: "聚焦案件准备工作台",
    footerDescription:
      "Tideus 帮助用户围绕高频、材料密集型案件准备工作整理资料、保存 intake、跟踪材料状态，并生成结构化审查结果。",
    mainNav: [
      { label: "如何运作", href: "/how-it-works" },
      { label: "适用场景", href: "/use-cases" },
      { label: "提问入口", href: "/case-question" },
      { label: "开始案件", href: "/start-case" },
      { label: "信任与边界", href: "/trust" },
      { label: "案件工作台", href: "/dashboard" }
    ],
    footerGroups: [
      {
        title: "产品",
        links: [
          { label: "如何运作", href: "/how-it-works" },
          { label: "适用场景", href: "/use-cases" },
          { label: "提问入口", href: "/case-question" },
          { label: "开始案件", href: "/start-case" },
          { label: "案件工作台", href: "/dashboard" }
        ]
      },
      {
        title: "公司",
        links: [
          { label: "信任与边界", href: "/trust" },
          { label: "预约演示", href: "/book-demo" },
          { label: "隐私", href: "/privacy" },
          { label: "条款", href: "/terms" }
        ]
      }
    ]
  },
  hero: {
    badge: "工作流优先的案件准备",
    title: "先把案件整理清楚，再进入耗时的人工审查。",
    description:
      "Tideus 是一个面向高频、材料密集型申请与延期准备的 AI 案件工作台。第一阶段只支持极少数场景：清晰的工作流、结构化审查结果，以及可随时继续的案件记录。",
    startCase: "开始案件",
    bookDemo: "预约演示",
    stats: [
      { value: "2", label: "首个发布窗口仅支持两个高频楔形工作流。" },
      { value: "8", label: "结构化审查模块：就绪度、清单、缺失项、风险、时间提醒、后续动作、上下文、参考标签。" },
      { value: "1", label: "一个保存 intake、材料和审查版本的案件工作台。" }
    ],
    exampleBadge: "审查结果示例",
    exampleTitle: "聚焦型案件工作台应该给人的感受",
    exampleDescription: "清晰的就绪信号、可见的材料缺口，以及真正推动案件前进的下一步。",
    exampleReviewTitle: "学签延期审查",
    exampleReviewSummary: "需要关注：案件已经接近可审，但在读证明和学费材料仍需更完整、更新的版本。",
    exampleMissingLabel: "缺失项",
    exampleMissingValue: "更新后的在读证明与最终学费付款证明。",
    exampleNextStepLabel: "下一步",
    exampleNextStepValue: "先收紧解释信并更新证据清单，再进入下一轮审查。",
    materialsLabel: "材料跟踪",
    materialsDescription: "预期材料始终可见，案件可以从 intake 平稳推进到资料审查，而不是靠记忆。",
    reviewHistoryLabel: "审查版本",
    reviewHistoryDescription: "每一轮都会保存就绪度快照、风险和下一步，而不是变成一次性的 AI 对话。"
  },
  ctaSection: {
    badge: "聚焦且便于交接",
    title: "从受支持的案件类型开始，把资料包一步步整理干净。",
    description:
      "Tideus 聚焦在结构化案件准备：intake、材料跟踪、审查输出，以及能让下一次专业沟通更快进入上下文的保存型工作台。",
    startCase: "开始案件",
    bookDemo: "预约演示"
  },
  home: {
    valuePropsEyebrow: "为什么这个楔形切口成立",
    valuePropsTitle: "案件工作台，比一排零散工具更有用。",
    valuePropsDescription:
      "Tideus 刻意做窄：更少的场景、更清楚的工作流边界，以及真正能推动案件前进的输出模块。",
    supportedEyebrow: "当前支持的场景",
    supportedTitle: "先从产品真正能正确支持的案件开始。",
    supportedDescription:
      "第一阶段刻意保持很窄，这样工作流才能正确、结构清晰、适合演示，而不是宽泛又模糊。",
    viewWorkflow: "查看工作流",
    workflowEyebrow: "工作流",
    workflowTitle: "产品被设计成让一个案件沿着一条审查路径推进。",
    workflowDescription: "流程刻意保持收敛：选择案件类型、完成 intake、标记材料，并生成可保存的审查结果。",
    trustEyebrow: "信任边界",
    trustTitle: "真正有帮助的案件准备，必须清楚说明它不是什么。",
    trustCardTitle: "边界",
    faqEyebrow: "常见问题",
    faqTitle: "在把真实案件交给工作流产品之前，人们最常问的问题。",
    narrowingEyebrow: "为什么产品在收窄",
    narrowingTitle: "目标是得到更干净的案件资料包，而不是做更大的站点。",
    narrowingDescription:
      "Tideus 现在优先考虑工作流正确性，而不是泛化的 AI 宽度。这意味着更少承诺、更强结构，以及更好的人工接手点。"
  },
  howItWorks: {
    eyebrow: "如何运作",
    title: "产品的目标，是在真正的人工审查开始前把案件资料包整理清楚。",
    description: "Tideus 被设计成一条窄而清晰的路径：intake、材料、结构化审查，以及可保存的后续跟进。",
    startCase: "开始案件",
    bookDemo: "预约演示",
    structuredOutputEyebrow: "结构化输出",
    structuredOutputTitle: "结果应该看起来像一块案件审查结果，而不是一段对话记录。",
    reviewBlockBadge: "审查模块",
    reviewBlockTitle: "每次案件审查都围绕同一组六个核心信号。",
    reviewBlockItems: ["就绪状态", "清单", "缺失项", "风险标记", "时间说明", "下一步"],
    trustEyebrow: "信任",
    trustTitle: "只有边界写清楚，工作流才会持续有用。",
    trustCardTitle: "边界"
  },
  useCases: {
    eyebrow: "适用场景",
    title: "当前仅支持极少数高频、材料密集型案件类型。",
    description: "首个发布窗口会保持很小。Tideus 只会公开那些能被稳定结构化和一致审查的工作流。",
    startCase: "开始案件",
    reviewBoundaries: "查看边界",
    detailCta: "查看工作流详情",
    outOfScopeTitle: "当前刻意不做的范围",
    outOfScopeDescription: "让产品真正有用的最快路径，是把第一阶段做窄，而不是假装什么都能覆盖。",
    outOfScopeItems: [
      "广泛的永久居民路径策略规划",
      "跨多个类别的通用路径比较",
      "开放式法律分诊或代理",
      "超出当前受支持工作流的高裁量、复杂场景"
    ]
  },
  useCaseDetail: {
    startThisCase: "开始这个案件",
    bookDemo: "预约演示",
    designedTitle: "这个工作流是为了解决什么",
    goodFitTitle: "适合这个楔形工作流的情况",
    goodFitDescription: "这些信号说明这条工作流是正确的起点。",
    materialsEyebrow: "材料",
    materialsDescription: "案件工作台会跟踪该工作流所需的预期材料类型。",
    reviewEyebrow: "审查",
    reviewDescription: "审查结果被结构化为真实的案件交接或最终质量检查所需的内容。",
    reviewBullets: ["就绪状态", "清单", "缺失项", "风险标记", "时间说明", "下一步"],
    notForTitle: "不适合这个工作流的情况",
    notForDescription: "即使标签听起来相近，也不应把以下案件当作常规楔形工作流来处理。"
  },
  startCase: {
    eyebrow: "开始案件",
    title: "选择与你当前案件准备任务相匹配的工作流。",
    description: "选择一个受支持的案件类型，进入 intake，并开始建立可随时继续的案件记录。",
    bookDemo: "预约演示",
    openWorkspace: "打开案件工作台",
    loginToSave: "登录后保存案件",
    startUseCase: "开始",
    viewWorkflowDetail: "查看工作流详情"
  },
  caseQuestionPage: {
    eyebrow: "AI 前门",
    title: "在不脱离工作流的前提下，先问一个案件准备问题。",
    description: "围绕访客记录或学签延期提出聚焦问题，再把结构化答案转成工作台动作。",
    startCase: "开始案件",
    bookDemo: "预约演示",
    boundaryCardTitle: "边界",
    boundaryItems: [
      "返回结构化答案，而不是开放式聊天",
      "只支持当前楔形场景",
      "跟踪动作可以直接转成可保存的案件工作台"
    ]
  },
  caseQuestionEntry: {
    initialMessage: "围绕受支持场景提出一个与案件准备直接相关的问题。",
    tooShortQuestion: "请把问题问得更具体一些。",
    generating: "正在生成结构化答案...",
    answerReady: "结构化答案已生成。如果这会影响案件推进，请把它保存到工作台。",
    generateError: "暂时无法回答这个问题。",
    saveBeforeGenerate: "请先生成结构化答案，再保存为工作台动作。",
    creatingWorkspace: "正在创建案件工作台上下文...",
    signInToSave: "请先登录后再保存该答案。",
    saveError: "暂时无法保存该答案。",
    savedWorkspace: "已保存为案件工作台，并带入初始材料与跟踪动作。",
    taskBadge: "任务型入口",
    title: "提出一个工作流问题",
    description: "答案会保持结构化，因此可以直接转成清单工作、跟踪动作或可保存的案件工作台。",
    scenarioLabel: "场景",
    questionLabel: "问题",
    questionPlaceholder: "例如：我有资金证明，但护照快到期了。下一步最应该先跟踪什么？",
    questionHelper: "请把问题限定在所选场景的材料、风险、时间或下一步规划上。",
    caseQuestionLabel: "案件问题",
    generateButton: "生成结构化答案",
    generatingButton: "正在整理答案...",
    workspaceTitle: "把答案转成工作台动作",
    workspaceDescription: "将结构化答案保存为草稿案件，让跟踪动作附着在可复用的案件记录上。",
    saveToWorkspace: "保存到工作台",
    generateChecklist: "生成清单",
    startTracking: "开始跟踪",
    continueInWorkspace: "继续进入案件工作台",
    openSavedWorkspace: "打开已保存工作台",
    emptyTitle: "结构化输出，而不是聊天记录",
    emptyDescription: "Tideus 会返回摘要、为什么重要、上下文备注、场景警示、下一步和跟踪动作。",
    structuredAnswerTitle: "结构化答案",
    summaryTitle: "摘要",
    whyMattersTitle: "为什么重要",
    contextTitle: "支持性上下文",
    warningsTitle: "场景警示",
    nextStepsTitle: "下一步",
    trackerActionsTitle: "跟踪动作",
    emptyWarnings: "当前没有额外场景警示。",
    emptyItems: "当前没有可显示内容。"
  },
  caseQuestionPanel: {
    presetQuestions: ["我还缺什么？", "为什么这是风险？", "和上一版相比有什么变化？", "我下一步该做什么？"],
    initialMessage: "围绕这个已保存案件提出一个结构化问题。",
    tooShortQuestion: "请把针对该案件的问题问得更具体一些。",
    loading: "正在读取案件上下文并生成结构化答案...",
    success: "结构化答案已写入该案件的 AI 轨迹。",
    error: "暂时无法回答这个案件问题。",
    badge: "案件上下文问题",
    title: "询问这个案件",
    descriptionTemplate: "回答会基于 {caseTitle}、最新的 {useCaseTitle} 审查结果、材料状态以及内部知识上下文。",
    questionLabel: "问题",
    latestReviewContext: "最新审查上下文",
    answerButton: "基于案件上下文回答",
    answeringButton: "回答中...",
    summaryTitle: "摘要",
    whyTitle: "为什么重要",
    nextStepsTitle: "下一步",
    warningsTitle: "警示",
    trackerActionsTitle: "跟踪动作",
    emptyWarning: "当前没有额外场景警示。",
    emptyItems: "当前没有可显示内容。"
  },
  authLayout: {
    secureAccess: "安全账户访问",
    backHome: "返回首页"
  },
  authPage: {
    loginBadge: "登录",
    loginTitle: "登录后，从上次中断的地方继续案件工作流。",
    loginDescription: "登录即可访问你的案件工作台、已保存的材料状态和结构化审查历史。",
    loginHighlights: [
      "邮箱和密码登录后即可进入案件工作台。",
      "只有有效会话才能打开仪表盘与工作流页面。",
      "登录后，已保存的 intake、材料和审查历史都会出现在工作台中。"
    ],
    signupBadge: "注册",
    signupTitle: "创建账户，从第一次 intake 开始就保存案件准备工作。",
    signupDescription: "创建账户后，intake 答案、材料跟踪和结构化审查结果都会保存在同一个工作台中。",
    signupHighlights: [
      "表单包含校验、加载、成功和错误状态。",
      "启用后，新账户可以走邮箱确认流程。",
      "保存的案件与审查版本从一开始就会绑定到同一个账户。"
    ]
  },
  authForm: {
    callbackError: "邮箱确认没有完成，请重新登录。",
    loginIntro: "使用账户信息继续进入案件工作台。",
    signupIntro: "创建账户以保存案件、材料和审查历史。",
    fullNameRequired: "请输入姓名。",
    invalidEmail: "请输入有效的邮箱地址。",
    passwordLength: "密码至少需要 8 个字符。",
    fixFields: "请先修正高亮字段，再继续。",
    signingIn: "正在登录...",
    creatingAccount: "正在创建账户...",
    authFailed: "暂时无法完成认证。",
    authComplete: "认证已完成。",
    badge: "账户访问",
    loginTitle: "登录你的账户",
    signupTitle: "创建你的账户",
    description: "使用账户访问已保存的案件、结构化审查版本和完整工作台。",
    fullNameLabel: "姓名",
    fullNamePlaceholder: "王小明",
    emailLabel: "邮箱",
    emailPlaceholder: "you@example.com",
    passwordLabel: "密码",
    passwordPlaceholder: "至少 8 个字符",
    workingButton: "处理中...",
    loginButton: "继续进入工作台",
    signupButton: "创建账户",
    needAccount: "还没有账户？",
    haveAccount: "已经有账户？",
    createOne: "立即创建",
    loginLink: "去登录"
  }
};

const zhTwMessages: AppMessages = {
  ...zhCnMessages,
  languageNames: {
    "zh-CN": "簡體中文",
    "zh-TW": "繁體中文"
  },
  common: {
    ...zhCnMessages.common,
    ready: "就緒",
    working: "處理中",
    error: "出錯",
    saved: "已儲存",
    actionNeeded: "需要處理",
    notReviewedYet: "尚未產生審查",
    notAvailable: "暫無",
    noEmailAvailable: "暫無電子郵件",
    fileUploaded: "檔案已上傳"
  },
  switcher: {
    label: "語言",
    saving: "正在切換語言..."
  },
  site: {
    ...zhCnMessages.site,
    tagline: "面向延期準備的案件工作台",
    footerTagline: "聚焦案件準備工作台",
    footerDescription:
      "Tideus 幫助使用者圍繞高頻、材料密集型案件準備工作整理資料、保存 intake、追蹤材料狀態，並產生結構化審查結果。",
    mainNav: [
      { label: "如何運作", href: "/how-it-works" },
      { label: "適用情境", href: "/use-cases" },
      { label: "提問入口", href: "/case-question" },
      { label: "開始案件", href: "/start-case" },
      { label: "信任與邊界", href: "/trust" },
      { label: "案件工作台", href: "/dashboard" }
    ],
    footerGroups: [
      {
        title: "產品",
        links: [
          { label: "如何運作", href: "/how-it-works" },
          { label: "適用情境", href: "/use-cases" },
          { label: "提問入口", href: "/case-question" },
          { label: "開始案件", href: "/start-case" },
          { label: "案件工作台", href: "/dashboard" }
        ]
      },
      {
        title: "公司",
        links: [
          { label: "信任與邊界", href: "/trust" },
          { label: "預約示範", href: "/book-demo" },
          { label: "隱私", href: "/privacy" },
          { label: "條款", href: "/terms" }
        ]
      }
    ]
  },
  hero: {
    ...zhCnMessages.hero,
    badge: "工作流程優先的案件準備",
    title: "先把案件整理清楚，再進入耗時的人工審查。",
    description:
      "Tideus 是一個面向高頻、材料密集型申請與延期準備的 AI 案件工作台。第一階段只支援極少數情境：清晰的工作流程、結構化審查結果，以及可隨時繼續的案件紀錄。",
    startCase: "開始案件",
    bookDemo: "預約示範",
    stats: [
      { value: "2", label: "首個發布視窗僅支援兩個高頻楔形工作流程。" },
      { value: "8", label: "結構化審查模組：就緒度、清單、缺失項、風險、時間提醒、後續動作、脈絡、參考標籤。" },
      { value: "1", label: "一個保存 intake、材料和審查版本的案件工作台。" }
    ],
    exampleBadge: "審查結果示例",
    exampleTitle: "聚焦型案件工作台應該帶來的感受",
    exampleDescription: "清晰的就緒訊號、可見的材料缺口，以及真正推動案件前進的下一步。",
    exampleReviewTitle: "學簽延期審查",
    exampleReviewSummary: "需要關注：案件已接近可審，但在讀證明和學費材料仍需更完整、更新的版本。",
    exampleMissingLabel: "缺失項",
    exampleMissingValue: "更新後的在讀證明與最終學費付款證明。",
    exampleNextStepLabel: "下一步",
    exampleNextStepValue: "先收緊解釋信並更新證據清單，再進入下一輪審查。",
    materialsLabel: "材料追蹤",
    materialsDescription: "預期材料始終可見，案件可以從 intake 平順推進到資料審查，而不是靠記憶。",
    reviewHistoryLabel: "審查版本",
    reviewHistoryDescription: "每一輪都會保存就緒度快照、風險和下一步，而不是變成一次性的 AI 對話。"
  },
  ctaSection: {
    ...zhCnMessages.ctaSection,
    badge: "聚焦且便於交接",
    title: "從受支援的案件類型開始，把資料包一步步整理乾淨。",
    description:
      "Tideus 聚焦在結構化案件準備：intake、材料追蹤、審查輸出，以及能讓下一次專業溝通更快進入脈絡的保存型工作台。",
    startCase: "開始案件",
    bookDemo: "預約示範"
  },
  home: {
    ...zhCnMessages.home,
    valuePropsEyebrow: "為什麼這個楔形切口成立",
    valuePropsTitle: "案件工作台，比一排零散工具更有用。",
    valuePropsDescription:
      "Tideus 刻意做窄：更少的情境、更清楚的工作流程邊界，以及真正能推動案件前進的輸出模組。",
    supportedEyebrow: "目前支援的情境",
    supportedTitle: "先從產品真正能正確支援的案件開始。",
    supportedDescription:
      "第一階段刻意保持很窄，這樣工作流程才能正確、結構清晰、適合示範，而不是寬泛又模糊。",
    viewWorkflow: "查看工作流程",
    workflowEyebrow: "工作流程",
    workflowTitle: "產品被設計成讓一個案件沿著一條審查路徑推進。",
    workflowDescription: "流程刻意保持收斂：選擇案件類型、完成 intake、標記材料，並產生可保存的審查結果。",
    trustEyebrow: "信任邊界",
    trustTitle: "真正有幫助的案件準備，必須清楚說明它不是什麼。",
    trustCardTitle: "邊界",
    faqEyebrow: "常見問題",
    faqTitle: "在把真實案件交給工作流程產品之前，人們最常問的問題。",
    narrowingEyebrow: "為什麼產品在收窄",
    narrowingTitle: "目標是得到更乾淨的案件資料包，而不是做更大的站點。",
    narrowingDescription:
      "Tideus 現在優先考慮工作流程正確性，而不是泛化的 AI 廣度。這代表更少承諾、更強結構，以及更好的人工接手點。"
  },
  howItWorks: {
    ...zhCnMessages.howItWorks,
    eyebrow: "如何運作",
    title: "產品的目標，是在真正的人工審查開始前把案件資料包整理清楚。",
    description: "Tideus 被設計成一條窄而清晰的路徑：intake、材料、結構化審查，以及可保存的後續追蹤。",
    startCase: "開始案件",
    bookDemo: "預約示範",
    structuredOutputEyebrow: "結構化輸出",
    structuredOutputTitle: "結果應該看起來像一塊案件審查結果，而不是一段對話紀錄。",
    reviewBlockBadge: "審查模組",
    reviewBlockTitle: "每次案件審查都圍繞同一組六個核心訊號。",
    reviewBlockItems: ["就緒狀態", "清單", "缺失項", "風險標記", "時間說明", "下一步"],
    trustEyebrow: "信任",
    trustTitle: "只有邊界寫清楚，工作流程才會持續有用。",
    trustCardTitle: "邊界"
  },
  useCases: {
    ...zhCnMessages.useCases,
    eyebrow: "適用情境",
    title: "目前僅支援極少數高頻、材料密集型案件類型。",
    description: "首個發布視窗會保持很小。Tideus 只會公開那些能被穩定結構化和一致審查的工作流程。",
    startCase: "開始案件",
    reviewBoundaries: "查看邊界",
    detailCta: "查看工作流程詳情",
    outOfScopeTitle: "目前刻意不做的範圍",
    outOfScopeDescription: "讓產品真正有用的最快路徑，是把第一階段做窄，而不是假裝什麼都能覆蓋。",
    outOfScopeItems: [
      "廣泛的永久居民路徑策略規劃",
      "跨多個類別的通用路徑比較",
      "開放式法律分流或代理",
      "超出目前受支援工作流程的高裁量、複雜情境"
    ]
  },
  useCaseDetail: {
    ...zhCnMessages.useCaseDetail,
    startThisCase: "開始這個案件",
    bookDemo: "預約示範",
    designedTitle: "這個工作流程是為了解決什麼",
    goodFitTitle: "適合這個楔形工作流程的情況",
    goodFitDescription: "這些訊號說明這條工作流程是正確的起點。",
    materialsEyebrow: "材料",
    materialsDescription: "案件工作台會追蹤該工作流程所需的預期材料類型。",
    reviewEyebrow: "審查",
    reviewDescription: "審查結果被結構化為真實的案件交接或最終品質檢查所需內容。",
    reviewBullets: ["就緒狀態", "清單", "缺失項", "風險標記", "時間說明", "下一步"],
    notForTitle: "不適合這個工作流程的情況",
    notForDescription: "即使標籤聽起來相近，也不應把以下案件當作常規楔形工作流程來處理。"
  },
  startCase: {
    ...zhCnMessages.startCase,
    eyebrow: "開始案件",
    title: "選擇與你目前案件準備任務相匹配的工作流程。",
    description: "選擇一個受支援的案件類型，進入 intake，並開始建立可隨時繼續的案件紀錄。",
    bookDemo: "預約示範",
    openWorkspace: "開啟案件工作台",
    loginToSave: "登入後保存案件",
    startUseCase: "開始",
    viewWorkflowDetail: "查看工作流程詳情"
  },
  caseQuestionPage: {
    ...zhCnMessages.caseQuestionPage,
    eyebrow: "AI 前門",
    title: "在不脫離工作流程的前提下，先問一個案件準備問題。",
    description: "圍繞訪客紀錄或學簽延期提出聚焦問題，再把結構化答案轉成工作台動作。",
    startCase: "開始案件",
    bookDemo: "預約示範",
    boundaryCardTitle: "邊界",
    boundaryItems: [
      "回傳結構化答案，而不是開放式聊天",
      "只支援目前楔形情境",
      "追蹤動作可以直接轉成可保存的案件工作台"
    ]
  },
  caseQuestionEntry: {
    ...zhCnMessages.caseQuestionEntry,
    initialMessage: "圍繞受支援情境提出一個與案件準備直接相關的問題。",
    tooShortQuestion: "請把問題問得更具體一些。",
    generating: "正在生成結構化答案...",
    answerReady: "結構化答案已生成。如果這會影響案件推進，請把它保存到工作台。",
    generateError: "暫時無法回答這個問題。",
    saveBeforeGenerate: "請先生成結構化答案，再保存為工作台動作。",
    creatingWorkspace: "正在建立案件工作台脈絡...",
    signInToSave: "請先登入後再保存該答案。",
    saveError: "暫時無法保存該答案。",
    savedWorkspace: "已保存為案件工作台，並帶入初始材料與追蹤動作。",
    taskBadge: "任務型入口",
    title: "提出一個工作流程問題",
    description: "答案會保持結構化，因此可以直接轉成清單工作、追蹤動作或可保存的案件工作台。",
    scenarioLabel: "情境",
    questionLabel: "問題",
    questionPlaceholder: "例如：我有資金證明，但護照快到期了。下一步最應該先追蹤什麼？",
    questionHelper: "請把問題限定在所選情境的材料、風險、時間或下一步規劃上。",
    caseQuestionLabel: "案件問題",
    generateButton: "生成結構化答案",
    generatingButton: "正在整理答案...",
    workspaceTitle: "把答案轉成工作台動作",
    workspaceDescription: "將結構化答案保存為草稿案件，讓追蹤動作附著在可重用的案件紀錄上。",
    saveToWorkspace: "保存到工作台",
    generateChecklist: "生成清單",
    startTracking: "開始追蹤",
    continueInWorkspace: "繼續進入案件工作台",
    openSavedWorkspace: "開啟已保存工作台",
    emptyTitle: "結構化輸出，而不是聊天紀錄",
    emptyDescription: "Tideus 會回傳摘要、為什麼重要、脈絡備註、情境警示、下一步和追蹤動作。",
    structuredAnswerTitle: "結構化答案",
    summaryTitle: "摘要",
    whyMattersTitle: "為什麼重要",
    contextTitle: "支援性脈絡",
    warningsTitle: "情境警示",
    nextStepsTitle: "下一步",
    trackerActionsTitle: "追蹤動作",
    emptyWarnings: "目前沒有額外情境警示。",
    emptyItems: "目前沒有可顯示內容。"
  },
  caseQuestionPanel: {
    ...zhCnMessages.caseQuestionPanel,
    presetQuestions: ["我還缺什麼？", "為什麼這是風險？", "和上一版相比有什麼變化？", "我下一步該做什麼？"],
    initialMessage: "圍繞這個已保存案件提出一個結構化問題。",
    tooShortQuestion: "請把針對該案件的問題問得更具體一些。",
    loading: "正在讀取案件脈絡並生成結構化答案...",
    success: "結構化答案已寫入該案件的 AI 軌跡。",
    error: "暫時無法回答這個案件問題。",
    badge: "案件脈絡問題",
    title: "詢問這個案件",
    descriptionTemplate: "回答會基於 {caseTitle}、最新的 {useCaseTitle} 審查結果、材料狀態以及內部知識脈絡。",
    questionLabel: "問題",
    latestReviewContext: "最新審查脈絡",
    answerButton: "根據案件脈絡回答",
    answeringButton: "回答中...",
    summaryTitle: "摘要",
    whyTitle: "為什麼重要",
    nextStepsTitle: "下一步",
    warningsTitle: "警示",
    trackerActionsTitle: "追蹤動作",
    emptyWarning: "目前沒有額外情境警示。",
    emptyItems: "目前沒有可顯示內容。"
  },
  authLayout: {
    secureAccess: "安全帳戶存取",
    backHome: "返回首頁"
  },
  authPage: {
    ...zhCnMessages.authPage,
    loginBadge: "登入",
    loginTitle: "登入後，從上次中斷的地方繼續案件工作流程。",
    loginDescription: "登入即可存取你的案件工作台、已保存的材料狀態和結構化審查歷史。",
    loginHighlights: [
      "電子郵件與密碼登入後即可進入案件工作台。",
      "只有有效工作階段才能開啟儀表板與工作流程頁面。",
      "登入後，已保存的 intake、材料和審查歷史都會出現在工作台中。"
    ],
    signupBadge: "註冊",
    signupTitle: "建立帳戶，從第一次 intake 開始就保存案件準備工作。",
    signupDescription: "建立帳戶後，intake 答案、材料追蹤和結構化審查結果都會保存在同一個工作台中。",
    signupHighlights: [
      "表單包含驗證、載入、成功和錯誤狀態。",
      "啟用後，新帳戶可以走電子郵件確認流程。",
      "保存的案件與審查版本從一開始就會綁定到同一個帳戶。"
    ]
  },
  authForm: {
    ...zhCnMessages.authForm,
    callbackError: "電子郵件確認沒有完成，請重新登入。",
    loginIntro: "使用帳戶資訊繼續進入案件工作台。",
    signupIntro: "建立帳戶以保存案件、材料和審查歷史。",
    fullNameRequired: "請輸入姓名。",
    invalidEmail: "請輸入有效的電子郵件地址。",
    passwordLength: "密碼至少需要 8 個字元。",
    fixFields: "請先修正高亮欄位，再繼續。",
    signingIn: "正在登入...",
    creatingAccount: "正在建立帳戶...",
    authFailed: "暫時無法完成驗證。",
    authComplete: "驗證已完成。",
    badge: "帳戶存取",
    loginTitle: "登入你的帳戶",
    signupTitle: "建立你的帳戶",
    description: "使用帳戶存取已保存的案件、結構化審查版本和完整工作台。",
    fullNameLabel: "姓名",
    fullNamePlaceholder: "王小明",
    emailLabel: "電子郵件",
    emailPlaceholder: "you@example.com",
    passwordLabel: "密碼",
    passwordPlaceholder: "至少 8 個字元",
    workingButton: "處理中...",
    loginButton: "繼續進入工作台",
    signupButton: "建立帳戶",
    needAccount: "還沒有帳戶？",
    haveAccount: "已經有帳戶？",
    createOne: "立即建立",
    loginLink: "去登入"
  }
};

export const appMessages: Record<AppLocale, AppMessages> = {
  "zh-CN": zhCnMessages,
  "zh-TW": zhTwMessages
};

export function getAppMessages(locale: AppLocale = defaultLocale) {
  return appMessages[locale] ?? appMessages[defaultLocale];
}
