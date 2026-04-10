import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import type { Json } from "@/lib/database.types";
import {
  buildCaseMaterialSnapshots,
  interpretCaseMaterialsWithAi,
  summarizeMaterialInterpretationIssues
} from "@/lib/case-ai";
import { recordCaseEvent } from "@/lib/case-events";
import { parseCaseDocumentsInput } from "@/lib/case-review";
import { appendCaseStatusHistory, getNextCaseStatus, normalizeCaseStatus } from "@/lib/case-state";
import { getCurrentLocale } from "@/lib/i18n/server";
import { pickLocale } from "@/lib/i18n/workspace";
import type { SupportedUseCaseSlug } from "@/lib/case-workflows";
import { createClient } from "@/lib/supabase/server";

type CaseDocumentsRouteProps = {
  params: Promise<{
    caseId: string;
  }>;
};

export async function PATCH(request: Request, { params }: CaseDocumentsRouteProps) {
  const { caseId } = await params;
  const body = await request.json().catch(() => null);
  const locale = await getCurrentLocale();
  const parsed = parseCaseDocumentsInput(body, locale);

  if (!parsed.success) {
    return NextResponse.json({ message: parsed.message }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { message: pickLocale(locale, "请先登录后再更新案件材料。", "請先登入後再更新案件材料。") },
      { status: 401 }
    );
  }

  const { data: caseRecord, error: caseError } = await supabase
    .from("cases")
    .select("id, status, status_history, use_case_slug, metadata")
    .eq("user_id", user.id)
    .eq("id", caseId)
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

  const currentStatus = normalizeCaseStatus(caseRecord.status);

  if (!currentStatus) {
    return NextResponse.json(
      { message: pickLocale(locale, "暂时无法解析案件状态。", "暫時無法解析案件狀態。") },
      { status: 500 }
    );
  }

  const { data: existingDocuments, error: existingDocumentsError } = await supabase
    .from("case_documents")
    .select("id, document_key, label, description, required, status, material_reference, notes, file_name, mime_type")
    .eq("case_id", caseRecord.id);

  if (existingDocumentsError) {
    return NextResponse.json({ message: existingDocumentsError.message }, { status: 500 });
  }

  const existingDocumentMap = new Map((existingDocuments ?? []).map((item) => [item.id, item]));
  const validIds = new Set(existingDocumentMap.keys());

  if (parsed.data.documents.some((item) => !validIds.has(item.id))) {
    return NextResponse.json(
      { message: pickLocale(locale, "有一个或多个材料行无法与当前案件匹配。", "有一個或多個材料列無法與目前案件匹配。") },
      { status: 400 }
    );
  }

  const changedMaterialsCount = parsed.data.documents.filter((item) => {
    const existing = existingDocumentMap.get(item.id);

    if (!existing) {
      return false;
    }

    return (
      existing.status !== item.status ||
      (existing.material_reference ?? "") !== (item.materialReference || "") ||
      (existing.notes ?? "") !== (item.notes || "")
    );
  }).length;
  const changedRequiredMaterialsCount = parsed.data.documents.filter((item) => {
    const existing = existingDocumentMap.get(item.id);

    if (!existing?.required) {
      return false;
    }

    return (
      existing.status !== item.status ||
      (existing.material_reference ?? "") !== (item.materialReference || "") ||
      (existing.notes ?? "") !== (item.notes || "")
    );
  }).length;

  for (const item of parsed.data.documents) {
    const { error } = await supabase
      .from("case_documents")
      .update({
        status: item.status,
        material_reference: item.materialReference || null,
        notes: item.notes || null
      })
      .eq("case_id", caseRecord.id)
      .eq("id", item.id);

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 500 });
    }
  }

  const nextStatus = getNextCaseStatus(currentStatus, "materials-updated");
  const readyCount = parsed.data.documents.filter((item) => item.status === "ready" || item.status === "not-applicable").length;
  const collectingCount = parsed.data.documents.filter((item) => item.status === "collecting").length;
  const needsRefreshCount = parsed.data.documents.filter((item) => item.status === "needs-refresh").length;
  const missingCount = parsed.data.documents.filter((item) => item.status === "missing").length;
  const requiredReadyCount = parsed.data.documents.filter((item) => {
    const existing = existingDocumentMap.get(item.id);
    return existing?.required && (item.status === "ready" || item.status === "not-applicable");
  }).length;
  const requiredMissingCount = parsed.data.documents.filter((item) => {
    const existing = existingDocumentMap.get(item.id);
    return existing?.required && item.status === "missing";
  }).length;
  const requiredActionCount = parsed.data.documents.filter((item) => {
    const existing = existingDocumentMap.get(item.id);
    return existing?.required && item.status !== "ready" && item.status !== "not-applicable";
  }).length;
  const proposedDocuments = parsed.data.documents.flatMap((item) => {
    const existing = existingDocumentMap.get(item.id);

    if (!existing) {
      return [];
    }

    return [
      {
        ...existing,
        status: item.status,
        material_reference: item.materialReference || null,
        notes: item.notes || null
      }
    ];
  });
  const materialInterpretation = await interpretCaseMaterialsWithAi(
    caseRecord.use_case_slug as SupportedUseCaseSlug,
    buildCaseMaterialSnapshots(proposedDocuments),
    locale
  );
  const materialInterpretationSummary = summarizeMaterialInterpretationIssues(materialInterpretation.output);
  const materialPossibleIssueCount = materialInterpretationSummary.possibleIssueCount ?? 0;
  const reviewRegenerationRecommended = shouldRecommendReviewRegeneration({
    currentStatus,
    changedMaterialsCount,
    changedRequiredMaterialsCount,
    requiredActionCount,
    materialIssueCount: materialPossibleIssueCount
  });
  const likelyReadinessImpact = buildLikelyReadinessImpact({
    locale,
    changedMaterialsCount,
    changedRequiredMaterialsCount,
    requiredReadyCount,
    requiredMissingCount,
    requiredActionCount,
    reviewRegenerationRecommended
  });
  const materialImpact = {
    changedCount: changedMaterialsCount,
    changedRequiredCount: changedRequiredMaterialsCount,
    requiredReadyCount,
    requiredMissingCount,
    requiredActionCount,
    possibleIssueCount: materialPossibleIssueCount,
    likelySupportingDocSuggestionCount: materialInterpretationSummary.likelySupportingDocSuggestionCount,
    reviewRegenerationRecommended,
    likelyReadinessImpact,
    suggestedNextAction: reviewRegenerationRecommended
      ? pickLocale(
          locale,
          "保存这些材料变更后请重新生成审查，让就绪度、缺失项和风险标记反映当前包件。",
          "儲存這些材料變更後請重新生成審查，讓就緒度、缺失項和風險標記反映目前包件。"
        )
      : pickLocale(
          locale,
          "材料已保存。请继续收集尚未解决的项目，再决定是否重新生成审查。",
          "材料已儲存。請繼續收集尚未解決的項目，再決定是否重新生成審查。"
        )
  };
  const nextCaseMetadata = {
    ...readMetadataRecord(caseRecord.metadata),
    aiWorkflow: {
      ...readMetadataRecord(readMetadataRecord(caseRecord.metadata).aiWorkflow),
      materialInterpretation: materialInterpretation as Json
    }
  };

  const { error: updateCaseError } = await supabase
    .from("cases")
    .update({
      status: nextStatus,
      status_history: appendCaseStatusHistory(caseRecord.status_history, nextStatus),
      metadata: nextCaseMetadata
    })
    .eq("user_id", user.id)
    .eq("id", caseRecord.id);

  if (updateCaseError) {
    return NextResponse.json({ message: updateCaseError.message }, { status: 500 });
  }

  const eventError = await recordCaseEvent(supabase, {
    caseId: caseRecord.id,
    userId: user.id,
    eventType: "materials_updated",
    status: nextStatus,
    fromStatus: currentStatus,
    toStatus: nextStatus,
    metadata: {
      useCaseSlug: caseRecord.use_case_slug,
      documentCount: parsed.data.documents.length,
      changedCount: changedMaterialsCount,
      changedMaterialsCount,
      changedRequiredMaterialsCount,
      readyCount,
      requiredReadyCount,
      collectingCount,
      needsRefreshCount,
      missingCount,
      requiredMissingCount,
      requiredActionCount,
      materialInterpretationSource: materialInterpretation.source,
      materialInterpretationPromptVersion: materialInterpretation.promptVersion,
      materialIssueFlagCount: materialInterpretationSummary.issueFlagCount,
      materialPossibleIssueCount,
      materialLikelySupportingDocSuggestionCount: materialInterpretationSummary.likelySupportingDocSuggestionCount,
      materialSuggestedStatusChangesCount: materialInterpretationSummary.suggestedStatusChangesCount,
      materialRecommendedStatusReviewCount: materialInterpretationSummary.recommendedStatusReviewCount,
      reviewRegenerationRecommended,
      likelyReadinessImpact
    }
  });

  if (eventError) {
    console.error("Unable to record case materials event", eventError);
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/cases");
  revalidatePath(`/dashboard/cases/${caseRecord.id}`);
  revalidatePath(`/upload-materials/${caseRecord.id}`);

  return NextResponse.json({
    message: pickLocale(locale, "材料已保存。", "材料已儲存。"),
    materialImpact
  });
}

