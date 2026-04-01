import type { SupabaseClient, User } from "@supabase/supabase-js";

import type { Database, Tables } from "@/lib/database.types";
import { createClient } from "@/lib/supabase/server";

export type ProfileContext = {
  user: User | null;
  profile: Tables<"profiles"> | null;
};

export async function getCurrentProfileContext(): Promise<ProfileContext> {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      user: null,
      profile: null
    };
  }

  await ensureProfile(supabase, user);

  const { data: profile } = await supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle();

  return {
    user,
    profile: profile ?? null
  };
}

export async function ensureProfile(supabase: SupabaseClient<Database>, user: User) {
  const fullName =
    typeof user.user_metadata?.full_name === "string" && user.user_metadata.full_name.trim()
      ? user.user_metadata.full_name.trim()
      : null;

  await supabase.from("profiles").upsert(
    {
      user_id: user.id,
      email: user.email ?? null,
      full_name: fullName
    },
    {
      onConflict: "user_id"
    }
  );
}
