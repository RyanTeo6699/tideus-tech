// Legacy decision-support implementation.
// Active case-first workflow code should not import this file directly.
// Prefer "@/lib/legacy/tool-results" so migration-era logic stays explicitly secondary.

import type { Json } from "@/lib/database.types";

export type StructuredDecisionResult = {
  summary: string;
  whyThisMatters: string[];
  risksAndConstraints: string[];
  missingInformation: string[];
  nextSteps: string[];
};

export type CopilotStructuredResponse = {
  summary: string;
  keyConsiderations: string[];
  missingInformation: string[];
  nextSteps: string[];
};

export type CopilotResponseSource = "openai" | "rules";

export type AssessmentInput = {
  currentStatus: string;
  goal: string;
  timeline: string;
  citizenship: string;
  ageBand: string;
  maritalStatus: string;
  educationLevel: string;
  englishTestStatus: string;
  canadianExperience: string;
  foreignExperience: string;
  jobOfferSupport: string;
  provincePreference: string;
  refusalHistoryFlag: boolean;
  notes: string;
};

export type ComparisonInput = {
  optionA: string;
  optionADocumentLoad: string;
  optionATimelineFit: string;
  optionB: string;
  optionBDocumentLoad: string;
  optionBTimelineFit: string;
  priority: string;
  decisionDeadline: string;
  profileNotes: string;
};

export type CopilotInput = {
  threadId?: string;
  stage: string;
  objective: string;
  question: string;
  context: string;
  constraints: string;
};

export type CopilotUserMessageMetadata = {
  type: "copilot-user-message";
  stage: string;
  objective: string;
  context: string;
  constraints: string;
};

export type CopilotStructuredMessageMetadata = {
  type: "copilot-structured-response";
  source: CopilotResponseSource;
  model?: string;
  fallbackReason?: string;
  response: CopilotStructuredResponse;
};

type ParseSuccess<T> = {
  success: true;
  data: T;
};

type ParseFailure = {
  success: false;
  message: string;
};

type ParseResult<T> = ParseSuccess<T> | ParseFailure;

const assessmentStatuses = new Set(["outside-canada", "visitor", "student", "worker"]);
const assessmentGoals = new Set(["permanent-residence", "study-permit", "work-permit", "family-sponsorship"]);
const assessmentTimelines = new Set(["0-6", "6-12", "12-plus"]);
const ageBands = new Set(["18-24", "25-34", "35-44", "45-plus"]);
const maritalStatuses = new Set(["single", "married-or-common-law", "separated-or-divorced", "widowed"]);
const educationLevels = new Set(["secondary-or-less", "diploma-or-trade", "bachelors", "graduate"]);
const englishTestStatuses = new Set(["completed", "booked", "not-started"]);
const experienceBands = new Set(["none", "under-1-year", "1-3-years", "3-plus-years"]);
const jobOfferSupportValues = new Set(["confirmed", "in-discussion", "none"]);
const refusalHistoryValues = new Set(["yes", "no"]);

const comparisonPriorities = new Set(["speed", "documentation", "certainty"]);
const comparisonDocumentLoads = new Set(["low", "medium", "high"]);
const comparisonTimelineFitValues = new Set(["strong", "moderate", "weak"]);
const decisionDeadlines = new Set(["within-30", "within-90", "flexible"]);

const copilotStages = new Set(["research", "comparing", "documents", "ready"]);
const copilotObjectives = new Set(["choose-next-step", "document-plan", "risk-review", "timeline-planning"]);

