import { defaultLocale, type AppLocale } from "@/lib/i18n/config";
import { getAppMessages } from "@/lib/i18n/messages";

type LinkItem = {
  label: string;
  href: string;
};

type FooterGroup = {
  title: string;
  links: LinkItem[];
};

type ContentCard = {
  eyebrow: string;
  title: string;
  description: string;
};

type FaqItem = {
  question: string;
  answer: string;
};

const localizedContent: Record<
  AppLocale,
  {
    description: string;
    homeValueProps: ContentCard[];
    workflowSteps: ContentCard[];
    trustBoundaryPoints: string[];
    faqItems: FaqItem[];
    dashboardNav: LinkItem[];
  }
> = {
  "zh-CN": {
    description:
      "Tideus 是一个案件优先的工作流工作台，聚焦高频、规则相对清晰、材料密集型的加拿大临时居民申请与延期准备。",
    homeValueProps: [
      {
        eyebrow: "案件优先",
        title: "先把一个窄场景做好",
        description:
          "Tideus 从高频、材料密集型的临时居民延期准备切入，而不是试图成为覆盖所有移民问题的通用助手。"
      },
      {
        eyebrow: "结构化输出",
        title: "先有结构化审查，再谈工具扩张",
        description:
          "核心输出聚焦在就绪度、缺失项、风险、时间压力和下一步，而不是散乱的工具型体验。"
      },
      {
        eyebrow: "保存型工作流",
        title: "从中断处继续案件",
        description:
          "每个案件都会把资料收集回答、材料状态、审查版本和下一步动作保存在同一个工作台里。"
      }
    ],
    workflowSteps: [
      {
        eyebrow: "01",
        title: "选择受支持的工作流",
        description: "从产品真正有能力支持的窄场景开始，而不是从广泛的移民搜索问题开始。"
      },
      {
        eyebrow: "02",
        title: "完成案件资料收集",
        description: "只采集会实质影响资料包的事实，例如时间、资金、当前身份和解释压力。"
      },
      {
        eyebrow: "03",
        title: "标记你已有的材料",
        description: "整理预期材料，标记缺失项，并记录已经收集到的内容。"
      },
      {
        eyebrow: "04",
        title: "生成可审查的输出",
        description: "在资料进入专业人士手中前，先得到包含就绪度、清单、风险和下一步的结构化结果。"
      }
    ],
    trustBoundaryPoints: [
      "Tideus 不是律师事务所、政府服务或持牌代理机构。",
      "产品的目标是帮助整理案件准备并暴露常见缺口，而不是替代法律建议。",
      "如果案件出现严重风险、历史不清或非常规事实，下一步应当转入专业人工审查。"
    ],
    faqItems: [
      {
        question: "Tideus 目前是为哪些情况而做的？",
        answer:
          "第一阶段会刻意保持很窄。Tideus 当前被定位为面向高频临时居民申请与延期准备的工作流和案件工作台，起点是访客记录和学签延期。"
      },
      {
        question: "Tideus 会替代持牌专业人士吗？",
        answer:
          "不会。目标是帮助用户整理材料、发现缺口，并在进入专业审查或正式递交前，把资料包整理得更干净。"
      },
      {
        question: "审查输出会是什么样子？",
        answer:
          "审查输出围绕就绪度、清单、缺失证据、风险标记、时间压力和下一步。最新版本还可以打开为适合打印的交接摘要。"
      }
    ],
    dashboardNav: [
      { label: "总览", href: "/dashboard" },
      { label: "案件", href: "/dashboard/cases" },
      { label: "资料档案", href: "/dashboard/profile" },
      { label: "开始案件", href: "/start-case" }
    ]
  },
  "zh-TW": {
    description:
      "Tideus 是一個案件優先的工作流程工作台，聚焦高頻、規則相對清晰、材料密集型的加拿大臨時居民申請與延期準備。",
    homeValueProps: [
      {
        eyebrow: "案件優先",
        title: "先把一個窄情境做好",
        description:
          "Tideus 從高頻、材料密集型的臨時居民延期準備切入，而不是試圖成為覆蓋所有移民問題的通用助手。"
      },
      {
        eyebrow: "結構化輸出",
        title: "先有結構化審查，再談工具擴張",
        description:
          "核心輸出聚焦在就緒度、缺失項、風險、時間壓力和下一步，而不是散亂的工具型體驗。"
      },
      {
        eyebrow: "保存型工作流程",
        title: "從中斷處繼續案件",
        description:
          "每個案件都會把資料收集回答、材料狀態、審查版本和下一步動作保存在同一個工作台裡。"
      }
    ],
    workflowSteps: [
      {
        eyebrow: "01",
        title: "選擇受支援的工作流程",
        description: "從產品真正有能力支援的窄情境開始，而不是從廣泛的移民搜尋問題開始。"
      },
      {
        eyebrow: "02",
        title: "完成案件資料收集",
        description: "只蒐集會實質影響資料包的事實，例如時間、資金、目前身分和解釋壓力。"
      },
      {
        eyebrow: "03",
        title: "標記你已有的材料",
        description: "整理預期材料、標記缺失項，並記錄已經收集到的內容。"
      },
      {
        eyebrow: "04",
        title: "產生可審查的輸出",
        description: "在資料進入專業人士手中前，先得到包含就緒度、清單、風險和下一步的結構化結果。"
      }
    ],
    trustBoundaryPoints: [
      "Tideus 不是律師事務所、政府服務或持牌代理機構。",
      "產品的目標是協助整理案件準備並暴露常見缺口，而不是取代法律建議。",
      "如果案件出現嚴重風險、歷史不清或非常規事實，下一步應當轉入專業人工審查。"
    ],
    faqItems: [
      {
        question: "Tideus 目前是為哪些情況而做的？",
        answer:
          "第一階段會刻意保持很窄。Tideus 目前被定位為面向高頻臨時居民申請與延期準備的工作流程和案件工作台，起點是訪客紀錄和學簽延期。"
      },
      {
        question: "Tideus 會取代持牌專業人士嗎？",
        answer:
          "不會。目標是幫助使用者整理材料、發現缺口，並在進入專業審查或正式遞交前，把資料包整理得更乾淨。"
      },
      {
        question: "審查輸出會是什麼樣子？",
        answer:
          "審查輸出圍繞就緒度、清單、缺失證據、風險標記、時間壓力和下一步。最新版本還可以打開為適合列印的交接摘要。"
      }
    ],
    dashboardNav: [
      { label: "總覽", href: "/dashboard" },
      { label: "案件", href: "/dashboard/cases" },
      { label: "資料檔案", href: "/dashboard/profile" },
      { label: "開始案件", href: "/start-case" }
    ]
  }
};

