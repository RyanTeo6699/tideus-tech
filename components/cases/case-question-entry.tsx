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

const copy = {
  initialMessage: "选择场景，输入一个具体案件问题。回答会按工作流输出，不做泛化聊天。",
  tooShortQuestion: "请先输入至少 8 个字符的问题。",
  generating: "正在读取场景知识并生成结构化回答...",
  generateError: "暂时无法生成回答。",
  answerReady: "结构化回答已生成。可以保存到工作台继续推进。",
  saveBeforeGenerate: "请先生成回答，再保存到工作台。",
  creatingWorkspace: "正在创建或更新工作台记录...",
  signInToSave: "登录后保存到工作台",
  saveError: "暂时无法保存到工作台。",
  savedWorkspace: "已保存到工作台。",
  taskBadge: "任务入口",
  title: "问一个案件问题",
  description: "围绕当前支持场景提问，得到摘要、公开信息提示和下一步动作。",
  scenarioLabel: "场景",
  questionLabel: "问题",
  questionPlaceholder: "例如：我的访客身份 30 天内到期，但资金证明还不完整，应该先补什么？",
  questionHelper: "越具体越好。可以写到期时间、当前身份、已准备材料和你最担心的风险。",
  working: "处理中",
  error: "错误",
  ready: "已就绪",
  saved: "已保存",
  actionNeeded: "需要处理",
  caseQuestionLabel: "案件问题",
  generatingButton: "正在生成...",
  generateButton: "生成结构化回答",
  workspaceTitle: "把回答变成工作流",
  workspaceDescription: "保存后会进入案件工作台，可继续材料、审查、导出或交接。",
  openSavedWorkspace: "打开已保存工作台",
  emptyTitle: "先生成一个回答",
  emptyDescription: "右侧会显示回答摘要、重要性、公开信息提示、下一步和可保存动作。",
  structuredAnswerTitle: "回答摘要",
  whyMattersTitle: "为什么重要",
  publicGuidanceTitle: "相关公开信息提示",
  scenarioWarningsTitle: "场景提醒",
  nextStepsTitle: "下一步",
  trackerActionsTitle: "建议写入工作台的动作",
  emptyItems: "当前没有可显示的项目。",
  emptyWarnings: "当前没有额外场景提醒。"
};

