import type { User } from "@supabase/supabase-js";

import type { Tables } from "@/lib/database.types";
import { ensureProfile } from "@/lib/profile-server";
import { createClient } from "@/lib/supabase/server";

// Migration archive helper for the legacy Copilot thread surface.
export type CopilotWorkspaceData = {
  user: User | null;
  profile: Tables<"profiles"> | null;
  threads: Tables<"copilot_threads">[];
  activeThread: Tables<"copilot_threads"> | null;
  messages: Tables<"copilot_messages">[];
};

export async function getCopilotWorkspaceData(selectedThreadId?: string): Promise<CopilotWorkspaceData> {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      user: null,
      profile: null,
      threads: [],
      activeThread: null,
      messages: []
    };
  }

  await ensureProfile(supabase, user);

  const profileResult = await supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle();
  const profile = profileResult.data ?? null;

  const threadsResult = await supabase
    .from("copilot_threads")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(12);
  const recentThreads = threadsResult.data ?? [];

  const activeThreadResult = selectedThreadId
    ? await supabase
        .from("copilot_threads")
        .select("*")
        .eq("user_id", user.id)
        .eq("id", selectedThreadId)
        .maybeSingle()
    : null;
  const activeThread = activeThreadResult?.data ?? null;
  const threads =
    activeThread && !recentThreads.some((thread) => thread.id === activeThread.id)
      ? [activeThread, ...recentThreads].slice(0, 12)
      : recentThreads;

  if (!activeThread) {
    return {
      user,
      profile,
      threads,
      activeThread: null,
      messages: []
    };
  }

  const messagesResult = await supabase
    .from("copilot_messages")
    .select("*")
    // Messages are only loaded from a thread that was already scoped to the authenticated user.
    .eq("thread_id", activeThread.id)
    .order("created_at", { ascending: true });
  const messages = messagesResult.data ?? [];

  return {
    user,
    profile,
    threads,
    activeThread,
    messages
  };
}