export function parseAssessmentInput(value: unknown): ParseResult<AssessmentInput> {
  const body = readObject(value);

  if (!body) {
    return { success: false, message: "Invalid assessment payload." };
  }

  const currentStatus = readEnum(body, "currentStatus", assessmentStatuses, "Select a current status.");
  const goal = readEnum(body, "goal", assessmentGoals, "Select a primary goal.");
  const timeline = readEnum(body, "timeline", assessmentTimelines, "Select a timeline.");
  const citizenship = readString(body, "citizenship", "Enter citizenship.");
  const ageBand = readEnum(body, "ageBand", ageBands, "Select an age band.");
  const maritalStatus = readEnum(body, "maritalStatus", maritalStatuses, "Select a marital status.");
  const educationLevel = readEnum(body, "educationLevel", educationLevels, "Select an education level.");
  const englishTestStatus = readEnum(
    body,
    "englishTestStatus",
    englishTestStatuses,
    "Select current English test status."
  );
  const canadianExperience = readEnum(
    body,
    "canadianExperience",
    experienceBands,
    "Select current Canadian experience."
  );
  const foreignExperience = readEnum(
    body,
    "foreignExperience",
    experienceBands,
    "Select current foreign experience."
  );
  const jobOfferSupport = readEnum(body, "jobOfferSupport", jobOfferSupportValues, "Select current job offer support.");
  const provincePreference = readString(body, "provincePreference", "Enter a province preference.");
  const refusalHistoryFlag = readBooleanFlag(body, "refusalHistoryFlag", refusalHistoryValues, "Select refusal history.");
  const notes = readString(body, "notes", "Add context notes.");

  if (!currentStatus.success) return currentStatus;
  if (!goal.success) return goal;
  if (!timeline.success) return timeline;
  if (!citizenship.success) return citizenship;
  if (!ageBand.success) return ageBand;
  if (!maritalStatus.success) return maritalStatus;
  if (!educationLevel.success) return educationLevel;
  if (!englishTestStatus.success) return englishTestStatus;
  if (!canadianExperience.success) return canadianExperience;
  if (!foreignExperience.success) return foreignExperience;
  if (!jobOfferSupport.success) return jobOfferSupport;
  if (!provincePreference.success) return provincePreference;
  if (!refusalHistoryFlag.success) return refusalHistoryFlag;
  if (!notes.success) return notes;

  return {
    success: true,
    data: {
      currentStatus: currentStatus.data,
      goal: goal.data,
      timeline: timeline.data,
      citizenship: citizenship.data,
      ageBand: ageBand.data,
      maritalStatus: maritalStatus.data,
      educationLevel: educationLevel.data,
      englishTestStatus: englishTestStatus.data,
      canadianExperience: canadianExperience.data,
      foreignExperience: foreignExperience.data,
      jobOfferSupport: jobOfferSupport.data,
      provincePreference: provincePreference.data,
      refusalHistoryFlag: refusalHistoryFlag.data,
      notes: notes.data
    }
  };
}

export function parseComparisonInput(value: unknown): ParseResult<ComparisonInput> {
  const body = readObject(value);

  if (!body) {
    return { success: false, message: "Invalid comparison payload." };
  }

  const optionA = readString(body, "optionA", "Enter Option A.");
  const optionADocumentLoad = readEnum(
    body,
    "optionADocumentLoad",
    comparisonDocumentLoads,
    "Select the documentation load for Option A."
  );
  const optionATimelineFit = readEnum(
    body,
    "optionATimelineFit",
    comparisonTimelineFitValues,
    "Select the timeline fit for Option A."
  );
  const optionB = readString(body, "optionB", "Enter Option B.");
  const optionBDocumentLoad = readEnum(
    body,
    "optionBDocumentLoad",
    comparisonDocumentLoads,
    "Select the documentation load for Option B."
  );
  const optionBTimelineFit = readEnum(
    body,
    "optionBTimelineFit",
    comparisonTimelineFitValues,
    "Select the timeline fit for Option B."
  );
  const priority = readEnum(body, "priority", comparisonPriorities, "Select a decision priority.");
  const decisionDeadline = readEnum(body, "decisionDeadline", decisionDeadlines, "Select a decision deadline.");
  const profileNotes = readString(body, "profileNotes", "Add profile notes.");

  if (!optionA.success) return optionA;
  if (!optionADocumentLoad.success) return optionADocumentLoad;
  if (!optionATimelineFit.success) return optionATimelineFit;
  if (!optionB.success) return optionB;
  if (!optionBDocumentLoad.success) return optionBDocumentLoad;
  if (!optionBTimelineFit.success) return optionBTimelineFit;
  if (!priority.success) return priority;
  if (!decisionDeadline.success) return decisionDeadline;
  if (!profileNotes.success) return profileNotes;

  return {
    success: true,
    data: {
      optionA: optionA.data,
      optionADocumentLoad: optionADocumentLoad.data,
      optionATimelineFit: optionATimelineFit.data,
      optionB: optionB.data,
      optionBDocumentLoad: optionBDocumentLoad.data,
      optionBTimelineFit: optionBTimelineFit.data,
      priority: priority.data,
      decisionDeadline: decisionDeadline.data,
      profileNotes: profileNotes.data
    }
  };
}

