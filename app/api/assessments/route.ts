import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import type { Json, TablesInsert } from "@/lib/database.types";
import { buildAssessmentResult, parseAssessmentInput } from "@/lib/tool-results";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = parseAssessmentInput(body);

  if (!parsed.success) {
    return NextResponse.json({ message: parsed.message }, { status: 400 });
  }

  const result = buildAssessmentResult(parsed.data);
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({
      result,
      saved: false,
      message: "Sign in to save this assessment to your dashboard."
    });
  }

  const insertPayload: TablesInsert<"assessments"> = {
    user_id: user.id,
    current_status: parsed.data.currentStatus,
    goal: parsed.data.goal,
    timeline: parsed.data.timeline,
    notes: parsed.data.notes,
    input_snapshot: parsed.data,
    result_summary: result.summary,
    result_focus_areas: result.whyThisMatters,
    result_why_matters: result.whyThisMatters,
    result_risks_and_constraints: result.risksAndConstraints,
    result_missing_information: result.missingInformation,
    result_next_steps: result.nextSteps
  };

  const { data, error } = await supabase
    .from("assessments")
    .insert(insertPayload)
    .select("id, created_at")
    .single();

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  const { data: existingProfile, error: existingProfileError } = await supabase
    .from("profiles")
    .select("metadata")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingProfileError) {
    return NextResponse.json({ message: existingProfileError.message }, { status: 500 });
  }

  await supabase.from("profiles").upsert(
    {
      user_id: user.id,
      email: user.email ?? null,
      full_name:
        typeof user.user_metadata?.full_name === "string" && user.user_metadata.full_name.trim()
          ? user.user_metadata.full_name.trim()
          : null,
      current_status: parsed.data.currentStatus,
      target_goal: parsed.data.goal,
      target_timeline: parsed.data.timeline,
      citizenship: parsed.data.citizenship,
      age_band: parsed.data.ageBand,
      marital_status: parsed.data.maritalStatus,
      education_level: parsed.data.educationLevel,
      english_test_status: parsed.data.englishTestStatus,
      canadian_experience: parsed.data.canadianExperience,
      foreign_experience: parsed.data.foreignExperience,
      job_offer_support: parsed.data.jobOfferSupport,
      province_preference: parsed.data.provincePreference,
      refusal_history_flag: parsed.data.refusalHistoryFlag,
      metadata: {
        ...readMetadataRecord(existingProfile?.metadata),
        assessment_notes_updated_at: new Date().toISOString()
      }
    },
    {
      onConflict: "user_id"
    }
  );

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/profile");
  revalidatePath("/dashboard/assessments");
  revalidatePath("/assessment");
  revalidatePath("/compare");
  revalidatePath("/copilot");

  return NextResponse.json({
    result,
    saved: true,
    savedRecord: data,
    message: "Assessment saved to your dashboard."
  });
}

function readMetadataRecord(metadata: Json | null | undefined) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return {};
  }

  return metadata;
}
