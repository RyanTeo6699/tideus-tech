import { NextResponse } from "next/server";

import type { Json } from "@/lib/database.types";
import { isAppEventType, recordAppEvent } from "@/lib/app-events";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ message: "Invalid event payload." }, { status: 400 });
  }

  const eventType = typeof body.eventType === "string" ? body.eventType : "";
  const caseId = typeof body.caseId === "string" && body.caseId.trim() ? body.caseId.trim() : null;
  const path = typeof body.path === "string" && body.path.trim() ? body.path.trim() : null;
  const metadata = isJsonValue(body.metadata) ? body.metadata : {};

  if (!isAppEventType(eventType)) {
    return NextResponse.json({ message: "Unsupported event type." }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (caseId) {
    if (!user) {
      return NextResponse.json({ message: "Sign in required for case events." }, { status: 401 });
    }

    const { data: caseRecord, error: caseError } = await supabase
      .from("cases")
      .select("id")
      .eq("id", caseId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (caseError) {
      return NextResponse.json({ message: caseError.message }, { status: 500 });
    }

    if (!caseRecord) {
      return NextResponse.json({ message: "The selected case could not be found." }, { status: 404 });
    }
  }

  const error = await recordAppEvent(supabase, {
    eventType,
    userId: user?.id ?? null,
    caseId,
    path,
    metadata
  });

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

function isJsonValue(value: unknown): value is Json {
  return value === null || value === undefined || typeof value === "string" || typeof value === "number" || typeof value === "boolean" || Array.isArray(value) || (typeof value === "object" && value !== null);
}
