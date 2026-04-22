import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { recordCaseEvent } from "@/lib/case-events";
import { normalizeCaseStatus } from "@/lib/case-state";
import { parseHandoffRequestRecord } from "@/lib/handoffs";
import { getCurrentLocale } from "@/lib/i18n/server";
import { pickLocale } from "@/lib/i18n/workspace";
import { getConsumerCapabilityAccessDeniedMessage, getConsumerPlanState, hasConsumerPlanCapability } from "@/lib/plans";
import { buildHandoffPacketSnapshot } from "@/lib/server/handoffs";
import { createClient } from "@/lib/supabase/server";

type CaseHandoffRouteProps = {
  params: Promise<{
    caseId: string;
  }>;
};

export async function POST(request: Request, { params }: CaseHandoffRouteProps) {
  const { caseId } = await params;
  const locale = await getCurrentLocale();
  const body = (await request.json().catch(() => null)) as { note?: string } | null;
  const requestNote = typeof body?.note === "string" ? body.note.trim() : "";

  if (requestNote.length > 1000) {
    return NextResponse.json(
      {
        message: pickLocale(locale, "备注请控制在 1000 个字符以内。", "備註請控制在 1000 個字元以內。")
      },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      {
        message: pickLocale(locale, "请先登录后再请求专业审阅。", "請先登入後再請求專業審閱。")
      },
      { status: 401 }
    );
  }

  const [profileResult, caseResult, documentsResult, reviewResult, existingRequestResult] = await Promise.all([
    supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle(),
    supabase.from("cases").select("*").eq("user_id", user.id).eq("id", caseId).maybeSingle(),
    supabase.from("case_documents").select("*").eq("case_id", caseId).order("position", { ascending: true }),
    supabase.from("case_review_versions").select("*").eq("case_id", caseId).order("version_number", { ascending: false }).limit(1),
    supabase
      .from("handoff_requests")
      .select("*")
      .eq("case_id", caseId)
      .eq("client_user_id", user.id)
      .in("status", ["new", "opened", "in_review", "requested", "queued"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
  ]);

  if (profileResult.error || caseResult.error || documentsResult.error || reviewResult.error || existingRequestResult.error) {
    return NextResponse.json(
      {
        message:
          profileResult.error?.message ||
          caseResult.error?.message ||
          documentsResult.error?.message ||
          reviewResult.error?.message ||
          existingRequestResult.error?.message ||
          pickLocale(locale, "暂时无法创建专业审阅请求。", "暫時無法建立專業審閱請求。")
      },
      { status: 500 }
    );
  }

  const caseRecord = caseResult.data;
  const latestReview = reviewResult.data?.[0] ?? null;
  const planState = getConsumerPlanState(profileResult.data ?? null);

  if (!caseRecord) {
    return NextResponse.json(
      {
        message: pickLocale(locale, "找不到所选案件。", "找不到所選案件。")
      },
      { status: 404 }
    );
  }

  if (!latestReview) {
    return NextResponse.json(
      {
        message: pickLocale(locale, "请先生成最新审查，再请求专业审阅。", "請先產生最新審查，再請求專業審閱。")
      },
      { status: 400 }
    );
  }

  if (!hasConsumerPlanCapability(planState, "handoff_intelligence")) {
    return NextResponse.json(
      {
        message: getConsumerCapabilityAccessDeniedMessage("handoff_intelligence", locale),
        requiredPlan: "pro",
        gatedCapability: "handoff_intelligence"
      },
      { status: 403 }
    );
  }

  if (existingRequestResult.data) {
    return NextResponse.json(
      {
        message: pickLocale(locale, "这个案件已经有一条活跃的专业审阅请求。", "這個案件已經有一條活躍的專業審閱請求。"),
        handoffRequest: parseHandoffRequestRecord(existingRequestResult.data)
      },
      { status: 409 }
    );
  }

  const caseStatus = normalizeCaseStatus(caseRecord.status);

  if (!caseStatus) {
    return NextResponse.json(
      {
        message: pickLocale(locale, "暂时无法解析案件状态。", "暫時無法解析案件狀態。")
      },
      { status: 500 }
    );
  }

  let packet: ReturnType<typeof buildHandoffPacketSnapshot>;

  try {
    packet = buildHandoffPacketSnapshot({
      caseRecord,
      documents: documentsResult.data ?? [],
      latestReview,
      profile: profileResult.data ?? null,
      user,
      locale
    });
  } catch (error) {
    console.error("Unable to build professional handoff packet", error);

    return NextResponse.json(
      {
        message: pickLocale(locale, "暂时无法生成交接资料包。", "暫時無法產生交接資料包。")
      },
      { status: 500 }
    );
  }

  const { data: inserted, error: insertError } = await supabase
    .from("handoff_requests")
    .insert({
      case_id: caseRecord.id,
      client_user_id: user.id,
      status: "new",
      client_locale: locale,
      requested_review_version: latestReview.version_number,
      requested_readiness_status: latestReview.readiness_status,
      request_note: requestNote || null,
      export_snapshot: packet,
      metadata: {
        sourceSurface: "review-export-page",
        caseStatus: caseRecord.status,
        useCase: caseRecord.use_case_slug,
        hasHandoffIntelligence: Boolean(packet.handoffIntelligence)
      }
    })
    .select("*")
    .single();

  if (insertError || !inserted) {
    return NextResponse.json(
      {
        message:
          insertError?.code === "23505"
            ? pickLocale(locale, "这个案件已经有一条活跃的专业审阅请求。", "這個案件已經有一條活躍的專業審閱請求。")
            : insertError?.message || pickLocale(locale, "暂时无法创建专业审阅请求。", "暫時無法建立專業審閱請求。")
      },
      { status: insertError?.code === "23505" ? 409 : 500 }
    );
  }

  const eventError = await recordCaseEvent(supabase, {
    caseId: caseRecord.id,
    userId: user.id,
    eventType: "professional_review_requested",
    status: caseStatus,
    metadata: {
      sourceSurface: "review-export-page",
      useCase: caseRecord.use_case_slug,
      reviewVersion: latestReview.version_number,
      readinessStatus: latestReview.readiness_status,
      handoffRequestId: inserted.id,
      requestedLocale: locale,
      hasHandoffIntelligence: Boolean(packet.handoffIntelligence)
    }
  });

  if (eventError) {
    console.error("Unable to record professional review request event", eventError);
  }

  revalidatePath(`/review-results/${caseId}`);
  revalidatePath(`/review-results/${caseId}/export`);
  revalidatePath("/professional/dashboard");

  return NextResponse.json({
    message: pickLocale(locale, "专业审阅请求已发送。", "專業審閱請求已送出。"),
    handoffRequest: parseHandoffRequestRecord(inserted)
  });
}