export function parseCopilotInput(value: unknown): ParseResult<CopilotInput> {
  const body = readObject(value);

  if (!body) {
    return { success: false, message: "Invalid copilot payload." };
  }

  const stage = readEnum(body, "stage", copilotStages, "Select the current stage.");
  const objective = readEnum(body, "objective", copilotObjectives, "Select the objective for this question.");
  const question = readString(body, "question", "Ask a focused question.");
  const context = readString(body, "context", "Add relevant context.");
  const constraints = readString(body, "constraints", "Add the main constraints or open issues.");
  const threadId = readOptionalString(body, "threadId");

  if (!stage.success) return stage;
  if (!objective.success) return objective;
  if (!question.success) return question;
  if (!context.success) return context;
  if (!constraints.success) return constraints;

  if (question.data.length < 20) {
    return { success: false, message: "Ask a more specific question so Copilot can narrow the next move." };
  }

  return {
    success: true,
    data: {
      threadId: threadId.data,
      stage: stage.data,
      objective: objective.data,
      question: question.data,
      context: context.data,
      constraints: constraints.data
    }
  };
}

export function buildAssessmentResult(values: AssessmentInput): StructuredDecisionResult {
  const urgentTimeline = values.timeline === "0-6";
  const englishReady = values.englishTestStatus === "completed";
  const englishGap = values.englishTestStatus === "not-started";
  const hasCanadianExperience =
    values.canadianExperience === "1-3-years" || values.canadianExperience === "3-plus-years";
  const hasForeignExperience = values.foreignExperience !== "none";
  const strongForeignExperience = values.foreignExperience === "3-plus-years";
  const hasJobOffer = values.jobOfferSupport === "confirmed";
  const provinceLockedIn = !notesContain(values.provincePreference.toLowerCase(), ["open", "any", "flexible"]);
  const notes = values.notes.toLowerCase();

  let summary = `Start with a ${urgentTimeline ? "time-sensitive" : "structured"} review focused on ${formatAssessmentGoal(
    values.goal
  )}.`;

  if (values.refusalHistoryFlag) {
    summary =
      "There is still a workable planning path here, but prior refusal history means the next move should tighten the factual record before expanding the strategy.";
  } else if (values.goal === "permanent-residence" && englishReady && (hasCanadianExperience || strongForeignExperience)) {
    summary =
      "The profile has enough traction to move beyond broad research and into pathway selection with a tighter evidence plan.";
  } else if (values.goal === "permanent-residence" && englishGap) {
    summary =
      "Permanent residence planning may still be viable, but English testing is likely to control the pace more than pathway research.";
  } else if (values.goal === "work-permit" && hasJobOffer) {
    summary =
      "A work permit strategy looks actionable now, so the next step should center on job-offer support, timing, and document readiness rather than broad exploration.";
  } else if (values.goal === "study-permit" && urgentTimeline) {
    summary =
      "A study permit plan may still be workable, but the short timeline means school selection, funding, and evidence preparation need to move together.";
  } else if (values.goal === "family-sponsorship" && values.maritalStatus === "married-or-common-law") {
    summary =
      "Family sponsorship planning should start with relationship evidence and sponsor readiness before broadening into a larger checklist.";
  }

  const whyThisMatters = dedupeAndLimit(
    [
      `${formatAssessmentStatus(values.currentStatus)} changes sequencing, especially around timing, evidence, and what can be done now.`,
      `${formatTimeline(values.timeline)} means the first plan should optimize for ${urgentTimeline ? "speed and proof readiness" : "clarity before commitment"}.`,
      `${formatEnglishTestStatus(values.englishTestStatus)} will influence how quickly you can move from planning into a filing-ready track.`,
      hasCanadianExperience
        ? "Canadian work or study experience can make some paths more practical, so it should shape the recommendation early."
        : "Without Canadian experience yet, the recommendation should avoid assuming local eligibility advantages.",
      provinceLockedIn
        ? `A province preference for ${values.provincePreference.trim()} narrows the practical path and should stay visible in the strategy.`
        : "Province flexibility keeps more options open, which is useful while key facts are still being confirmed."
    ],
    4
  );

  const risksAndConstraints = dedupeAndLimit(
    [
      urgentTimeline && englishGap
        ? "The current timeline is aggressive relative to English test readiness, which makes delay risk the first constraint to manage."
        : null,
      values.refusalHistoryFlag
        ? "Previous refusals or filing issues can change how evidence should be positioned, so the next move should start with record quality."
        : null,
      values.goal === "work-permit" && !hasJobOffer
        ? "A work permit strategy is harder to operationalize without confirmed employer support, so job-offer assumptions should be tested early."
        : null,
      values.goal === "study-permit" && notesContain(notes, ["cost", "fund", "tuition", "budget"])
        ? "Funding pressure could narrow school choice and timing, so financial proof should be reviewed before the plan expands."
        : null,
      values.goal === "permanent-residence" && !hasCanadianExperience && !hasForeignExperience
        ? "Without clear work experience yet, pathway selection may look broader than it really is."
        : null
    ],
    4
  );

  const missingInformation = dedupeAndLimit(
    [
      values.goal === "permanent-residence"
        ? "Exact occupation history, years of work experience, and any completed English test results are still needed before narrowing to a lead route."
        : null,
      values.goal === "study-permit"
        ? "School target, funding source, and recent travel history would materially change the strength of a study-based plan."
        : null,
      values.goal === "work-permit"
        ? "Employer details, job-offer terms, and current authorization facts would change the best next step."
        : null,
      values.goal === "family-sponsorship"
        ? "Sponsor status, relationship proof, and household planning details still need to be confirmed."
        : null,
      provinceLockedIn ? null : "A clearer province preference would help narrow the path without overcommitting too early.",
      "The documents already on hand are still unclear, so the recommendation should not assume proof readiness."
    ],
    4
  );

  const nextSteps = dedupeAndLimit(
    [
      urgentTimeline ? "Choose the lead pathway this week and set the first evidence deadline." : "Reduce the plan to one lead route before expanding the checklist.",
      values.refusalHistoryFlag
        ? "Collect the prior refusal or issue record first so the strategy is built on the full file history."
        : "Confirm which documents are already strong enough to support early progress.",
      englishGap
        ? "Decide whether English testing is the gating milestone or whether another route should lead first."
        : "Turn the missing information into a short evidence checklist with owners and dates.",
      "Use Compare if more than one route still looks credible after the first evidence review."
    ],
    4
  );

  return {
    summary,
    whyThisMatters,
    risksAndConstraints,
    missingInformation,
    nextSteps
  };
}

