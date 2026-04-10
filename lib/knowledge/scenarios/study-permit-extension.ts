import type { CaseKnowledgeInput, CaseScenarioKnowledge } from "@/lib/knowledge/types";
import type { CaseDocumentStatus } from "@/lib/case-workflows";

export function buildStudyPermitExtensionKnowledge(input: CaseKnowledgeInput): CaseScenarioKnowledge {
  return {
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
        freshness: "static-adapter"
      },
      {
        label: "IRCC: Study permit extension document checklist",
        referenceType: "materials-guidance",
        trustLevel: "official-context",
        freshness: "static-adapter"
      }
    ],
    supportingContextNotes: [
      "Study Permit Extension prep should keep enrolment, academic progress, funding, and extension timing aligned in one clean record.",
      "School documents and funding evidence should support the requested extension period, not just show that some documents exist."
    ],
    materialsGuidanceNotes: [
      {
        documentKey: "enrolment-letter",
        label: "Enrolment letter",
        note: "Internal context: enrolment proof should be current and align with the requested extension period.",
        appliesToStatuses: ["missing", "collecting", "needs-refresh", "ready"] satisfies CaseDocumentStatus[]
      },
      {
        documentKey: "transcript-or-progress",
        label: "Transcript or progress evidence",
        note: "Internal context: progress evidence should make academic standing or any study delay easy to understand.",
        appliesToStatuses: ["missing", "collecting", "needs-refresh", "ready"] satisfies CaseDocumentStatus[]
      },
      {
        documentKey: "proof-of-funds",
        label: "Proof of funds",
        note: "Internal context: funding evidence should support the remaining study period and living-cost position.",
        appliesToStatuses: ["missing", "collecting", "needs-refresh", "ready"] satisfies CaseDocumentStatus[]
      },
      {
        documentKey: "extension-explanation",
        label: "Extension explanation letter",
        note:
          "Internal context: the explanation should tie program timing, funding, current status, and the extension reason together.",
        appliesToStatuses: ["missing", "collecting", "needs-refresh", "ready"] satisfies CaseDocumentStatus[]
      }
    ],
    scenarioSpecificWarnings: buildStudyPermitExtensionWarnings(input)
  };
}

function buildStudyPermitExtensionWarnings(input: CaseKnowledgeInput) {
  const { intake } = input;
  const warnings: string[] = [];

  if (intake.currentStatus && intake.currentStatus !== "student") {
    warnings.push(
      "This Study Permit Extension workflow assumes in-status student extension prep, so the current status should be confirmed."
    );
  }

  if (intake.scenarioProgressStatus !== "good-standing" || input.intakeNormalization?.explanationSignals.schoolProgressConcern) {
    warnings.push("Academic standing, tuition, or progress issues should be explained directly before the package is treated as clean.");
  }

  if (intake.supportEvidenceStatus !== "ready") {
    warnings.push("Current enrolment evidence is central to this scenario and should be refreshed before final handoff.");
  }

  return warnings;
}
