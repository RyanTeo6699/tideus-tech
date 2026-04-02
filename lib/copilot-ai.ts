import OpenAI from "openai";

import type { Tables } from "@/lib/database.types";
import {
  buildCopilotResponse,
  parseCopilotStructuredResponsePayload,
  type CopilotInput,
  type CopilotResponseSource,
  type CopilotStructuredResponse
} from "@/lib/legacy/tool-results";

type CopilotProfileContext = Pick<
  Tables<"profiles">,
  | "current_status"
  | "target_goal"
  | "target_timeline"
  | "citizenship"
  | "age_band"
  | "marital_status"
  | "education_level"
  | "english_test_status"
  | "canadian_experience"
  | "foreign_experience"
  | "job_offer_support"
  | "province_preference"
  | "refusal_history_flag"
>;

export type CopilotGenerationResult = {
  response: CopilotStructuredResponse;
  source: CopilotResponseSource;
  model?: string;
  fallbackReason?: string;
};

const DEFAULT_OPENAI_MODEL = "gpt-5-mini";
const OPENAI_TIMEOUT_MS = 12_000;

const copilotResponseFormat = {
  type: "json_schema",
  name: "copilot_structured_response",
  strict: true,
  schema: {
    type: "object",
    properties: {
      summary: {
        type: "string",
        minLength: 1
      },
      keyConsiderations: {
        type: "array",
        minItems: 2,
        maxItems: 4,
        items: {
          type: "string",
          minLength: 1
        }
      },
      missingInformation: {
        type: "array",
        minItems: 1,
        maxItems: 4,
        items: {
          type: "string",
          minLength: 1
        }
      },
      nextSteps: {
        type: "array",
        minItems: 2,
        maxItems: 4,
        items: {
          type: "string",
          minLength: 1
        }
      }
    },
    required: ["summary", "keyConsiderations", "missingInformation", "nextSteps"],
    additionalProperties: false
  }
} as const;

let cachedClient: OpenAI | null | undefined;

export async function generateCopilotStructuredResponse(
  input: CopilotInput,
  profile: CopilotProfileContext | null
): Promise<CopilotGenerationResult> {
  const fallbackResponse = buildCopilotResponse(input);
  const fallback = (reason: string): CopilotGenerationResult => ({
    response: fallbackResponse,
    source: "rules",
    fallbackReason: reason
  });

  const client = getOpenAIClient();

  if (!client) {
    return fallback("OpenAI API key not configured.");
  }

  const model = process.env.OPENAI_MODEL?.trim() || DEFAULT_OPENAI_MODEL;

  try {
    const response = (await Promise.race([
      client.responses.create({
        model,
        store: false,
        input: buildCopilotPrompt(input, profile),
        text: {
          format: copilotResponseFormat
        }
      }),
      rejectAfter(OPENAI_TIMEOUT_MS, "OpenAI Copilot request timed out.")
    ])) as {
      output_text?: string | null;
    };

    const parsed = safeParseCopilotOutput(response.output_text);

    if (!parsed) {
      return fallback("OpenAI Copilot response did not match the required structure.");
    }

    return {
      response: parsed,
      source: "openai",
      model
    };
  } catch (error) {
    return fallback(error instanceof Error ? error.message : "OpenAI Copilot request failed.");
  }
}

function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY?.trim()) {
    return null;
  }

  if (cachedClient === undefined) {
    cachedClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  return cachedClient;
}

function buildCopilotPrompt(input: CopilotInput, profile: CopilotProfileContext | null) {
  return [
    "You are Tideus Copilot, a structured Canada immigration planning assistant.",
    "Return decision-support content only. Do not produce a freeform chat reply.",
    "Use only the facts provided. If something is uncertain, place it in missingInformation instead of guessing.",
    "Keep the tone direct, product-like, and practical.",
    "Each next step must be concrete and execution-oriented.",
    "",
    `Stage: ${input.stage}`,
    `Objective: ${input.objective}`,
    `Question: ${input.question}`,
    `Context: ${input.context}`,
    `Constraints: ${input.constraints}`,
    "",
    "Saved profile context:",
    profile ? buildProfileContext(profile) : "No saved profile context available.",
    "",
    "Output rules:",
    "- summary: one concise paragraph or sentence",
    "- keyConsiderations: 2 to 4 bullets",
    "- missingInformation: 1 to 4 bullets",
    "- nextSteps: 2 to 4 ordered actions"
  ].join("\n");
}

function buildProfileContext(profile: CopilotProfileContext) {
  const rows = [
    ["Current status", profile.current_status],
    ["Target goal", profile.target_goal],
    ["Timeline", profile.target_timeline],
    ["Citizenship", profile.citizenship],
    ["Age band", profile.age_band],
    ["Marital status", profile.marital_status],
    ["Education", profile.education_level],
    ["English test status", profile.english_test_status],
    ["Canadian experience", profile.canadian_experience],
    ["Foreign experience", profile.foreign_experience],
    ["Job offer support", profile.job_offer_support],
    ["Province preference", profile.province_preference],
    ["Refusal history", profile.refusal_history_flag ? "Yes" : "No"]
  ];

  return rows
    .filter(([, value]) => value !== null && value !== undefined && value !== "")
    .map(([label, value]) => `- ${label}: ${String(value)}`)
    .join("\n");
}

function safeParseCopilotOutput(outputText: string | null | undefined) {
  if (!outputText?.trim()) {
    return null;
  }

  try {
    const parsed = JSON.parse(outputText);
    return parseCopilotStructuredResponsePayload(parsed);
  } catch {
    return null;
  }
}

function rejectAfter(ms: number, message: string) {
  return new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(message)), ms);
  });
}