export function buildComparisonResult(values: ComparisonInput): StructuredDecisionResult {
  const left = values.optionA.trim();
  const right = values.optionB.trim();

  if (left.toLowerCase() === right.toLowerCase()) {
    throw new Error("Enter two different options so the comparison has a real tradeoff to evaluate.");
  }

  const optionA = scoreComparisonOption(
    left,
    values.optionADocumentLoad,
    values.optionATimelineFit,
    values.priority,
    values.decisionDeadline
  );
  const optionB = scoreComparisonOption(
    right,
    values.optionBDocumentLoad,
    values.optionBTimelineFit,
    values.priority,
    values.decisionDeadline
  );

  const winner = optionA.total >= optionB.total ? optionA : optionB;
  const fallback = winner.name === optionA.name ? optionB : optionA;
  const narrowMargin = Math.abs(optionA.total - optionB.total) <= 1;

  const summary = narrowMargin
    ? `${winner.name} holds a narrow edge because it fits the current ${formatComparisonPriority(
        values.priority
      )} priority slightly better, but the decision should stay reversible until the remaining facts are confirmed.`
    : `${winner.name} is the stronger lead option because it fits the current ${formatComparisonPriority(
        values.priority
      )} priority with a better balance of timing and documentation effort.`;

  const whyThisMatters = dedupeAndLimit(
    [
      `${winner.name} currently offers the better combination of ${formatTimelineFit(
        winner.timelineFit
      )} and ${formatDocumentLoad(winner.documentLoad)}.`,
      `${formatDecisionDeadline(values.decisionDeadline)} means the lead option should reduce rework rather than just look attractive on paper.`,
      `${fallback.name} still matters as a fallback track if assumptions around timing or evidence change.`
    ],
    3
  );

  const risksAndConstraints = dedupeAndLimit(
    [
      winner.documentLoad === "high"
        ? `${winner.name} carries a heavy documentation lift, so execution risk stays high even if it remains the lead option.`
        : null,
      winner.timelineFit === "weak"
        ? `${winner.name} does not currently fit the user's timing well, which weakens the recommendation despite other advantages.`
        : null,
      values.decisionDeadline === "within-30" && (winner.timelineFit !== "strong" || winner.documentLoad === "high")
        ? "The decision window is short relative to the current evidence burden, so timing discipline matters more than optional analysis."
        : null,
      notesContain(values.profileNotes.toLowerCase(), ["employer", "family", "location", "budget"])
        ? "External dependencies in the profile notes could still change which option is truly practical."
        : null
    ],
    3
  );

  const missingInformation = dedupeAndLimit(
    [
      `Confirm which documents are already available for ${winner.name} and ${fallback.name}.`,
      "Check whether either option depends on a fact that is still uncertain, such as timing, sponsor support, or employer participation.",
      narrowMargin ? "The margin is close enough that one missing fact could still flip the lead recommendation." : null
    ],
    3
  );

  const nextSteps = dedupeAndLimit(
    [
      `Treat ${winner.name} as the lead track and define the first evidence milestone for it.`,
      `Keep ${fallback.name} as a fallback and set a clear condition for when it should be revisited.`,
      values.decisionDeadline === "within-30"
        ? "Review document readiness within the next few days so the decision window is not lost."
        : "Convert the lead choice into a dated checklist before doing more comparative research."
    ],
    3
  );

  return {
    summary,
    whyThisMatters,
    risksAndConstraints,
    missingInformation,
    nextSteps
  };
}

