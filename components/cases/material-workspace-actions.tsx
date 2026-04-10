"use client";

import { useMemo, useState } from "react";

import type { CaseMaterialWorkspaceActionOutput, CaseMaterialWorkspaceActionType } from "@/lib/case-ai";
import { formatDocumentStatus } from "@/lib/case-workflows";
import { useLocaleContext } from "@/lib/i18n/client";
import {
  formatRegenerateRecommendationLabel,
  getWorkspaceCopy
} from "@/lib/i18n/workspace";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type MaterialWorkspaceActionDocument = {
  id: string;
  label: string;
  status: string;
  required: boolean;
  fileName: string | null;
  materialReference: string | null;
  notes: string | null;
};

type MaterialWorkspaceActionsProps = {
  caseId: string;
  documents: MaterialWorkspaceActionDocument[];
};

export function MaterialWorkspaceActions({ caseId, documents }: MaterialWorkspaceActionsProps) {
  const { locale, messages } = useLocaleContext();
  const copy = getWorkspaceCopy(locale);
  const actionOptions: Array<{
    value: CaseMaterialWorkspaceActionType;
    label: string;
    description: string;
  }> = useMemo(
    () => [
      {
        value: "explain-missing",
        ...copy.materialActions.options.explainMissing
      },
      {
        value: "explain-review-needed",
        ...copy.materialActions.options.explainReviewNeeded
      },
      {
        value: "suggest-next-action",
        ...copy.materialActions.options.suggestNextAction
      },
      {
        value: "suggest-regenerate-review",
        ...copy.materialActions.options.suggestRegenerateReview
      },
      {
        value: "suggest-supporting-docs",
        ...copy.materialActions.options.suggestSupportingDocs
      }
    ],
    [copy.materialActions.options]
  );

  const defaultDocument =
    documents.find((item) => item.required && item.status !== "ready" && item.status !== "not-applicable") ?? documents[0];
  const [documentId, setDocumentId] = useState(defaultDocument?.id ?? "");
  const [actionType, setActionType] = useState<CaseMaterialWorkspaceActionType>("suggest-next-action");
  const [result, setResult] = useState<CaseMaterialWorkspaceActionOutput | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState(copy.materialActions.initialMessage);
  const selectedAction = actionOptions.find((item) => item.value === actionType) ?? actionOptions[2];

  if (documents.length === 0) {
    return null;
  }

  async function runAction(nextActionType = actionType) {
    if (!documentId) {
      setStatus("error");
      setMessage(copy.materialActions.chooseMaterial);
      return;
    }

    setActionType(nextActionType);
    setStatus("loading");
    setMessage(copy.materialActions.loading);

    try {
      const response = await fetch(`/api/cases/${caseId}/materials/action`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          documentId,
          actionType: nextActionType
        })
      });
      const data = (await response.json().catch(() => null)) as
        | {
            message?: string;
            action?: CaseMaterialWorkspaceActionOutput;
          }
        | null;

      if (!response.ok || !data?.action) {
        throw new Error(data?.message || copy.materialActions.error);
      }

      setResult(data.action);
      setStatus("success");
      setMessage(copy.materialActions.success);
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : copy.materialActions.error);
    }
  }

  return (
    <Card className="border-slate-200 bg-white shadow-none">
      <CardHeader>
        <Badge variant="secondary" className="w-fit">
          {copy.materialActions.badge}
        </Badge>
        <CardTitle>{copy.materialActions.title}</CardTitle>
        <CardDescription>{copy.materialActions.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
          <div className="space-y-2">
            <Label htmlFor="material-action-document">{copy.materialActions.materialLabel}</Label>
            <Select
              id="material-action-document"
              onChange={(event) => {
                setDocumentId(event.target.value);
                setResult(null);
                setStatus("idle");
                setMessage(copy.materialActions.initialMessage);
              }}
              value={documentId}
            >
              {documents.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label} - {formatDocumentStatus(item.status, locale)}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="material-action-type">{copy.materialActions.actionLabel}</Label>
            <Select
              id="material-action-type"
              onChange={(event) => {
                setActionType(event.target.value as CaseMaterialWorkspaceActionType);
                setResult(null);
                setStatus("idle");
                setMessage(copy.materialActions.initialMessage);
              }}
              value={actionType}
            >
              {actionOptions.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </Select>
            <p className="text-sm leading-6 text-slate-600">{selectedAction.description}</p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {actionOptions.map((item) => (
            <Button
              disabled={status === "loading"}
              key={item.value}
              onClick={() => void runAction(item.value)}
              size="sm"
              type="button"
              variant={actionType === item.value ? "secondary" : "outline"}
            >
              {item.label}
            </Button>
          ))}
        </div>

        <div
          className={cn("rounded-2xl border p-4 text-sm leading-6", {
            "border-slate-200 bg-slate-50 text-slate-700": status === "idle" || status === "loading",
            "border-emerald-200 bg-emerald-50 text-slate-900": status === "success",
            "border-red-200 bg-red-50 text-red-700": status === "error"
          })}
        >
          <p className="font-semibold uppercase tracking-[0.18em]">
            {status === "loading"
              ? messages.common.working
              : status === "success"
                ? messages.common.saved
                : status === "error"
                  ? messages.common.error
                  : messages.common.ready}
          </p>
          <p className="mt-2">{message}</p>
        </div>

        {result ? (
          <div className="space-y-4 border-t border-slate-200 pt-5">
            <div className="grid gap-3 md:grid-cols-3">
              <ResultStat label={copy.materialActions.likelyType} value={result.likelyDocumentType} />
              <ResultStat label={copy.materialActions.recommendedStatus} value={formatDocumentStatus(result.recommendedMaterialStatus, locale)} />
              <ResultStat label={copy.materialActions.reviewTiming} value={formatRegenerateRecommendationLabel(result.regenerateReviewRecommendation, locale)} />
            </div>
            <ResultList empty={copy.materialActions.noIssue} items={result.possibleIssues} title={copy.materialActions.possibleIssues} />
            <ResultList empty={copy.materialActions.noSupportingDocs} items={result.likelySupportingDocsNeeded} title={copy.materialActions.likelySupportingDocs} />
            <ResultList items={[result.suggestedNextAction]} title={copy.materialActions.suggestedNextAction} />
            <ResultList items={[result.reasoningSummary]} title={copy.materialActions.reasoningSummary} />
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function ResultStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-semibold leading-6 text-slate-950">{value}</p>
    </div>
  );
}

function ResultList({ title, items, empty }: { title: string; items: string[]; empty?: string }) {
  return (
    <div>
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">{title}</p>
      <div className="mt-2 space-y-2">
        {items.length > 0 ? (
          items.map((item) => (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-700" key={item}>
              {item}
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-700">{empty ?? "目前沒有可顯示的項目。"}</div>
        )}
      </div>
    </div>
  );
}
