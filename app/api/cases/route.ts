import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import type { TablesInsert } from "@/lib/database.types";
import { parseCaseCreateInput } from "@/lib/case-review";
import { appendCaseStatusHistory, buildCaseTitle, buildInitialCaseDocuments } from "@/lib/cases";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = parseCaseCreateInput(body);

  if (!parsed.success) {
    return NextResponse.json({ message: parsed.message }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ message: "Sign in to create a case." }, { status: 401 });
  }

  const now = new Date().toISOString();
  const caseInsert: TablesInsert<"cases"> = {
    user_id: user.id,
    use_case_slug: parsed.data.useCase,
    title: buildCaseTitle(parsed.data.useCase, parsed.data.intake),
    status: "intake-complete",
    intake_answers: parsed.data.intake,
    intake_completed_at: now,
    checklist_state: [],
    status_history: appendCaseStatusHistory([], "intake-complete"),
    metadata: {
      export_records: [],
      tracking_hooks: {
        review_generated: false,
        materials_completed: false
      }
    }
  };

  const { data: createdCase, error: caseError } = await supabase
    .from("cases")
    .insert(caseInsert)
    .select("id, title")
    .single();

  if (caseError || !createdCase) {
    return NextResponse.json({ message: caseError?.message || "Unable to create the case." }, { status: 500 });
  }

  const documents = buildInitialCaseDocuments(parsed.data.useCase, parsed.data.intake).map((item) => ({
    ...item,
    case_id: createdCase.id
  }));

  const { error: documentsError } = await supabase.from("case_documents").insert(documents);

  if (documentsError) {
    return NextResponse.json({ message: documentsError.message }, { status: 500 });
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/cases");
  revalidatePath("/start-case");

  return NextResponse.json({
    message: "Case created.",
    caseId: createdCase.id,
    nextHref: `/upload-materials/${createdCase.id}`
  });
}