export function buildCopilotResponse(values: CopilotInput): CopilotStructuredResponse {
  const combinedContext = `${values.question} ${values.context} ${values.constraints}`.toLowerCase();
  const keyConsiderations = dedupeAndLimit(
    [
      getStageConsideration(values.stage),
      getObjectiveConsideration(values.objective),
      notesContain(combinedContext, ["language", "ielts", "celpip", "test"])
        ? "Language evidence may be a gating factor, so the response should avoid assuming scores or timelines that are not confirmed."
        : null,
      notesContain(combinedContext, ["employer", "job", "offer", "lmia"])
        ? "Employer support changes strategy quickly, so anything tied to work authorization should be framed around confirmed support rather than hopeful assumptions."
        : null,
      notesContain(combinedContext, ["family", "spouse", "partner", "child"])
        ? "Family facts can widen or narrow the path, so relationship details should be treated as decision-shaping rather than background information."
        : null,
      notesContain(combinedContext, ["expire", "deadline", "urgent", "soon"])
        ? "Timing pressure should influence the order of work, especially if one missing document could block the entire next step."
        : null,
      notesContain(combinedContext, ["document", "proof", "evidence"])
        ? "Evidence quality matters more than volume, so the next step should focus on the proof that changes the outcome fastest."
        : null
    ],
    4
  );

  const missingInformation = dedupeAndLimit(
    [
      !notesContain(combinedContext, ["status", "visitor", "student", "worker", "outside"])
        ? "Current status or location is still missing, and that affects what can be done now versus later."
        : null,
      !notesContain(combinedContext, ["month", "timeline", "deadline", "expire", "urgent", "soon"])
        ? "The working timeline is still unclear, so it is hard to decide whether speed or certainty should lead."
        : null,
      !notesContain(combinedContext, ["document", "proof", "evidence", "test", "score"])
        ? "Document readiness is still vague, so the answer should not assume key evidence is already available."
        : null,
      !notesContain(combinedContext, ["family", "employer", "support"])
        ? "Potential support from family or an employer has not been clarified yet."
        : null
    ],
    3
  );

  const nextSteps = dedupeAndLimit(
    [
      getObjectiveNextStep(values.objective),
      values.stage === "documents"
        ? "Turn the missing information into a checklist ordered by what would block progress first."
        : "Confirm the one missing fact most likely to change the recommendation before broadening the plan.",
      values.stage === "comparing"
        ? "If more than one route still looks plausible, move the question into Compare so the tradeoffs stay explicit."
        : "If the question expands beyond one issue, route the work into Assessment or Compare instead of letting the thread stay vague."
    ],
    3
  );

  return {
    summary: buildCopilotSummary(values),
    keyConsiderations,
    missingInformation,
    nextSteps
  };
}

