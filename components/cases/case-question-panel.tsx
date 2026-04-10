"use client";

import { useState } from "react";

import type { CaseQuestionAnswer } from "@/lib/case-ai";
import type { SupportedUseCaseSlug } from "@/lib/case-workflows";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type CaseQuestionPanelProps = {
  caseId: string;
  caseTitle: string;
  useCaseSlug: SupportedUseCaseSlug;
  useCaseTitle: string;
  latestReviewSummary?: string | null;
};

const presetQuestions = [
  "What am I still missing?",
  "Why is this a risk?",
  "What changed since the last review?",
  "What should I do next?"
];

export function CaseQuestionPanel({
  caseId,
  caseTitle,
  useCaseSlug,
  useCaseTitle,
  latestReviewSummary = null
}: CaseQuestionPanelProps) {
  const [question, setQuestion] = useState(presetQuestions[0]);
  const [answer, setAnswer] = useState<CaseQuestionAnswer | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("Ask a structured question about this saved case.");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (question.trim().length < 8) {
      setStatus("error");
      setMessage("Ask a more specific question about this case.");
      return;
    }

    setStatus("loading");
    setMessage("Reading case context and generating a structured answer...");

    try {
      const response = await fetch(`/api/cases/${caseId}/question`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          useCase: useCaseSlug,
          question
        })
      });
      const data = (await response.json().catch(() => null)) as
        | {
            message?: string;
            answer?: CaseQuestionAnswer;
          }
        | null;

      if (!response.ok || !data?.answer) {
        throw new Error(data?.message || "Unable to answer this case question.");
      }

      setAnswer(data.answer);
      setStatus("success");
      setMessage("Structured answer saved to this case trace.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Unable to answer this case question.");
    }
  }

  return (
    <Card className="border-slate-200 bg-white shadow-none">
      <CardHeader>
        <Badge variant="secondary" className="w-fit">
          Case-context question
        </Badge>
        <CardTitle>Ask about this case</CardTitle>
        <CardDescription>
          This is grounded in {caseTitle}, the latest {useCaseTitle} review, materials state, and internal knowledge context.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="flex flex-wrap gap-2">
            {presetQuestions.map((item) => (
              <Button
                key={item}
                onClick={() => {
                  setQuestion(item);
                  setAnswer(null);
                  setStatus("idle");
                  setMessage("Ask a structured question about this saved case.");
                }}
                size="sm"
                type="button"
                variant={question === item ? "secondary" : "outline"}
              >
                {item}
              </Button>
            ))}
          </div>

          <div className="space-y-2">
            <Label htmlFor="workspace-case-question">Question</Label>
            <Textarea
              id="workspace-case-question"
              onChange={(event) => {
                setQuestion(event.target.value);
                if (answer) {
                  setAnswer(null);
                  setStatus("idle");
                  setMessage("Ask a structured question about this saved case.");
                }
              }}
              rows={4}
              value={question}
            />
          </div>

          {latestReviewSummary ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
              <p className="font-semibold uppercase tracking-[0.18em] text-slate-500">Latest review context</p>
              <p className="mt-2">{latestReviewSummary}</p>
            </div>
          ) : null}

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

          <Button disabled={status === "loading"} type="submit">
            {status === "loading" ? "Answering..." : "Answer from case context"}
          </Button>
        </form>

        {answer ? (
          <div className="space-y-4 border-t border-slate-200 pt-5">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Summary</p>
              <p className="mt-2 text-sm leading-7 text-slate-700">{answer.summary}</p>
            </div>
            <PanelList title="Why this matters" items={[answer.whyThisMatters]} />
            <PanelList title="Next steps" items={answer.nextSteps} />
            <PanelList title="Warnings" items={answer.scenarioSpecificWarnings} empty="No scenario warning was surfaced." />
            <PanelList
              title="Tracker actions"
              items={answer.trackerActions.map((item) => `${item.label}: ${item.detail}`)}
            />
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function PanelList({ title, items, empty = "No items surfaced." }: { title: string; items: string[]; empty?: string }) {
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
