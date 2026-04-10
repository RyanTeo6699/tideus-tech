"use client";

import { startTransition, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { getCaseIntakeFields, type CaseIntakeValues, type UseCaseDefinition } from "@/lib/case-workflows";
import { FormShell } from "@/components/forms/form-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useLocaleContext } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";

type ProfileFact = {
  label: string;
  value: string;
};

type CaseIntakeFormProps = {
  useCase: UseCaseDefinition;
  initialValues: Partial<CaseIntakeValues>;
  profileFacts: ProfileFact[];
};

export function CaseIntakeForm({ useCase, initialValues, profileFacts }: CaseIntakeFormProps) {
  const { locale, messages } = useLocaleContext();
  const router = useRouter();
  const fields = useMemo(() => getCaseIntakeFields(useCase, locale), [locale, useCase]);
  const [values, setValues] = useState<CaseIntakeValues>({
    title: "",
    currentStatus: "",
    currentPermitExpiry: "",
    urgency: "",
    passportValidity: "",
    proofOfFundsStatus: "",
    refusalOrComplianceIssues: "",
    applicationReason: "",
    supportEntityName: "",
    supportEvidenceStatus: "",
    scenarioProgressStatus: "",
    notes: "",
    ...initialValues
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [message, setMessage] = useState(
    locale === "zh-TW"
      ? "這份 intake 會建立可保存的案件，並初始化對應的預期材料清單。"
      : "这份 intake 会建立可保存的案件，并初始化对应的预期材料清单。"
  );

  function validate() {
    const nextErrors: Record<string, string> = {};

    for (const field of fields) {
      const value = values[field.name].trim();

        if (field.required && !value) {
        nextErrors[field.name] = locale === "zh-TW" ? "此欄位為必填。" : "此字段为必填。";
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!validate()) {
      setStatus("error");
      setMessage(locale === "zh-TW" ? "請先修正高亮欄位，再建立案件。" : "请先修正高亮字段，再建立案件。");
      return;
    }

    setStatus("loading");
    setMessage(locale === "zh-TW" ? "正在建立案件工作台..." : "正在建立案件工作台...");

    try {
      const response = await fetch("/api/cases", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          useCase: useCase.slug,
          ...values
        })
      });

      const data = (await response.json().catch(() => null)) as
        | {
            message?: string;
            caseId?: string;
            nextHref?: string;
          }
        | null;

      if (!response.ok || !data?.caseId || !data.nextHref) {
        throw new Error(data?.message || (locale === "zh-TW" ? "暫時無法建立案件。" : "暂时无法建立案件。"));
      }

      const nextHref = data.nextHref;

      startTransition(() => {
        router.push(nextHref);
        router.refresh();
      });
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : locale === "zh-TW" ? "暫時無法建立案件。" : "暂时无法建立案件。");
    }
  }

  return (
    <FormShell
      aside={
        <div className="space-y-6">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">{locale === "zh-TW" ? "接下來會發生什麼" : "接下来会发生什么"}</p>
            <div className="mt-4 space-y-3">
              {[
                locale === "zh-TW" ? "案件紀錄會建立並保存到你的工作台。" : "案件记录会建立并保存到你的工作台。",
                locale === "zh-TW" ? "可選備註會在可能時被規範化為結構化工作流程訊號。" : "可选备注会在可能时被规范化为结构化工作流信号。",
                locale === "zh-TW" ? "系統會為這個工作流程初始化預期材料清單。" : "系统会为这个工作流初始化预期材料清单。",
                locale === "zh-TW" ? "下一步會直接進入材料審查。" : "下一步会直接进入材料审查。"
              ].map((item) => (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700" key={item}>
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-slate-900">
            <p className="font-semibold uppercase tracking-[0.18em] text-emerald-800">{locale === "zh-TW" ? "已保存的資料檔案脈絡" : "已保存的资料档案上下文"}</p>
            <p className="mt-2">
              {profileFacts.length > 0
                ? locale === "zh-TW"
                  ? "已保存的資料檔案事實會直接幫助塑造這份 intake，讓工作流程不需要重複詢問同樣的核心背景。"
                  : "已保存的资料档案事实会直接帮助塑造这份 intake，让工作流不需要重复询问同样的核心背景。"
                : locale === "zh-TW"
                  ? "沒有保存資料檔案也可以完成案件，但資料檔案頁面能讓未來的 intake 更短。"
                  : "没有保存资料档案也可以完成案件，但资料档案页面能让未来的 intake 更短。"}
            </p>
          </div>

          {profileFacts.length > 0 ? (
            <div className="space-y-3">
              {profileFacts.map((fact) => (
                <div className="rounded-2xl border border-slate-200 bg-white p-4" key={fact.label}>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{fact.label}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-900">{fact.value}</p>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      }
      description={useCase.intakeDescription}
      eyebrow={useCase.eyebrow}
      title={useCase.intakeTitle}
    >
      <form className="space-y-5" noValidate onSubmit={handleSubmit}>
        <div className="grid gap-5 md:grid-cols-2">
          {fields.map((field) => {
            const error = errors[field.name];

            return (
              <div className={cn("space-y-2", field.wide ? "md:col-span-2" : null)} key={field.name}>
                <Label htmlFor={field.name}>{field.label}</Label>
                {field.type === "textarea" ? (
                  <Textarea
                    aria-invalid={Boolean(error)}
                    id={field.name}
                    onChange={(event) => setValues((current) => ({ ...current, [field.name]: event.target.value }))}
                    placeholder={field.placeholder}
                    value={values[field.name]}
                  />
                ) : field.type === "select" ? (
                  <Select
                    aria-invalid={Boolean(error)}
                    id={field.name}
                    onChange={(event) => setValues((current) => ({ ...current, [field.name]: event.target.value }))}
                    value={values[field.name]}
                  >
                    <option value="">{messages.common.selectOne}</option>
                    {field.options?.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                ) : (
                  <Input
                    aria-invalid={Boolean(error)}
                    id={field.name}
                    onChange={(event) => setValues((current) => ({ ...current, [field.name]: event.target.value }))}
                    placeholder={field.placeholder}
                    type={field.type === "date" ? "date" : "text"}
                    value={values[field.name]}
                  />
                )}
                {field.helper ? <p className="text-sm text-muted-foreground">{field.helper}</p> : null}
                {error ? <p className="text-sm font-medium text-destructive">{error}</p> : null}
              </div>
            );
          })}
        </div>

        <div
          className={cn("rounded-2xl border p-4 text-sm leading-6", {
            "border-slate-200 bg-slate-50 text-slate-700": status === "idle" || status === "loading",
            "border-red-200 bg-red-50 text-red-700": status === "error"
          })}
        >
          <p className="font-semibold uppercase tracking-[0.18em]">
            {status === "loading" ? messages.common.working : status === "error" ? messages.common.error : messages.common.ready}
          </p>
          <p className="mt-2">{message}</p>
        </div>

        <Button disabled={status === "loading"} type="submit">
          {status === "loading"
            ? locale === "zh-TW"
              ? "正在建立案件..."
              : "正在建立案件..."
            : locale === "zh-TW"
              ? "保存 intake 並繼續"
              : "保存 intake 并继续"}
        </Button>
      </form>
    </FormShell>
  );
}