export function buildCopilotThreadTitle(question: string) {
  const cleaned = question.replace(/\s+/g, " ").trim();
  const sentence = cleaned.slice(0, 72);
  const trimmed = sentence.endsWith("?") ? sentence.slice(0, -1) : sentence;

  if (!trimmed) {
    return "Untitled thread";
  }

  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

export function buildCopilotThreadSummary(response: CopilotStructuredResponse) {
  return response.summary;
}

export function buildCopilotAssistantMessageText(response: CopilotStructuredResponse) {
  return [
    "Summary",
    response.summary,
    "",
    "Key considerations",
    ...response.keyConsiderations.map((item) => `- ${item}`),
    "",
    "Missing information",
    ...response.missingInformation.map((item) => `- ${item}`),
    "",
    "Next steps",
    ...response.nextSteps.map((item) => `- ${item}`)
  ].join("\n");
}

export function parseCopilotStructuredResponsePayload(value: unknown): CopilotStructuredResponse | null {
  if (!isRecord(value)) {
    return null;
  }

  const summary = typeof value.summary === "string" && value.summary.trim() ? value.summary.trim() : null;
  const keyConsiderations = readStructuredStringArray(value.keyConsiderations);
  const missingInformation = readStructuredStringArray(value.missingInformation);
  const nextSteps = readStructuredStringArray(value.nextSteps);

  if (!summary || !keyConsiderations || !missingInformation || !nextSteps) {
    return null;
  }

  return {
    summary,
    keyConsiderations,
    missingInformation,
    nextSteps
  };
}

export function getCopilotStructuredResponse(metadata: Json): CopilotStructuredResponse | null {
  if (!isRecord(metadata) || metadata.type !== "copilot-structured-response") {
    return null;
  }

  return parseCopilotStructuredResponsePayload(metadata.response);
}

export function getCopilotUserMessageMetadata(metadata: Json): CopilotUserMessageMetadata | null {
  if (!isRecord(metadata) || metadata.type !== "copilot-user-message") {
    return null;
  }

  if (
    typeof metadata.stage !== "string" ||
    typeof metadata.objective !== "string" ||
    typeof metadata.context !== "string" ||
    typeof metadata.constraints !== "string"
  ) {
    return null;
  }

  return {
    type: "copilot-user-message",
    stage: metadata.stage,
    objective: metadata.objective,
    context: metadata.context,
    constraints: metadata.constraints
  };
}

function buildCopilotSummary(values: CopilotInput) {
  const stageLabel = formatCopilotStage(values.stage);
  const objectiveLabel = formatCopilotObjective(values.objective);

  return `At the ${stageLabel} stage, the strongest response is to ${objectiveLabel} with a narrow recommendation, the key facts that still change the answer, and the next concrete action.`;
}

function getStageConsideration(stage: string) {
  const labels: Record<string, string> = {
    research: "Early research should reduce ambiguity quickly rather than expand into every possible path.",
    comparing: "When options are already on the table, the response should keep a lead path and a fallback path visible.",
    documents: "At the document stage, sequencing matters as much as strategy because one missing proof can block progress.",
    ready: "When the file is close to ready, the main job is reducing preventable mistakes and unresolved gaps."
  };

  return labels[stage] ?? "The response should stay focused on the immediate decision.";
}

function getObjectiveConsideration(objective: string) {
  const labels: Record<string, string> = {
    "choose-next-step": "The answer should reduce the problem to one next move rather than a list of possibilities.",
    "document-plan": "The answer should prioritize which evidence matters first, not just name every possible document.",
    "risk-review": "The answer should identify the constraint most likely to slow or weaken the file.",
    "timeline-planning": "The answer should separate what must happen now from what can wait."
  };

  return labels[objective] ?? "The answer should stay grounded in the user's actual question.";
}

function getObjectiveNextStep(objective: string) {
  const labels: Record<string, string> = {
    "choose-next-step": "Choose the next decision point and name the fact that must be confirmed before moving past it.",
    "document-plan": "Create a short evidence list ordered by what is hardest to replace or easiest to delay the file.",
    "risk-review": "Check the highest-impact constraint first and decide whether it changes the current strategy.",
    "timeline-planning": "Translate the plan into near-term milestones so timing risk is visible early."
  };

  return labels[objective] ?? "Turn the answer into a concrete follow-up action.";
}

function scoreComparisonOption(
  name: string,
  documentLoad: string,
  timelineFit: string,
  priority: string,
  decisionDeadline: string
) {
  const loadScore = { low: 3, medium: 2, high: 1 }[documentLoad] ?? 0;
  const timelineScore = { strong: 3, moderate: 2, weak: 1 }[timelineFit] ?? 0;

  let total = 0;

  if (priority === "speed") {
    total = timelineScore * 2 + loadScore;
  } else if (priority === "documentation") {
    total = loadScore * 2 + timelineScore;
  } else {
    total = timelineScore * 2 + loadScore * 2;
  }

  if (decisionDeadline === "within-30") {
    total += timelineScore;
  } else if (decisionDeadline === "flexible") {
    total += loadScore;
  }

  return {
    name,
    documentLoad,
    timelineFit,
    total
  };
}

function formatAssessmentGoal(goal: string) {
  const labels: Record<string, string> = {
    "permanent-residence": "permanent residence planning",
    "study-permit": "a study permit strategy",
    "work-permit": "a work permit strategy",
    "family-sponsorship": "family-based sponsorship planning"
  };

  return labels[goal] ?? "the selected goal";
}

function formatAssessmentStatus(status: string) {
  const labels: Record<string, string> = {
    "outside-canada": "Being outside Canada",
    visitor: "Visitor status",
    student: "Student status",
    worker: "Worker status"
  };

  return labels[status] ?? "Current status";
}

function formatTimeline(timeline: string) {
  const labels: Record<string, string> = {
    "0-6": "A 0 to 6 month timeline",
    "6-12": "A 6 to 12 month timeline",
    "12-plus": "A longer planning window"
  };

  return labels[timeline] ?? "The current timeline";
}

function formatEnglishTestStatus(value: string) {
  const labels: Record<string, string> = {
    completed: "Completed English testing",
    booked: "Planned but incomplete English testing",
    "not-started": "No English testing yet"
  };

  return labels[value] ?? "English testing status";
}

function formatComparisonPriority(priority: string) {
  const labels: Record<string, string> = {
    speed: "speed",
    documentation: "documentation efficiency",
    certainty: "overall certainty"
  };

  return labels[priority] ?? "the current priority";
}

function formatDecisionDeadline(deadline: string) {
  const labels: Record<string, string> = {
    "within-30": "A decision needed in the next 30 days",
    "within-90": "A decision needed in the next 90 days",
    flexible: "A flexible decision window"
  };

  return labels[deadline] ?? "The current decision window";
}

function formatDocumentLoad(load: string) {
  const labels: Record<string, string> = {
    low: "lower documentation lift",
    medium: "moderate documentation lift",
    high: "heavy documentation lift"
  };

  return labels[load] ?? "current documentation lift";
}

function formatTimelineFit(fit: string) {
  const labels: Record<string, string> = {
    strong: "strong timing alignment",
    moderate: "moderate timing alignment",
    weak: "weaker timing alignment"
  };

  return labels[fit] ?? "current timing alignment";
}

function formatCopilotStage(stage: string) {
  const labels: Record<string, string> = {
    research: "early research",
    comparing: "comparison",
    documents: "document preparation",
    ready: "final review"
  };

  return labels[stage] ?? "current";
}

function formatCopilotObjective(objective: string) {
  const labels: Record<string, string> = {
    "choose-next-step": "identify the right next step",
    "document-plan": "prioritize the document plan",
    "risk-review": "surface the main risk early",
    "timeline-planning": "sequence the timeline realistically"
  };

  return labels[objective] ?? "narrow the next move";
}

function readObject(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function readString(body: Record<string, unknown>, key: string, message: string): ParseResult<string> {
  const value = body[key];

  if (typeof value !== "string" || !value.trim()) {
    return { success: false, message };
  }

  return {
    success: true,
    data: value.trim()
  };
}

function readOptionalString(body: Record<string, unknown>, key: string) {
  const value = body[key];

  if (typeof value !== "string" || !value.trim()) {
    return {
      success: true as const,
      data: undefined
    };
  }

  return {
    success: true as const,
    data: value.trim()
  };
}

function readEnum(
  body: Record<string, unknown>,
  key: string,
  allowedValues: Set<string>,
  message: string
): ParseResult<string> {
  const value = body[key];

  if (typeof value !== "string" || !allowedValues.has(value)) {
    return { success: false, message };
  }

  return {
    success: true,
    data: value
  };
}

function readBooleanFlag(
  body: Record<string, unknown>,
  key: string,
  allowedValues: Set<string>,
  message: string
): ParseResult<boolean> {
  const value = body[key];

  if (typeof value !== "string" || !allowedValues.has(value)) {
    return { success: false, message };
  }

  return {
    success: true,
    data: value === "yes"
  };
}

function notesContain(input: string, fragments: string[]) {
  return fragments.some((fragment) => input.includes(fragment));
}

function dedupeAndLimit(items: Array<string | null>, limit: number) {
  const result: string[] = [];

  for (const item of items) {
    if (!item || result.includes(item)) {
      continue;
    }

    result.push(item);

    if (result.length === limit) {
      break;
    }
  }

  return result;
}

function isRecord(value: unknown): value is Record<string, Json> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function readStructuredStringArray(value: Json | undefined) {
  if (!Array.isArray(value)) {
    return null;
  }

  const next = value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);

  if (next.length === 0 || next.length !== value.length) {
    return null;
  }

  return next;
}
