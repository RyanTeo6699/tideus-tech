export {
  CASE_KNOWLEDGE_ADAPTER_VERSION,
  applyKnowledgeToReview as applyCaseKnowledgeToReview,
  buildKnowledgeContext as buildCaseKnowledgeContext,
  summarizeKnowledgeContext as summarizeCaseKnowledgeContext
} from "@/lib/knowledge/adapter";

export type {
  CaseKnowledgeContext,
  CaseKnowledgeInput,
  CaseKnowledgeMaterialGuidanceNote,
  CaseKnowledgeMaterialSnapshot,
  CaseKnowledgeProcessingTimeNote,
  CaseKnowledgeReference,
  CaseKnowledgeTrustLevel
} from "@/lib/knowledge/adapter";
