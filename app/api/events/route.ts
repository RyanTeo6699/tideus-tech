import { NextResponse } from "next/server";

import type { Json } from "@/lib/database.types";
import { isAppEventType, recordAppEvent } from "@/lib/app-events";
import { getCurrentLocale } from "@/lib/i18n/server";
import { pickLocale } from "@/lib/i18n/workspace";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const locale = await getCurrentLocale();

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json(
      { message: pickLocale(locale, "事件内容无效。", "事件內容無效。") },
      { status: 400 }
    );
  }

  const eventType = typeof body.eventType === "string" ? body.eventType : "";
  const caseId = typeof body.caseId === "string" && body.caseId.trim() ? body.caseId.trim() : null;
  const path = typeof body.path === "string" && body.path.trim() ? body.path.trim() : null;
  const clientMetadata = readJsonRecord(isJsonValue(body.metadata) ? body.metadata : {});

  if (!isAppEventType(eventType)) {
    return NextResponse.json(
      { message: pickLocale(locale, "不支持的事件类型。", "不支援的事件類型。") },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (caseId) {
    if (!user) {
      return NextResponse.json(
        { message: pickLocale(locale, "记录案件事件前请先登录。", "記錄案件事件前請先登入。") },
        { status: 401 }
      );
    }

    const { data: caseRecord, error: caseError } = await supabase
      .from("cases")
      .select("id, status, use_case_slug, latest_readiness_status, latest_review_version")
      .eq("id", caseId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (caseError) {
      return NextResponse.json({ message: caseError.message }, { status: 500 });
    }

    if (!caseRecord) {
      return NextResponse.json(
        { message: pickLocale(locale, "找不到所选案件。", "找不到所選案件。") },
        { status: 404 }
      );
    }

    clientMetadata.useCase = caseRecord.use_case_slug;
    clientMetadata.caseStatus = caseRecord.status;
    clientMetadata.readinessStatus = caseRecord.latest_readiness_status;
    clientMetadata.reviewVersion = caseRecord.latest_review_version;
  }

  if ((eventType === "book_demo_clicked" || eventType === "early_access_requested") && typeof clientMetadata.useCase !== "string") {
    clientMetadata.useCase = "not-selected";
  }

  const error = await recordAppEvent(supabase, {
    eventType,
    userId: user?.id ?? null,
    caseId,
    path,
    metadata: {
      ...clientMetadata,
      sourceSurface: typeof clientMetadata.sourceSurface === "string" ? clientMetadata.sourceSurface : path ?? "unknown"
    }
  });

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

function isJsonValue(value: unknown): value is Json {
  return value === null || value === undefined || typeof value === "string" || typeof value === "number" || typeof value === "boolean" || Array.isArray(value) || (typeof value === "object" && value !== null);
}

function readJsonRecord(value: Json | undefined): Record<string, Json> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, Json>;
}