export function getSiteConfig(locale: AppLocale = defaultLocale) {
  return {
    name: "Tideus",
    mark: "TD",
    description: localizedContent[locale].description,
    supportEmail: "support@tideus.tech"
  };
}

export function getMainNav(locale: AppLocale = defaultLocale) {
  return getAppMessages(locale).site.mainNav;
}

export function getFooterGroups(locale: AppLocale = defaultLocale): FooterGroup[] {
  return getAppMessages(locale).site.footerGroups;
}

export function getHomeValueProps(locale: AppLocale = defaultLocale) {
  return localizedContent[locale].homeValueProps;
}

export function getWorkflowSteps(locale: AppLocale = defaultLocale) {
  return localizedContent[locale].workflowSteps;
}

export function getTrustBoundaryPoints(locale: AppLocale = defaultLocale) {
  return localizedContent[locale].trustBoundaryPoints;
}

export function getFaqItems(locale: AppLocale = defaultLocale) {
  return localizedContent[locale].faqItems;
}

export function getDashboardNav(locale: AppLocale = defaultLocale) {
  return localizedContent[locale].dashboardNav;
}

export const siteConfig = getSiteConfig();
export const mainNav = getMainNav();
export const footerGroups = getFooterGroups();
export const homeValueProps = getHomeValueProps();
export const workflowSteps = getWorkflowSteps();
export const trustBoundaryPoints = getTrustBoundaryPoints();
export const faqItems = getFaqItems();
export const dashboardNav = getDashboardNav();
