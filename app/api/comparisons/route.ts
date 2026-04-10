import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import type { TablesInsert } from "@/lib/database.types";
import { getCurrentLocale } from "@/lib/i18n/server";
import { pickLocale } from "@/lib/i18n/workspace";
import { buildCompareProfileNotes } from "@/lib/legacy/profile";
import { buildComparisonResult, parseComparisonInput } from "@/lib/legacy/tool-results";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const locale = await getCurrentLocale();
  const body = await request.json().catch(() => null);
  const parsed = parseComparisonInput(body);

  if (!parsed.success) {
    return NextResponse.json({ message: parsed.message }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  let savedProfileNotes = "";

  if (user) {
    const { data: profile, error: profileError } = await supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle();

    if (profileError) {
      return NextResponse.json({ message: profileError.message }, { status: 500 });
    }

    savedProfileNotes = buildCompareProfileNotes(profile ?? null);
  }

  const comparisonInput = {
    ...parsed.data,
    profileNotes: mergeProfileNotes(savedProfileNotes, parsed.data.profileNotes, locale)
  };
  let result;

  try {
    result = buildComparisonResult(comparisonInput);
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : pickLocale(locale, "暂时无法生成这条归档比较记录。", "暫時無法產生這條歸檔比較紀錄。")
      },
      { status: 400 }
    );
  }

  if (!user) {
    return NextResponse.json({
      result,
      saved: false,
      message: pickLocale(locale, "登录后即可将这条旧比较记录保存到工作台归档。", "登入後即可將這條舊比較紀錄儲存到工作台歸檔。")
    });
  }

  const insertPayload: TablesInsert<"comparisons"> = {
    user_id: user.id,
    option_a: comparisonInput.optionA,
    option_b: comparisonInput.optionB,
    priority: comparisonInput.priority,
    profile_notes: comparisonInput.profileNotes,
    input_snapshot: comparisonInput,
    result_summary: result.summary,
    result_focus_areas: result.whyThisMatters,
    result_why_matters: result.whyThisMatters,
    result_risks_and_constraints: result.risksAndConstraints,
    result_missing_information: result.missingInformation,
    result_next_steps: result.nextSteps
  };

  const { data, error } = await supabase
    .from("comparisons")
    .insert(insertPayload)
    .select("id, created_at")
    .single();

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/cases");
  revalidatePath("/dashboard/comparisons");
  revalidatePath("/start-case");

  return NextResponse.json({
    result,
    saved: true,
    savedRecord: data,
    message: pickLocale(locale, "旧比较记录已保存到工作台归档。", "舊比較紀錄已儲存到工作台歸檔。")
  });
}

function mergeProfileNotes(savedProfileNotes: string, userNotes: string, locale: "zh-CN" | "zh-TW") {
  const trimmedUserNotes = userNotes.trim();

  if (!savedProfileNotes) {
    return trimmedUserNotes;
  }

  return [savedProfileNotes, "", pickLocale(locale, "决策专用备注：", "決策專用備註："), trimmedUserNotes].join("\n");
}
