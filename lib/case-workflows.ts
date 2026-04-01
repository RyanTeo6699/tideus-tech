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

export const currentStatusOptions: CaseSelectOption[] = [
  { label: "Visitor in Canada", value: "visitor" },
  { label: "Student in Canada", value: "student" },
  { label: "Worker in Canada", value: "worker" },
  { label: "Another temporary status", value: "other" }
];

export const urgencyOptions: CaseSelectOption[] = [
  { label: "Within 30 days", value: "under-30" },
  { label: "Within 31 to 60 days", value: "30-60" },
  { label: "More than 60 days", value: "over-60" }
];

export const passportValidityOptions: CaseSelectOption[] = [
  { label: "Under 6 months", value: "under-6" },
  { label: "6 to 12 months", value: "6-12" },
  { label: "More than 12 months", value: "12-plus" },
  { label: "Not confirmed yet", value: "unknown" }
];

export const proofOfFundsOptions: CaseSelectOption[] = [
  { label: "Ready", value: "ready" },
  { label: "Partially ready", value: "partial" },
  { label: "Missing", value: "missing" },
  { label: "Still unclear", value: "unknown" }
];

export const complianceOptions: CaseSelectOption[] = [
  { label: "No known issues", value: "no" },
  { label: "Yes, there is something to explain", value: "yes" },
  { label: "Still unclear", value: "unclear" }
];

export const supportEvidenceOptions: CaseSelectOption[] = [
  { label: "Ready", value: "ready" },
  { label: "Partially ready", value: "partial" },
  { label: "Missing", value: "missing" },
  { label: "Not needed for this case", value: "not-needed" }
];

const commonFields: CaseIntakeField[] = [
  {
    name: "title",
    label: "Case title",
    type: "text",
    placeholder: "Example: Visitor record for June expiry",
    helper: "Optional. If you leave this blank, Tideus will name the case automatically."
  },
  {
    name: "currentStatus",
    label: "Current temporary status",
    type: "select",
    required: true,
    options: currentStatusOptions
  },
  {
    name: "currentPermitExpiry",
    label: "Current status expiry date",
    type: "date",
    required: true
  },
  {
    name: "urgency",
    label: "Working timeline",
    type: "select",
    required: true,
    options: urgencyOptions
  },
  {
    name: "passportValidity",
    label: "Passport validity",
    type: "select",
    required: true,
    options: passportValidityOptions
  },
  {
    name: "proofOfFundsStatus",
    label: "Proof of funds",
    type: "select",
    required: true,
    options: proofOfFundsOptions
  },
  {
    name: "refusalOrComplianceIssues",
    label: "Prior refusal or compliance issue",
    type: "select",
    required: true,
    options: complianceOptions
  },
  {
    name: "notes",
    label: "Case notes",
    type: "textarea",
    wide: true,
    required: true,
    placeholder:
      "Add the facts that still need explanation, the constraints shaping the filing, and anything a later professional reviewer should not miss."
  }
];