function readMetadataRecord(metadata: Json | null | undefined) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return {};
  }

  return metadata;
}

function shouldRecommendReviewRegeneration({
  currentStatus,
  changedMaterialsCount,
  changedRequiredMaterialsCount,
  requiredActionCount,
  materialIssueCount
}: {
  currentStatus: string;
  changedMaterialsCount: number;
  changedRequiredMaterialsCount: number;
  requiredActionCount: number;
  materialIssueCount: number;
}) {
  if (changedMaterialsCount === 0) {
    return false;
  }

  if (currentStatus === "reviewed") {
    return true;
  }

  return changedRequiredMaterialsCount > 0 || requiredActionCount === 0 || materialIssueCount > 0;
}

function buildLikelyReadinessImpact({
  locale,
  changedMaterialsCount,
  changedRequiredMaterialsCount,
  requiredReadyCount,
  requiredMissingCount,
  requiredActionCount,
  reviewRegenerationRecommended
}: {
  locale: "zh-CN" | "zh-TW";
  changedMaterialsCount: number;
  changedRequiredMaterialsCount: number;
  requiredReadyCount: number;
  requiredMissingCount: number;
  requiredActionCount: number;
  reviewRegenerationRecommended: boolean;
}) {
  if (changedMaterialsCount === 0) {
    return pickLocale(locale, "当前没有检测到材料变更。", "目前沒有偵測到材料變更。");
  }

  if (requiredActionCount === 0) {
    return pickLocale(
      locale,
      "所有必需材料都已标记为就绪或不适用；重新生成审查可以验证交接就绪度。",
      "所有必需材料都已標記為就緒或不適用；重新生成審查可以驗證交接就緒度。"
    );
  }

  if (changedRequiredMaterialsCount > 0 && requiredReadyCount > 0) {
    return pickLocale(
      locale,
      `${changedRequiredMaterialsCount} 个必需材料更新，可能在重新生成审查后改善缺失项或风险信号。`,
      `${changedRequiredMaterialsCount} 個必需材料更新，可能在重新生成審查後改善缺失項或風險訊號。`
    );
  }

  if (requiredMissingCount > 0) {
    return pickLocale(
      locale,
      `仍有 ${requiredMissingCount} 个必需材料缺失，因此就绪度大概率仍受限制。`,
      `仍有 ${requiredMissingCount} 個必需材料缺失，因此就緒度大概率仍受限制。`
    );
  }

  return reviewRegenerationRecommended
    ? pickLocale(
        locale,
        "材料元数据变化已经足够明显，重新生成审查应能刷新案件信号。",
        "材料中介資料變化已經足夠明顯，重新生成審查應能刷新案件訊號。"
      )
    : pickLocale(
        locale,
        "材料变更已保存，但在重新生成审查真正有价值前，包件大概率还需要更多收紧工作。",
        "材料變更已儲存，但在重新生成審查真正有價值前，包件大概率還需要更多收緊工作。"
      );
}
