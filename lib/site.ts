export const siteConfig = {
  name: "Tideus",
  mark: "TD",
  description:
    "Tideus is an AI-powered case workspace for high-frequency Canada temporary resident application and extension prep.",
  supportEmail: "support@tideus.tech"
};

export const mainNav = [
  { label: "How It Works", href: "/how-it-works" },
  { label: "Use Cases", href: "/use-cases" },
  { label: "Start a Case", href: "/start-case" },
  { label: "Trust & Boundaries", href: "/trust" },
  { label: "Case Dashboard", href: "/dashboard" }
];

export const footerGroups = [
  {
    title: "Product",
    links: [
      { label: "How It Works", href: "/how-it-works" },
      { label: "Use Cases", href: "/use-cases" },
      { label: "Start a Case", href: "/start-case" },
      { label: "Case Dashboard", href: "/dashboard" }
    ]
  },
  {
    title: "Company",
    links: [
      { label: "Trust & Boundaries", href: "/trust" },
      { label: "Book Demo", href: "/book-demo" },
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" }
    ]
  }
];

export const homeValueProps = [
  {
    eyebrow: "Case-first",
    title: "One narrow wedge, done well",
    description:
      "Tideus starts with high-frequency, document-heavy temporary resident extension prep instead of trying to be a universal immigration assistant."
  },
  {
    eyebrow: "Structured output",
    title: "Checklist before chatbot",
    description:
      "The result centers on readiness, missing items, risk flags, timeline pressure, and next steps instead of a long AI answer."
  },
  {
    eyebrow: "Saved workflow",
    title: "Resume the case where it stopped",
    description:
      "Each case keeps intake answers, document state, review versions, and next actions together in one workspace."
  }
];

export const workflowSteps = [
  {
    eyebrow: "01",
    title: "Choose a supported scenario",
    description:
      "Start from a narrow use case the product is actually built for, not from a broad immigration search problem."
  },
  {
    eyebrow: "02",
    title: "Complete the case intake",
    description:
      "Capture only the facts that materially affect the package, such as timing, funds, current status, and explanation pressure."
  },
  {
    eyebrow: "03",
    title: "Mark the materials you have",
    description:
      "Organize expected documents, note what is missing, and label the materials already collected."
  },
  {
    eyebrow: "04",
    title: "Generate a review-ready output",
    description:
      "Get a structured review block with readiness, checklist, risks, and next steps before the file moves to a professional."
  }
];

export const trustBoundaryPoints = [
  "Tideus is not a law firm, government service, or licensed representative.",
  "The product is designed to organize case prep and surface common gaps, not replace legal advice.",
  "If a case shows serious risk, unclear history, or unusual facts, the next step should be a professional review."
];

export const faqItems = [
  {
    question: "What is Tideus built for right now?",
    answer:
      "Phase 1 is intentionally narrow. Tideus is being positioned as a workflow and case workspace for high-frequency temporary resident application and extension prep, starting with Visitor Record and Study Permit Extension scenarios."
  },
  {
    question: "Does Tideus replace a licensed professional?",
    answer:
      "No. The goal is to help users organize materials, spot gaps, and prepare a cleaner case package before a professional review or filing step."
  },
  {
    question: "What does the review output look like?",
    answer:
      "The review output is structured around readiness, checklist items, missing evidence, risk flags, timeline pressure, and next steps. It is not designed as a generic chatbot response."
  }
];

export const dashboardNav = [
  { label: "Overview", href: "/dashboard" },
  { label: "Cases", href: "/dashboard/cases" },
  { label: "Profile", href: "/dashboard/profile" },
  { label: "Start a Case", href: "/start-case" }
];

export const legacyWorkspaceLinks = [
  { label: "Saved assessments", href: "/dashboard/assessments" },
  { label: "Saved comparisons", href: "/dashboard/comparisons" },
  { label: "Saved Copilot threads", href: "/dashboard/copilot" }
];