export function CaseQuestionEntry({ useCases }: CaseQuestionEntryProps) {
  const router = useRouter();
  const [useCase, setUseCase] = useState<SupportedUseCaseSlug>(useCases[0]?.slug ?? "visitor-record");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<CaseQuestionAnswer | null>(null);
  const [askStatus, setAskStatus] = useState<AskStatus>("idle");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [message, setMessage] = useState(copy.initialMessage);
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
      setMessage(copy.tooShortQuestion);
      return;
    }

    setAskStatus("loading");
    setMessage(copy.generating);

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
        throw new Error(data?.message || copy.generateError);
      }

      setAnswer(data.answer);
      setAskStatus("success");
      setMessage(copy.answerReady);
    } catch (error) {
      setAskStatus("error");
      setMessage(error instanceof Error ? error.message : copy.generateError);
    }
  }

  async function handleSave(action: CaseQuestionSaveAction) {
    if (!answer) {
      setSaveStatus("error");
      setSaveMessage(copy.saveBeforeGenerate);
      return;
    }

    setSaveStatus("loading");
    setSaveMessage(copy.creatingWorkspace);
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
        throw new Error(data?.message || copy.signInToSave);
      }

      if (!response.ok || !data?.caseId || typeof data.nextHref !== "string") {
        throw new Error(data?.message || copy.saveError);
      }

      const savedNextHref = data.nextHref;

      setNextHref(savedNextHref);
      setSaveStatus("success");
      setSaveMessage(copy.savedWorkspace);

      if (action === "continue-in-case-workspace") {
        startTransition(() => {
          router.push(savedNextHref);
          router.refresh();
        });
      }
    } catch (error) {
      setSaveStatus("error");
      setSaveMessage(error instanceof Error ? error.message : copy.saveError);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
      <Card className="h-fit">
        <CardHeader>
          <Badge variant="secondary" className="w-fit">
            {copy.taskBadge}
          </Badge>
          <CardTitle className="text-3xl">{copy.title}</CardTitle>
          <CardDescription>{copy.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-5" onSubmit={handleAsk}>
            <div className="space-y-2">
              <Label htmlFor="case-question-use-case">{copy.scenarioLabel}</Label>
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
              <Label htmlFor="case-question">{copy.questionLabel}</Label>
              <Textarea
                id="case-question"
                onChange={(event) => {
                  setQuestion(event.target.value);
                  if (answer) {
                    resetSavedAnswer();
                  }
                }}
                placeholder={copy.questionPlaceholder}
                rows={7}
                value={question}
              />
              <p className="text-sm leading-6 text-muted-foreground">{copy.questionHelper}</p>
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
                  ? copy.working
                  : askStatus === "error"
                    ? copy.error
                    : askStatus === "success"
                      ? copy.ready
                      : copy.caseQuestionLabel}
              </p>
              <p className="mt-2">{message}</p>
            </div>

            <Button disabled={askStatus === "loading"} type="submit">
              {askStatus === "loading" ? copy.generatingButton : copy.generateButton}
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
                <CardTitle>{copy.workspaceTitle}</CardTitle>
                <CardDescription>{copy.workspaceDescription}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Button disabled={saveStatus === "loading"} onClick={() => void handleSave("save-to-workspace")} type="button">
                    保存到工作台
                  </Button>
                  <Button
                    disabled={saveStatus === "loading"}
                    onClick={() => void handleSave("generate-checklist")}
                    type="button"
                    variant="outline"
                  >
                    生成清单
                  </Button>
                  <Button
                    disabled={saveStatus === "loading"}
                    onClick={() => void handleSave("start-tracking")}
                    type="button"
                    variant="outline"
                  >
                    开始跟踪
                  </Button>
                  <Button
                    disabled={saveStatus === "loading"}
                    onClick={() => void handleSave("continue-in-case-workspace")}
                    type="button"
                    variant="outline"
                  >
                    继续到案件工作台
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
                        ? copy.working
                        : saveStatus === "success"
                          ? copy.saved
                          : copy.actionNeeded}
                    </p>
                    <p className="mt-2">{saveMessage}</p>
                    {loginHref ? (
                      <Link className="mt-3 inline-flex text-sm font-semibold text-slate-950 underline" href={loginHref}>
                        {copy.signInToSave}
                      </Link>
                    ) : null}
                    {nextHref ? (
                      <Link className="mt-3 inline-flex text-sm font-semibold text-slate-950 underline" href={nextHref}>
                        {copy.openSavedWorkspace}
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
              <CardTitle>{copy.emptyTitle}</CardTitle>
              <CardDescription>{copy.emptyDescription}</CardDescription>
            </CardHeader>
          </Card>
        )}
      </div>
    </div>
  );
}

function StructuredAnswer({ answer }: { answer: CaseQuestionAnswer }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{copy.structuredAnswerTitle}</CardTitle>
          <CardDescription>{answer.summary}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-7 text-slate-700">
            <p className="font-semibold uppercase tracking-[0.18em] text-slate-500">{copy.whyMattersTitle}</p>
            <p className="mt-2">{answer.whyThisMatters}</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <AnswerList title={copy.publicGuidanceTitle} items={answer.supportingContextNotes} empty={copy.emptyItems} />
        <AnswerList title={copy.nextStepsTitle} items={answer.nextSteps} empty={copy.emptyItems} />
        <AnswerList title={copy.scenarioWarningsTitle} items={answer.scenarioSpecificWarnings} empty={copy.emptyWarnings} />
        <Card>
          <CardHeader>
            <CardTitle>{copy.trackerActionsTitle}</CardTitle>
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
