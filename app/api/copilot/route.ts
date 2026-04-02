import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import type { TablesInsert, TablesUpdate } from "@/lib/database.types";
import { generateCopilotStructuredResponse } from "@/lib/copilot-ai";
import {
  buildCopilotAssistantMessageText,
  buildCopilotThreadSummary,
  buildCopilotThreadTitle,
  parseCopilotInput,
  type CopilotStructuredMessageMetadata,
  type CopilotUserMessageMetadata
} from "@/lib/legacy/tool-results";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = parseCopilotInput(body);

  if (!parsed.success) {
    return NextResponse.json({ message: parsed.message }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ message: "Sign in to use Copilot." }, { status: 401 });
  }

  let threadId = parsed.data.threadId;
  let threadTitle = "";

  if (threadId) {
    const { data: existingThread, error: threadLookupError } = await supabase
      .from("copilot_threads")
      .select("id, title")
      .eq("user_id", user.id)
      .eq("id", threadId)
      .maybeSingle();

    if (threadLookupError) {
      return NextResponse.json({ message: threadLookupError.message }, { status: 500 });
    }

    if (!existingThread) {
      return NextResponse.json({ message: "The selected thread could not be found." }, { status: 404 });
    }

    threadTitle = existingThread.title;
  } else {
    threadTitle = buildCopilotThreadTitle(parsed.data.question);

    const newThread: TablesInsert<"copilot_threads"> = {
      user_id: user.id,
      title: threadTitle,
      summary: null,
      status: "open",
      last_message_at: new Date().toISOString()
    };

    const { data: createdThread, error: createThreadError } = await supabase
      .from("copilot_threads")
      .insert(newThread)
      .select("id, title")
      .single();

    if (createThreadError || !createdThread) {
      return NextResponse.json({ message: createThreadError?.message || "Unable to create a new thread." }, { status: 500 });
    }

    threadId = createdThread.id;
    threadTitle = createdThread.title;
  }

  if (!threadId) {
    return NextResponse.json({ message: "Unable to resolve the Copilot thread." }, { status: 500 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "current_status, target_goal, target_timeline, citizenship, age_band, marital_status, education_level, english_test_status, canadian_experience, foreign_experience, job_offer_support, province_preference, refusal_history_flag"
    )
    .eq("user_id", user.id)
    .maybeSingle();
  const generation = await generateCopilotStructuredResponse(parsed.data, profile ?? null);
  const now = Date.now();

  const userMessageMetadata: CopilotUserMessageMetadata = {
    type: "copilot-user-message",
    stage: parsed.data.stage,
    objective: parsed.data.objective,
    context: parsed.data.context,
    constraints: parsed.data.constraints
  };

  const assistantMessageMetadata: CopilotStructuredMessageMetadata = {
    type: "copilot-structured-response",
    source: generation.source,
    model: generation.model,
    fallbackReason: generation.fallbackReason,
    response: generation.response
  };

  const messages: Array<TablesInsert<"copilot_messages">> = [
    {
      thread_id: threadId,
      role: "user",
      content: parsed.data.question,
      metadata: userMessageMetadata,
      created_at: new Date(now).toISOString()
    },
    {
      thread_id: threadId,
      role: "assistant",
      content: buildCopilotAssistantMessageText(generation.response),
      metadata: assistantMessageMetadata,
      created_at: new Date(now + 1000).toISOString()
    }
  ];

  const { error: insertMessagesError } = await supabase.from("copilot_messages").insert(messages);

  if (insertMessagesError) {
    return NextResponse.json({ message: insertMessagesError.message }, { status: 500 });
  }

  const threadUpdate: TablesUpdate<"copilot_threads"> = {
    summary: buildCopilotThreadSummary(generation.response),
    status: "open",
    last_message_at: new Date(now + 1000).toISOString()
  };

  const { error: updateThreadError } = await supabase
    .from("copilot_threads")
    .update(threadUpdate)
    .eq("user_id", user.id)
    .eq("id", threadId);

  if (updateThreadError) {
    return NextResponse.json({ message: updateThreadError.message }, { status: 500 });
  }

  revalidatePath("/copilot");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/copilot");

  return NextResponse.json({
    message: "Copilot response saved.",
    threadId,
    threadTitle,
    response: generation.response
  });
}
