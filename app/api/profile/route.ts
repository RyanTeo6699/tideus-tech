import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import { getCurrentLocale } from "@/lib/i18n/server";
import { pickLocale } from "@/lib/i18n/workspace";
import { buildProfileUpdate, parseProfileFormInput } from "@/lib/profile";
import { ensureProfile } from "@/lib/profile-server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(request: Request) {
  const body = await request.json().catch(() => null);
  const locale = await getCurrentLocale();
  const parsed = parseProfileFormInput(body, locale);

  if (!parsed.success) {
    return NextResponse.json({ message: parsed.message }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { message: pickLocale(locale, "请先登录后再更新资料档案。", "請先登入後再更新資料檔案。") },
      { status: 401 }
    );
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
  revalidatePath("/dashboard/cases");
  revalidatePath("/start-case");
  revalidatePath("/case-intake");
  revalidatePath("/use-cases");

  return NextResponse.json({
    message: pickLocale(
      locale,
      "资料档案已保存。新的案件 intake 与审查步骤会使用这份更新后的上下文。",
      "資料檔案已儲存。新的案件 intake 與審查步驟會使用這份更新後的脈絡。"
    )
  });
}
