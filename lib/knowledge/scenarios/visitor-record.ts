import type { CaseKnowledgeInput, CaseScenarioKnowledge } from "@/lib/knowledge/types";
import type { CaseDocumentStatus } from "@/lib/case-workflows";

export function buildVisitorRecordKnowledge(input: CaseKnowledgeInput): CaseScenarioKnowledge {
  return {
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
    supportingContextNotes: [
      "Visitor Record prep should keep the requested stay time-bound, supportable, and connected to a clear temporary plan.",
      "Funding, current status, passport validity, and the extension explanation are the main workflow anchors for this scenario."
    ],
    materialsGuidanceNotes: [
      {
        documentKey: "extension-explanation",
        label: "Extension explanation letter",
        note:
          "Internal context: the explanation should connect the extension reason, temporary intent, support record, and planned end point.",
        appliesToStatuses: ["missing", "collecting", "needs-refresh", "ready"] satisfies CaseDocumentStatus[]
      },
      {
        documentKey: "proof-of-funds",
        label: "Proof of funds",
        note:
          "Internal context: funding evidence should match the requested stay length and the support story used in the explanation.",
        appliesToStatuses: ["missing", "collecting", "needs-refresh", "ready"] satisfies CaseDocumentStatus[]
      },
      {
        documentKey: "temporary-intent-support",
        label: "Temporary intent support",
        note:
          "Internal context: temporary-intent support should make the visit look time-bound instead of open-ended.",
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
    warnings.push("This Visitor Record workflow assumes visitor-status extension prep, so the current status should be confirmed.");
  }

  if (intake.scenarioProgressStatus === "weak" || input.intakeNormalization?.explanationSignals.temporaryIntentConcern) {
    warnings.push(
      "Temporary intent is a scenario-specific pressure point and should be supported by clear facts, not generic explanation language."
    );
  }

  if (intake.applicationReason === "family-or-host" && intake.supportEvidenceStatus !== "ready") {
    warnings.push("Host or accommodation support is part of the case story but the support record is not yet clean.");
  }

  return warnings;
}
