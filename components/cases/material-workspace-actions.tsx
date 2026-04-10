"use client";

import { useState } from "react";

import type {
  CaseMaterialWorkspaceActionOutput,
  CaseMaterialWorkspaceActionType
} from "@/lib/case-ai";
import { formatDocumentStatus } from "@/lib/case-workflows";
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

const actionOptions: Array<{
  value: CaseMaterialWorkspaceActionType;
  label: string;
  description: string;
}> = [
  {
    value: "explain-missing",
    label: "Explain missing",
    description: "Why this item still blocks the package."
  },
  {
    value: "explain-review-needed",
    label: "Explain review need",
    description: "Why this material may still need attention."
  },
  {
    value: "suggest-next-action",
    label: "Next action",
    description: "What to do next with this material."
  },
  {
    value: "suggest-regenerate-review",
    label: "Regenerate timing",
    description: "Whether the review should be refreshed."
  },
  {
    value: "suggest-supporting-docs",
    label: "Supporting docs",
    description: "Likely supporting evidence to check."
  }
];

export function MaterialWorkspaceActions({ caseId, documents }: MaterialWorkspaceActionsProps) {
  const defaultDocument = documents.find((item) => item.required && item.status !== "ready" && item.status !== "not-applicable") ?? documents[0];
  const [documentId, setDocumentId] = useState(defaultDocument?.id ?? "");
  const [actionType, setActionType] = useState<CaseMaterialWorkspaceActionType>("suggest-next-action");
  const [result, setResult] = useState<CaseMaterialWorkspaceActionOutput | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("Choose a material and run a structured workspace action.");
  const selectedAction = actionOptions.find((item) => item.value === actionType) ?? actionOptions[2];

  if (documents.length === 0) {
    return null;
  }

  async function runAction(nextActionType = actionType) {
    if (!documentId) {
      setStatus("error");
      setMessage("Choose a material first.");
      return;
    }

    setActionType(nextActionType);
    setStatus("loading");
    setMessage("Reading material metadata, latest review context, and knowledge support...");

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
        throw new Error(data?.message || "Unable to run this material action.");
      }

      setResult(data.action);
      setStatus("success");
      setMessage("Structured material action saved to the case trace.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Unable to run this material action.");
    }
  }

  return (
    <Card className="border-slate-200 bg-white shadow-none">
      <CardHeader>
        <Badge variant="secondary" className="w-fit">
          Material workspace actions
        </Badge>
        <CardTitle>Ask the workflow what to do with a material</CardTitle>
        <CardDescription>
          These actions use saved material metadata and latest review context. They do not inspect file contents or open a generic chat.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
          <div className="space-y-2">
            <Label htmlFor="material-action-document">Material</Label>
            <Select
              id="material-action-document"
              onChange={(event) => {
                setDocumentId(event.target.value);
                setResult(null);
                setStatus("idle");
                setMessage("Choose a material and run a structured workspace action.");
              }}
              value={documentId}
            >
              {documents.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label} - {formatDocumentStatus(item.status)}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="material-action-type">Action</Label>
            <Select
              id="material-action-type"
              onChange={(event) => {
                setActionType(event.target.value as CaseMaterialWorkspaceActionType);
                setResult(null);
                setStatus("idle");
                setMessage("Choose a material and run a structured workspace action.");
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
            {status === "loading" ? "Working" : status === "success" ? "Saved" : status === "error" ? "Error" : "Ready"}
          </p>
          <p className="mt-2">{message}</p>
        </div>

        {result ? (
          <div className="space-y-4 border-t border-slate-200 pt-5">
            <div className="grid gap-3 md:grid-cols-3">
              <ResultStat label="Likely type" value={result.likelyDocumentType} />
              <ResultStat label="Recommended status" value={formatDocumentStatus(result.recommendedMaterialStatus)} />
              <ResultStat label="Review timing" value={formatRecommendation(result.regenerateReviewRecommendation)} />
            </div>
            <ResultList title="Possible issues" items={result.possibleIssues} empty="No obvious material issue surfaced." />
            <ResultList
              title="Likely supporting documents"
              items={result.likelySupportingDocsNeeded}
              empty="No extra supporting document was suggested from the available metadata."
            />
            <ResultList title="Suggested next action" items={[result.suggestedNextAction]} />
            <ResultList title="Reasoning summary" items={[result.reasoningSummary]} />
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

function ResultList({ title, items, empty = "No items surfaced." }: { title: string; items: string[]; empty?: string }) {
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
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-700">
            {empty}
          </div>
        )}
      </div>
    </div>
  );
}

function formatRecommendation(value: CaseMaterialWorkspaceActionOutput["regenerateReviewRecommendation"]) {
  if (value === "recommended-now") {
    return "Regenerate now";
  }

  if (value === "consider-after-material-update") {
    return "After update";
  }

  return "Not needed";
}