const visitorRecordDefinition: UseCaseDefinition = {
  slug: "visitor-record",
  shortTitle: "Visitor Record",
  title: "Visitor Record case preparation workspace",
  eyebrow: "Supported now",
  homepageLabel: "Visitor Record",
  description:
    "Organize a Visitor Record extension case with a structured intake, document checklist, risk review, and saved workspace history.",
  detailSummary:
    "This workflow is designed for high-frequency Visitor Record preparation where the rules are relatively clear but the case quality still depends on document completeness and explanation quality.",
  outcomeSummary:
    "The result is a readiness signal, a practical checklist, missing items, case risks, and next steps before the file goes to a professional or into final filing prep.",
  whatYouGet: [
    "A case-specific intake instead of a broad immigration questionnaire",
    "Expected-document tracking for a Visitor Record file",
    "Structured readiness output with missing items and risk flags",
    "A saved case record you can resume from the dashboard"
  ],
  fitSignals: [
    "Current visitor status is expiring and the file needs to be organized",
    "You want to see what evidence is still missing before paying for a full review",
    "You need a cleaner explanation package for temporary intent and support"
  ],
  notFor: [
    "Complex inadmissibility or litigation work",
    "A broad eligibility search across many immigration pathways",
    "Representation or legal advice"
  ],
  intakeTitle: "Capture the facts that shape a Visitor Record file",
  intakeDescription:
    "Focus the intake on timeline pressure, funds, temporary intent, and support evidence so the later review stays grounded in the actual case.",
  materialsTitle: "Mark the Visitor Record materials you already have",
  reviewTitle: "Review the case package before a professional handoff",
  specificFields: [
    {
      name: "applicationReason",
      label: "Why are you applying for the Visitor Record",
      type: "select",
      required: true,
      options: [
        { label: "Stay longer with family or a host", value: "family-or-host" },
        { label: "Tourism or personal travel", value: "tourism" },
        { label: "Wrap up affairs before departure", value: "wrap-up" },
        { label: "Wait for another status decision", value: "awaiting-next-step" },
        { label: "Another reason", value: "other" }
      ]
    },
    {
      name: "supportEntityName",
      label: "Host, family contact, or main support person",
      type: "text",
      placeholder: "Example: Sister in Calgary",
      helper: "Optional, but useful if the stay depends on someone else."
    },
    {
      name: "supportEvidenceStatus",
      label: "Host or accommodation evidence",
      type: "select",
      required: true,
      options: supportEvidenceOptions
    },
    {
      name: "scenarioProgressStatus",
      label: "Temporary intent explanation",
      type: "select",
      required: true,
      options: [
        { label: "Clear and supportable", value: "clear" },
        { label: "Partial draft or mixed evidence", value: "partial" },
        { label: "Weak or still unclear", value: "weak" }
      ]
    }
  ],
  expectedDocuments: [
    {
      key: "passport-copy",
      label: "Passport copy",
      description: "Passport bio page and any pages needed to support identity and validity.",
      required: true
    },
    {
      key: "current-status-proof",
      label: "Current status proof",
      description: "Current visitor status document, stamp, or prior authorization evidence.",
      required: true
    },
    {
      key: "extension-explanation",
      label: "Extension explanation letter",
      description: "A concise explanation of why the extension is needed and how the stay remains temporary.",
      required: true
    },
    {
      key: "proof-of-funds",
      label: "Proof of funds",
      description: "Bank statements, support evidence, or other financial proof tied to the stay.",
      required: true
    },
    {
      key: "host-or-accommodation",
      label: "Host or accommodation evidence",
      description: "Invitation letter, accommodation details, or support statement if the stay depends on it.",
      required: false
    },
    {
      key: "temporary-intent-support",
      label: "Temporary intent support",
      description: "Evidence that supports a temporary stay, planned exit, or the next lawful step.",
      required: true
    }
  ]
};

