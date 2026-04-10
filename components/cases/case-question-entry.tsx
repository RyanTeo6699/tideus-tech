"use client";

import Link from "next/link";
import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";

import type { CaseQuestionAnswer } from "@/lib/case-ai";
import type { CaseQuestionSaveAction } from "@/lib/case-question";
import type { SupportedUseCaseSlug } from "@/lib/case-workflows";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useLocaleContext } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";

type CaseQuestionEntryProps = {
  useCases: Array<{
    slug: SupportedUseCaseSlug;
    shortTitle: string;
    description: string;
  }>;
};

type AskStatus = "idle" | "loading" | "success" | "error";
type SaveStatus = "idle" | "loading" | "success" | "error";

export function CaseQuestionEntry({ useCases }: CaseQuestionEntryProps) {
  const { messages } = useLocaleContext();
  const router = useRouter();
  const [useCase, setUseCase] = useState<SupportedUseCaseSlug>(useCases[0]?.slug ?? "visitor-record");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<CaseQuestionAnswer | null>(null);
  const [askStatus, setAskStatus] = useState<AskStatus>("idle");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [message, setMessage] = useState(messages.caseQuestionEntry.initialMessage);
  const [saveMessage, setSaveMessage] = useState("");
  const [nextHref, setNextHref] = useState<string | null>(null);
  const [loginHref, setLoginHref] = useState<string | null>(null);
  const selectedUseCase = useCases.find((item) => item.slug === useCase);

  function resetSavedAnswer() {
    setAnswer(null);
    setSaveStatus("idle");
    setSaveMessage("");
    setNextHref(null);
    setLoginHref(null);
  }

  async function handleAsk(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaveStatus("idle");
    setSaveMessage("");
    setNextHref(null);
    setLoginHref(null);

    if (question.trim().length < 8) {
      setAskStatus("error");
      setMessage(messages.caseQuestionEntry.tooShortQuestion);
      return;
    }

    setAskStatus("loading");
    setMessage(messages.caseQuestionEntry.generating);

    try {
      const response = await fetch("/api/case-question", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          useCase,
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
        throw new Error(data?.message || messages.caseQuestionEntry.generateError);
      }

      setAnswer(data.answer);
      setAskStatus("success");
      setMessage(messages.caseQuestionEntry.answerReady);
    } catch (error) {
      setAskStatus("error");
      setMessage(error instanceof Error ? error.message : messages.caseQuestionEntry.generateError);
    }
  }

  async function handleSave(action: CaseQuestionSaveAction) {
    if (!answer) {
      setSaveStatus("error");
      setSaveMessage(messages.caseQuestionEntry.saveBeforeGenerate);
      return;
    }

    setSaveStatus("loading");
    setSaveMessage(messages.caseQuestionEntry.creatingWorkspace);
    setLoginHref(null);

    try {
      const response = await fetch("/api/case-question/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          useCase,
          question,
          answer,
          action
        })
      });
      const data = (await response.json().catch(() => null)) as
        | {
            message?: string;
            caseId?: string;
            nextHref?: string;
          }
        | null;

      if (response.status === 401) {
        setLoginHref(`/login?next=${encodeURIComponent("/case-question")}`);
        throw new Error(data?.message || messages.caseQuestionEntry.signInToSave);
      }

      if (!response.ok || !data?.caseId || typeof data.nextHref !== "string") {
        throw new Error(data?.message || messages.caseQuestionEntry.saveError);
      }

      const savedNextHref = data.nextHref;

      setNextHref(savedNextHref);
      setSaveStatus("success");
      setSaveMessage(messages.caseQuestionEntry.savedWorkspace);

      if (action === "continue-in-case-workspace") {
        startTransition(() => {
          router.push(savedNextHref);
          router.refresh();
        });
      }
    } catch (error) {
      setSaveStatus("error");
      setSaveMessage(error instanceof Error ? error.message : messages.caseQuestionEntry.saveError);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
      <Card className="h-fit">
        <CardHeader>
          <Badge variant="secondary" className="w-fit">
            {messages.caseQuestionEntry.taskBadge}
          </Badge>
          <CardTitle className="text-3xl">{messages.caseQuestionEntry.title}</CardTitle>
          <CardDescription>{messages.caseQuestionEntry.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-5" onSubmit={handleAsk}>
            <div className="space-y-2">
              <Label htmlFor="case-question-use-case">{messages.caseQuestionEntry.scenarioLabel}</Label>
              <Select
                id="case-question-use-case"
                onChange={(event) => {
                  setUseCase(event.target.value as SupportedUseCaseSlug);
                  resetSavedAnswer();
                }}
                value={useCase}
              >
                {useCases.map((item) => (
                  <option key={item.slug} value={item.slug}>
                    {item.shortTitle}
                  </option>
                ))}
              </Select>
              <p className="text-sm leading-6 text-muted-foreground">
                {selectedUseCase?.description}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="case-question">{messages.caseQuestionEntry.questionLabel}</Label>
              <Textarea
                id="case-question"
                onChange={(event) => {
                  setQuestion(event.target.value);
                  if (answer) {
                    resetSavedAnswer();
                  }
                }}
                placeholder={messages.caseQuestionEntry.questionPlaceholder}
                rows={7}
                value={question}
              />
              <p className="text-sm leading-6 text-muted-foreground">{messages.caseQuestionEntry.questionHelper}</p>
            </div>

            <div
              className={cn("rounded-2xl border p-4 text-sm leading-6", {
                "border-slate-200 bg-slate-50 text-slate-700": askStatus === "idle" || askStatus === "loading",
                "border-emerald-200 bg-emerald-50 text-slate-900": askStatus === "success",
                "border-red-200 bg-red-50 text-red-700": askStatus === "error"
              })}
            >
              <p className="font-semibold uppercase tracking-[0.18em]">
                {askStatus === "loading"
                  ? messages.common.working
                  : askStatus === "error"
                    ? messages.common.error
                    : askStatus === "success"
                      ? messages.common.ready
                      : messages.caseQuestionEntry.caseQuestionLabel}
              </p>
              <p className="mt-2">{message}</p>
            </div>

            <Button disabled={askStatus === "loading"} type="submit">
              {askStatus === "loading" ? messages.caseQuestionEntry.generatingButton : messages.caseQuestionEntry.generateButton}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-6">
        {answer ? (
          <>
            <StructuredAnswer answer={answer} />

            <Card className="border-emerald-200 bg-emerald-50/80 shadow-none">
              <CardHeader>
                <CardTitle>{messages.caseQuestionEntry.workspaceTitle}</CardTitle>
                <CardDescription>{messages.caseQuestionEntry.workspaceDescription}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Button disabled={saveStatus === "loading"} onClick={() => void handleSave("save-to-workspace")} type="button">
                    {messages.caseQuestionEntry.saveToWorkspace}
                  </Button>
                  <Button
                    disabled={saveStatus === "loading"}
                    onClick={() => void handleSave("generate-checklist")}
                    type="button"
                    variant="outline"
                  >
                    {messages.caseQuestionEntry.generateChecklist}
                  </Button>
                  <Button
                    disabled={saveStatus === "loading"}
                    onClick={() => void handleSave("start-tracking")}
                    type="button"
                    variant="outline"
                  >
                    {messages.caseQuestionEntry.startTracking}
                  </Button>
                  <Button
                    disabled={saveStatus === "loading"}
                    onClick={() => void handleSave("continue-in-case-workspace")}
                    type="button"
                    variant="outline"
                  >
                    {messages.caseQuestionEntry.continueInWorkspace}
                  </Button>
                </div>

                {saveMessage ? (
                  <div
                    className={cn("rounded-2xl border p-4 text-sm leading-6", {
                      "border-slate-200 bg-white text-slate-700": saveStatus === "idle" || saveStatus === "loading",
                      "border-emerald-200 bg-white text-slate-900": saveStatus === "success",
                      "border-red-200 bg-red-50 text-red-700": saveStatus === "error"
                    })}
                  >
                    <p className="font-semibold uppercase tracking-[0.18em]">
                      {saveStatus === "loading"
                        ? messages.common.working
                        : saveStatus === "success"
                          ? messages.common.saved
                          : messages.common.actionNeeded}
                    </p>
                    <p className="mt-2">{saveMessage}</p>
                    {loginHref ? (
                      <Link className="mt-3 inline-flex text-sm font-semibold text-slate-950 underline" href={loginHref}>
                        {messages.caseQuestionEntry.signInToSave}
                      </Link>
                    ) : null}
                    {nextHref ? (
                      <Link className="mt-3 inline-flex text-sm font-semibold text-slate-950 underline" href={nextHref}>
                        {messages.caseQuestionEntry.openSavedWorkspace}
                      </Link>
                    ) : null}
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </>
        ) : (
          <Card className="border-slate-200 bg-slate-50 shadow-none">
            <CardHeader>
              <CardTitle>{messages.caseQuestionEntry.emptyTitle}</CardTitle>
              <CardDescription>{messages.caseQuestionEntry.emptyDescription}</CardDescription>
            </CardHeader>
          </Card>
        )}
      </div>
    </div>
  );
}

function StructuredAnswer({ answer }: { answer: CaseQuestionAnswer }) {
  const { messages } = useLocaleContext();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{messages.caseQuestionEntry.structuredAnswerTitle}</CardTitle>
          <CardDescription>{answer.summary}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-7 text-slate-700">
            <p className="font-semibold uppercase tracking-[0.18em] text-slate-500">{messages.caseQuestionEntry.whyMattersTitle}</p>
            <p className="mt-2">{answer.whyThisMatters}</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <AnswerList title={messages.caseQuestionEntry.contextTitle} items={answer.supportingContextNotes} empty={messages.caseQuestionEntry.emptyItems} />
        <AnswerList title={messages.caseQuestionEntry.warningsTitle} items={answer.scenarioSpecificWarnings} empty={messages.caseQuestionEntry.emptyWarnings} />
        <AnswerList title={messages.caseQuestionEntry.nextStepsTitle} items={answer.nextSteps} empty={messages.caseQuestionEntry.emptyItems} />
        <Card>
          <CardHeader>
            <CardTitle>{messages.caseQuestionEntry.trackerActionsTitle}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {answer.trackerActions.map((item) => (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700" key={`${item.label}-${item.detail}`}>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <p className="font-semibold text-slate-950">{item.label}</p>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{item.priority}</p>
                </div>
                <p className="mt-2">{item.detail}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function AnswerList({ title, items, empty }: { title: string; items: string[]; empty: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length > 0 ? (
          items.map((item) => (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700" key={item}>
              {item}
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
            {empty}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
