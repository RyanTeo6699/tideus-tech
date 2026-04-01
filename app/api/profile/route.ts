import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import { buildProfileUpdate, parseProfileFormInput } from "@/lib/profile";
import { ensureProfile } from "@/lib/profile-server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = parseProfileFormInput(body);

  if (!parsed.success) {
    return NextResponse.json({ message: parsed.message }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ message: "Sign in to update your profile." }, { status: 401 });
  }

  await ensureProfile(supabase, user);

  const { data: existingProfile, error: existingProfileError } = await supabase
    .from("profiles")
    .select("metadata")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingProfileError) {
    return NextResponse.json({ message: existingProfileError.message }, { status: 500 });
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      ...buildProfileUpdate(parsed.data),
      metadata: {
        ...(existingProfile?.metadata && typeof existingProfile.metadata === "object" && !Array.isArray(existingProfile.metadata)
          ? existingProfile.metadata
          : {}),
        profile_updated_at: new Date().toISOString()
      }
    })
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/profile");
  revalidatePath("/assessment");
  revalidatePath("/compare");
  revalidatePath("/copilot");

  return NextResponse.json({
    message: "Profile saved. New case intake and review steps will use the updated context."
  });
}