const studyPermitExtensionDefinition: UseCaseDefinition = {
  slug: "study-permit-extension",
  shortTitle: "Study Permit Extension",
  title: "Study Permit extension case preparation workspace",
  eyebrow: "Supported now",
  homepageLabel: "Study Permit Extension",
  description:
    "Prepare a Study Permit Extension file with a structured intake, expected-document tracker, and review output built for high-frequency extension work.",
  detailSummary:
    "This workflow is intentionally narrow: it helps organize a Study Permit Extension case where the core rules are known but the filing still depends on funds, enrolment proof, academic progress, and explanation quality.",
  outcomeSummary:
    "The system returns a readiness signal, document checklist, missing items, risk flags, and concrete next steps so the package can be cleaned up before final review.",
  whatYouGet: [
    "A case intake centered on extensions, not broad pathway discovery",
    "Expected-document tracking for enrolment, tuition, funding, and explanation materials",
    "Structured review output with readiness, risks, and next steps",
    "A saved case record that can be reopened from the dashboard"
  ],
  fitSignals: [
    "Current student status is approaching expiry",
    "You need to organize enrolment, tuition, and funds evidence in one place",
    "You want to spot explainable issues before a professional review"
  ],
  notFor: [
    "A full initial study permit strategy from scratch",
    "Broad permanent residence planning",
    "Legal representation or licensed advice"
  ],
  intakeTitle: "Capture the facts that shape a Study Permit Extension file",
  intakeDescription:
    "Center the intake on expiry pressure, enrolment evidence, funding position, and academic progress so the review reflects the actual extension package.",
  materialsTitle: "Mark the Study Permit Extension materials you already have",
  reviewTitle: "Review the extension package before final handoff",
  specificFields: [
    {
      name: "applicationReason",
      label: "Why are you extending the study permit",
      type: "select",
      required: true,
      options: [
        { label: "Continue the current program", value: "continue-program" },
        { label: "Need more time to finish", value: "more-time-needed" },
        { label: "Registration or scheduling delay", value: "registration-delay" },
        { label: "Program or institution transition", value: "program-transition" },
        { label: "Another reason", value: "other" }
      ]
    },
    {
      name: "supportEntityName",
      label: "School or institution",
      type: "text",
      required: true,
      placeholder: "Example: Northern Alberta Institute of Technology"
    },
    {
      name: "supportEvidenceStatus",
      label: "Enrolment evidence",
      type: "select",
      required: true,
      options: [
        { label: "Ready", value: "ready" },
        { label: "Partially ready", value: "partial" },
        { label: "Missing", value: "missing" }
      ]
    },
    {
      name: "scenarioProgressStatus",
      label: "Academic standing and tuition position",
      type: "select",
      required: true,
      options: [
        { label: "In good standing and paid up", value: "good-standing" },
        { label: "Needs explanation but fixable", value: "needs-explanation" },
        { label: "At risk or still unresolved", value: "at-risk" }
      ]
    }
  ],
  expectedDocuments: [
    {
      key: "passport-copy",
      label: "Passport copy",
      description: "Passport pages needed to confirm identity and validity.",
      required: true
    },
    {
      key: "current-study-permit",
      label: "Current study permit",
      description: "Current permit or other status document tied to the extension.",
      required: true
    },
    {
      key: "enrolment-letter",
      label: "Enrolment letter",
      description: "Current enrolment confirmation or equivalent school proof.",
      required: true
    },
    {
      key: "transcript-or-progress",
      label: "Transcript or progress evidence",
      description: "Academic standing, attendance, or progress records if they support the extension.",
      required: true
    },
    {
      key: "tuition-evidence",
      label: "Tuition evidence",
      description: "Tuition receipts, payment plan proof, or school financial confirmation.",
      required: true
    },
    {
      key: "proof-of-funds",
      label: "Proof of funds",
      description: "Available funding evidence for the remaining study period and living costs.",
      required: true
    },
    {
      key: "extension-explanation",
      label: "Extension explanation letter",
      description: "Short explanation of why the extension is needed and how the academic plan still makes sense.",
      required: true
    }
  ]
};

export const supportedUseCases: UseCaseDefinition[] = [visitorRecordDefinition, studyPermitExtensionDefinition];

const supportedUseCaseMap = new Map(supportedUseCases.map((item) => [item.slug, item]));

export function getUseCaseDefinition(slug: string | null | undefined) {
  if (!slug) {
    return null;
  }

  return supportedUseCaseMap.get(slug as SupportedUseCaseSlug) ?? null;
}

export function isSupportedUseCase(value: string): value is SupportedUseCaseSlug {
  return supportedUseCaseMap.has(value as SupportedUseCaseSlug);
}

export function getCaseStartHref(slug: SupportedUseCaseSlug) {
  return `/case-intake?useCase=${slug}`;
}

export function formatUseCaseLabel(slug: SupportedUseCaseSlug | string) {
  return getUseCaseDefinition(slug)?.shortTitle ?? slug;
}

export function formatReadinessStatus(status: CaseReadinessStatus | string) {
  const labels: Record<string, string> = {
    "not-ready": "Not ready",
    "needs-attention": "Needs attention",
    "almost-ready": "Almost ready",
    "review-ready": "Review ready"
  };

  return labels[status] ?? status;
}

export function formatDocumentStatus(status: CaseDocumentStatus | string) {
  const labels: Record<string, string> = {
    missing: "Missing",
    collecting: "Collecting",
    "needs-refresh": "Needs refresh",
    ready: "Ready",
    "not-applicable": "Not applicable"
  };

  return labels[status] ?? status;
}

export function getCaseIntakeFields(useCase: UseCaseDefinition) {
  return [...commonFields, ...useCase.specificFields];
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
