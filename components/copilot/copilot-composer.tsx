"use client";

import Link from "next/link";
import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";

import type { CopilotStructuredResponse } from "@/lib/tool-results";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type CopilotComposerProps = {
  threadId?: string;
  threadTitle?: string;
  profileAvailable?: boolean;
};

export function CopilotComposer({ threadId, threadTitle, profileAvailable = false }: CopilotComposerProps) {
  const router = useRouter();
  const [values, setValues] = useState({
    stage: "research",
    objective: "choose-next-step",
    question: "",
    context: "",
    constraints: ""
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "success">("idle");
  const [message, setMessage] = useState("Copilot will return a structured response with clear next steps.");

  function validate() {
    const nextErrors: Record<string, string> = {};

    if (!values.question.trim()) {
      nextErrors.question = "Ask a focused question.";
    }

    if (values.question.trim().length < 20) {
      nextErrors.question = "Use enough detail for Copilot to narrow the next move.";
    }

    if (!values.context.trim()) {
      nextErrors.context = "Add the working context.";
    }

    if (!values.constraints.trim()) {
      nextErrors.constraints = "Add the main constraints or open issues.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!validate()) {
      setStatus("error");
      setMessage("Fix the highlighted fields before sending the question.");
      return;
    }

    setStatus("loading");
    setMessage(threadId ? "Adding to the current thread..." : "Creating a new thread...");

    try {
      const response = await fetch("/api/copilot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          threadId,
          ...values
        })
      });

      const data = (await response.json().catch(() => null)) as
        | {
            message?: string;
            threadId?: string;
            response?: CopilotStructuredResponse;
          }
        | null;

      if (!response.ok || !data?.threadId) {
        throw new Error(data?.message || "Unable to save this Copilot response.");
      }

      setStatus("success");
      setMessage(data.message || "Copilot response saved.");

      setValues((current) => ({
        ...current,
        question: "",
        context: "",
        constraints: ""
      }));

      startTransition(() => {
        router.push(`/copilot?thread=${data.threadId}`);
        router.refresh();
      });
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Unable to save this Copilot response.");
    }
  }

  return (
    <form className="space-y-5" noValidate onSubmit={handleSubmit}>
      <div className="flex flex-col gap-2">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          {threadId ? "Continue thread" : "Start a thread"}
        </p>
        <p className="text-sm leading-6 text-muted-foreground">
          {threadId
            ? `Add the next question to ${threadTitle ? `"${threadTitle}"` : "the selected thread"} with enough context to keep the response specific.`
            : "Capture the exact question, operating context, and constraint that should shape the answer."}
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
        <p className="font-semibold uppercase tracking-[0.18em] text-slate-500">Profile context</p>
        <p className="mt-2">
          {profileAvailable
            ? "Saved profile details are already applied to Copilot. Use the context and constraints fields for what changed, what is missing, or what is currently blocking progress."
            : "If you save your immigration profile, Copilot can reuse those core facts automatically and keep this form focused on the current question."}
        </p>
        {!profileAvailable ? (
          <Link className="mt-3 inline-flex font-medium text-emerald-700 underline-offset-4 hover:underline" href="/dashboard/profile">
            Add saved profile details
          </Link>
        ) : null}
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="copilot-stage">Current stage</Label>
          <Select
            id="copilot-stage"
            onChange={(event) => setValues((current) => ({ ...current, stage: event.target.value }))}
            value={values.stage}
          >
            <option value="research">Early research</option>
            <option value="comparing">Comparing options</option>
            <option value="documents">Preparing documents</option>
            <option value="ready">Ready to file</option>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="copilot-objective">Response objective</Label>
          <Select
            id="copilot-objective"
            onChange={(event) => setValues((current) => ({ ...current, objective: event.target.value }))}
            value={values.objective}
          >
            <option value="choose-next-step">Choose the next step</option>
            <option value="document-plan">Prioritize documents</option>
            <option value="risk-review">Review the main risk</option>
            <option value="timeline-planning">Sequence the timeline</option>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="copilot-question">Question</Label>
        <Textarea
          aria-invalid={Boolean(errors.question)}
          id="copilot-question"
          onChange={(event) => setValues((current) => ({ ...current, question: event.target.value }))}
          placeholder="Example: Which proof should I prioritize first if I need to keep both a work permit and permanent residence strategy open?"
          value={values.question}
        />
        {errors.question ? <p className="text-sm font-medium text-destructive">{errors.question}</p> : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="copilot-context">Context</Label>
        <Textarea
          aria-invalid={Boolean(errors.context)}
          id="copilot-context"
          onChange={(event) => setValues((current) => ({ ...current, context: event.target.value }))}
          placeholder="Summarize what changed or what matters for this question, such as a new document, a timing issue, a route you are weighing, or a blocker that needs a decision."
          value={values.context}
        />
        {errors.context ? <p className="text-sm font-medium text-destructive">{errors.context}</p> : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="copilot-constraints">Constraints or open issues</Label>
        <Textarea
          aria-invalid={Boolean(errors.constraints)}
          id="copilot-constraints"
          onChange={(event) => setValues((current) => ({ ...current, constraints: event.target.value }))}
          placeholder="List the main constraints, such as timing pressure, missing tests, budget limits, employer uncertainty, or unresolved family details."
          value={values.constraints}
        />
        {errors.constraints ? <p className="text-sm font-medium text-destructive">{errors.constraints}</p> : null}
      </div>

      <div
        className={cn("rounded-2xl border p-4 text-sm leading-6", {
          "border-slate-200 bg-slate-50 text-slate-700": status === "idle" || status === "loading" || status === "success",
          "border-red-200 bg-red-50 text-red-700": status === "error"
        })}
      >
        <p className="font-semibold uppercase tracking-[0.18em]">
          {status === "idle" ? "Ready" : status === "loading" ? "Working" : status === "success" ? "Saved" : "Error"}
        </p>
        <p className="mt-2">{message}</p>
      </div>

      <Button className="w-full sm:w-auto" disabled={status === "loading"} type="submit">
        {status === "loading" ? "Working..." : threadId ? "Continue thread" : "Start thread"}
      </Button>
    </form>
  );
}
