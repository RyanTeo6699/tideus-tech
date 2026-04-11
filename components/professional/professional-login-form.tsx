"use client";

import Link from "next/link";
import { startTransition, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocaleContext } from "@/lib/i18n/client";
import { pickLocale } from "@/lib/i18n/workspace";
import { cn } from "@/lib/utils";

export function ProfessionalLoginForm() {
  const { locale, messages } = useLocaleContext();
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextHref = searchParams.get("next") || "/professional/dashboard";
  const [values, setValues] = useState({
    email: "",
    password: ""
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "success">("idle");
  const initialMessage = useMemo(
    () =>
      pickLocale(
        locale,
        "登录后可查看专业档案壳、组织骨架和未来审阅/交接工作流占位。",
        "登入後可查看專業檔案殼、組織骨架和未來審閱／交接工作流程占位。"
      ),
    [locale]
  );
  const [message, setMessage] = useState(initialMessage);

  function validate() {
    const nextErrors: Record<string, string> = {};

    if (!/^\S+@\S+\.\S+$/.test(values.email.trim())) {
      nextErrors.email = pickLocale(locale, "请输入有效邮箱地址。", "請輸入有效電子郵件地址。");
    }

    if (values.password.trim().length < 8) {
      nextErrors.password = pickLocale(locale, "密码至少需要 8 个字符。", "密碼至少需要 8 個字元。");
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!validate()) {
      setStatus("error");
      setMessage(pickLocale(locale, "请先修正高亮字段，再继续。", "請先修正高亮欄位，再繼續。"));
      return;
    }

    setStatus("loading");
    setMessage(pickLocale(locale, "正在登录专业端...", "正在登入專業端..."));

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: values.email,
          password: values.password,
          next: nextHref
        })
      });

      const data = (await response.json().catch(() => null)) as {
        message?: string;
        redirectTo?: string;
      } | null;

      if (!response.ok) {
        throw new Error(
          data?.message ||
            pickLocale(locale, "暂时无法登录专业端。", "暫時無法登入專業端。")
        );
      }

      setStatus("success");
      setMessage(
        data?.message ||
          pickLocale(
            locale,
            "专业端入口已打开，正在跳转到专业仪表板。",
            "專業端入口已打開，正在跳轉到專業儀表板。"
          )
      );

      startTransition(() => {
        router.push(data?.redirectTo ?? nextHref);
        router.refresh();
      });
    } catch (error) {
      setStatus("error");
      setMessage(
        error instanceof Error
          ? error.message
          : pickLocale(locale, "暂时无法登录专业端。", "暫時無法登入專業端。")
      );
    }
  }

  return (
    <Card className="border-white/10 bg-white/95 text-slate-950">
      <CardHeader>
        <Badge variant="secondary" className="w-fit">
          {pickLocale(locale, "专业端登录", "專業端登入")}
        </Badge>
        <CardTitle className="text-2xl">{pickLocale(locale, "登录专业仪表板", "登入專業儀表板")}</CardTitle>
        <CardDescription>
          {pickLocale(
            locale,
            "当前只开放专业档案、组织和未来审阅壳层，不开放完整专业工作流。",
            "目前只開放專業檔案、組織和未來審閱殼層，不開放完整專業工作流程。"
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-5" noValidate onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="professional-email">{messages.authForm.emailLabel}</Label>
            <Input
              aria-invalid={Boolean(errors.email)}
              id="professional-email"
              onChange={(event) => setValues((current) => ({ ...current, email: event.target.value }))}
              placeholder={pickLocale(locale, "例如：zhangsan@example.com", "例如：zhangsan@example.com")}
              type="email"
              value={values.email}
            />
            {errors.email ? <p className="text-sm font-medium text-red-600">{errors.email}</p> : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="professional-password">{messages.authForm.passwordLabel}</Label>
            <Input
              aria-invalid={Boolean(errors.password)}
              id="professional-password"
              onChange={(event) => setValues((current) => ({ ...current, password: event.target.value }))}
              placeholder={messages.authForm.passwordPlaceholder}
              type="password"
              value={values.password}
            />
            {errors.password ? <p className="text-sm font-medium text-red-600">{errors.password}</p> : null}
          </div>

          <Button className="w-full" disabled={status === "loading"} type="submit">
            {status === "loading"
              ? pickLocale(locale, "正在登录...", "正在登入...")
              : pickLocale(locale, "进入专业仪表板", "進入專業儀表板")}
          </Button>

          <div
            className={cn("rounded-2xl border p-4 text-sm leading-6", {
              "border-border bg-slate-50 text-slate-700": status === "idle" || status === "loading" || status === "success",
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
            <p className="mt-2">{status === "idle" ? initialMessage : message}</p>
          </div>

          <div className="flex flex-col gap-2 text-sm text-slate-600">
            <Link className="font-semibold text-slate-950 underline underline-offset-4" href="/for-professionals">
              {pickLocale(locale, "先查看专业端定位", "先查看專業端定位")}
            </Link>
            <Link className="font-semibold text-slate-950 underline underline-offset-4" href="/login">
              {pickLocale(locale, "使用消费者入口登录", "使用消費者入口登入")}
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
