import { NextResponse } from "next/server";

import { recordAppEvent } from "@/lib/app-events";
import { getLeadRequestFlags, parseLeadRequestInput } from "@/lib/lead-requests";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = parseLeadRequestInput(body);

  if (!parsed.success) {
    return NextResponse.json({ message: parsed.message }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  const requestFlags = getLeadRequestFlags(parsed.data.requestType);

  const { data: leadRequest, error: insertError } = await supabase
    .from("lead_requests")
    .insert({
      user_id: user?.id ?? null,
      email: parsed.data.email,
      use_case_interest: parsed.data.useCaseInterest,
      current_stage: parsed.data.currentStage,
      wants_demo: requestFlags.wantsDemo,
      wants_early_access: requestFlags.wantsEarlyAccess,
      note: parsed.data.note || null,
      metadata: {
        source: "book-demo-form",
        sourceSurface: "book-demo-page",
        useCase: parsed.data.useCaseInterest,
        requestType: parsed.data.requestType,
        noteProvided: Boolean(parsed.data.note),
        userSignedIn: Boolean(user)
      }
    })
    .select("id")
    .single();

  if (insertError || !leadRequest) {
    return NextResponse.json({ message: insertError?.message || "Unable to save the request." }, { status: 500 });
  }

  if (requestFlags.wantsEarlyAccess) {
    const eventError = await recordAppEvent(supabase, {
      eventType: "early_access_requested",
      userId: user?.id ?? null,
      leadRequestId: leadRequest.id,
      path: "/book-demo",
      metadata: {
        emailDomain: parsed.data.email.split("@")[1] ?? "",
        useCase: parsed.data.useCaseInterest,
        useCaseInterest: parsed.data.useCaseInterest,
        currentStage: parsed.data.currentStage,
        requestType: parsed.data.requestType,
        noteProvided: Boolean(parsed.data.note),
        userSignedIn: Boolean(user),
        wantsDemo: requestFlags.wantsDemo,
        wantsEarlyAccess: requestFlags.wantsEarlyAccess,
        sourceSurface: "book-demo-page"
      }
    });

    if (eventError) {
      console.error("Unable to record lead request event", eventError);
    }
  }

  return NextResponse.json({
    message: "Request received. Tideus will use this to prioritize launch conversations for the supported workflows."
  });
}
