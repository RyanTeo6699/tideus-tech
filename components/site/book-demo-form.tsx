"use client";

import { useMemo, useState } from "react";

import { getLeadRequestTypeOptions, getLeadStageOptions, getLeadUseCaseOptions } from "@/lib/lead-requests";
import { useLocaleContext } from "@/lib/i18n/client";
import { pickLocale } from "@/lib/i18n/workspace";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type BookDemoFormProps = {
  initialEmail?: string;
};

export function BookDemoForm({ initialEmail = "" }: BookDemoFormProps) {
  const { locale, messages } = useLocaleContext();
  const useCaseOptions = useMemo(() => getLeadUseCaseOptions(locale), [locale]);
  const stageOptions = useMemo(() => getLeadStageOptions(locale), [locale]);
  const requestTypeOptions = useMemo(() => getLeadRequestTypeOptions(locale), [locale]);
  const [values, setValues] = useState({
    email: initialEmail,
    useCaseInterest: "",
    currentStage: "",
    requestType: "",
    note: ""
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "success">("idle");
  const [message, setMessage] = useState(
    pickLocale(
      locale,
      "使用此表单预约演示、登记早期体验意向，或同时完成这两件事。",
      "使用此表單預約演示、登記早期體驗意向，或同時完成這兩件事。"
    )
  );

  function validate() {
    const nextErrors: Record<string, string> = {};

    if (!/^\S+@\S+\.\S+$/.test(values.email.trim())) {
      nextErrors.email = pickLocale(locale, "请输入有效邮箱地址。", "請輸入有效電子郵件地址。");
    }

    if (!values.useCaseInterest) {
      nextErrors.useCaseInterest = pickLocale(locale, "请选择场景。", "請選擇場景。");
    }

    if (!values.currentStage) {
      nextErrors.currentStage = pickLocale(locale, "请选择当前阶段。", "請選擇目前階段。");
    }

    if (!values.requestType) {
      nextErrors.requestType = pickLocale(locale, "请选择请求类型。", "請選擇請求類型。");
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!validate()) {
      setStatus("error");
      setMessage(pickLocale(locale, "请先修正高亮字段，再发送请求。", "請先修正高亮欄位，再送出請求。"));
      return;
    }

    setStatus("loading");
    setMessage(pickLocale(locale, "正在发送请求...", "正在送出請求..."));

    try {
      const response = await fetch("/api/lead-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(values)
      });

      const data = (await response.json().catch(() => null)) as { message?: string } | null;

      if (!response.ok) {
        throw new Error(data?.message || pickLocale(locale, "暂时无法发送请求。", "暫時無法送出請求。"));
      }

      setStatus("success");
      setMessage(data?.message || pickLocale(locale, "已收到请求。", "已收到請求。"));
      setValues((current) => ({
        ...current,
        note: "",
        email: current.email.trim()
      }));
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : pickLocale(locale, "暂时无法发送请求。", "暫時無法送出請求。"));
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{pickLocale(locale, "预约演示或申请早期体验", "預約演示或申請早期體驗")}</CardTitle>
        <CardDescription>
          {pickLocale(
            locale,
            "Tideus 仍保持聚焦。这个表单会把启动沟通限制在当前支持的案件工作流内。",
            "Tideus 仍保持聚焦。這個表單會把啟動溝通限制在目前支援的案件工作流內。"
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-5" noValidate onSubmit={handleSubmit}>
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="lead-email">{pickLocale(locale, "邮箱", "電子郵件")}</Label>
              <Input
                aria-invalid={Boolean(errors.email)}
                id="lead-email"
                onChange={(event) => setValues((current) => ({ ...current, email: event.target.value }))}
                placeholder="you@example.com"
                type="email"
                value={values.email}
              />
              {errors.email ? <p className="text-sm font-medium text-destructive">{errors.email}</p> : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lead-use-case">{pickLocale(locale, "感兴趣的场景", "感興趣的場景")}</Label>
              <Select
                aria-invalid={Boolean(errors.useCaseInterest)}
                id="lead-use-case"
                onChange={(event) => setValues((current) => ({ ...current, useCaseInterest: event.target.value }))}
                value={values.useCaseInterest}
              >
                <option value="">{messages.common.selectOne}</option>
                {useCaseOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
              {errors.useCaseInterest ? <p className="text-sm font-medium text-destructive">{errors.useCaseInterest}</p> : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lead-stage">{pickLocale(locale, "当前阶段", "目前階段")}</Label>
              <Select
                aria-invalid={Boolean(errors.currentStage)}
                id="lead-stage"
                onChange={(event) => setValues((current) => ({ ...current, currentStage: event.target.value }))}
                value={values.currentStage}
              >
                <option value="">{messages.common.selectOne}</option>
                {stageOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
              {errors.currentStage ? <p className="text-sm font-medium text-destructive">{errors.currentStage}</p> : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lead-request-type">{pickLocale(locale, "请求类型", "請求類型")}</Label>
              <Select
                aria-invalid={Boolean(errors.requestType)}
                id="lead-request-type"
                onChange={(event) => setValues((current) => ({ ...current, requestType: event.target.value }))}
                value={values.requestType}
              >
                <option value="">{messages.common.selectOne}</option>
                {requestTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
              {errors.requestType ? <p className="text-sm font-medium text-destructive">{errors.requestType}</p> : null}
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="lead-note">{pickLocale(locale, "可选备注", "可選備註")}</Label>
              <Textarea
                id="lead-note"
                onChange={(event) => setValues((current) => ({ ...current, note: event.target.value }))}
                placeholder={pickLocale(
                  locale,
                  "可补充说明时间要求、当前包件问题，或你希望在演示中看到的内容。",
                  "可補充說明時間需求、目前包件問題，或你希望在演示中看到的內容。"
                )}
                value={values.note}
              />
            </div>
          </div>

          <div
            className={cn("rounded-2xl border p-4 text-sm leading-6", {
              "border-slate-200 bg-slate-50 text-slate-700": status === "idle" || status === "loading",
              "border-emerald-200 bg-emerald-50 text-slate-900": status === "success",
              "border-red-200 bg-red-50 text-red-700": status === "error"
            })}
          >
            <p className="font-semibold uppercase tracking-[0.18em]">
              {status === "idle"
                ? messages.common.ready
                : status === "loading"
                  ? messages.common.working
                  : status === "success"
                    ? messages.common.saved
                    : messages.common.error}
            </p>
            <p className="mt-2">{message}</p>
          </div>

          <Button disabled={status === "loading"} type="submit">
            {status === "loading" ? pickLocale(locale, "发送中...", "傳送中...") : pickLocale(locale, "发送请求", "送出請求")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
