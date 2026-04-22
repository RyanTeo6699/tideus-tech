"use client";

import type { ReactNode } from "react";
import { useState } from "react";

import { Button, type ButtonProps } from "@/components/ui/button";
import type { AppLocale } from "@/lib/i18n/config";
import { pickLocale } from "@/lib/i18n/workspace";

type ProCheckoutButtonProps = {
  locale: AppLocale;
  sourceSurface: string;
  gatedCapability?: string | null;
  caseId?: string | null;
  useCase?: string | null;
  children: ReactNode;
  className?: string;
  size?: ButtonProps["size"];
  variant?: ButtonProps["variant"];
};

type CheckoutStartResponse = {
  checkoutUrl?: string;
  loginUrl?: string;
  message?: string;
};

export function ProCheckoutButton({
  locale,
  sourceSurface,
  gatedCapability = null,
  caseId = null,
  useCase = null,
  children,
  className,
  size = "sm",
  variant = "default"
}: ProCheckoutButtonProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [message, setMessage] = useState("");

  async function startCheckout() {
    setStatus("loading");
    setMessage("");

    let response: Response;
    let data: CheckoutStartResponse | null = null;

    try {
      response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          sourceSurface,
          gatedCapability,
          caseId,
          useCase
        })
      });
      data = (await response.json().catch(() => null)) as CheckoutStartResponse | null;
    } catch (error) {
      console.error("Unable to start Pro checkout", error);
      setStatus("error");
      setMessage(pickLocale(locale, "暂时无法连接结账服务。请稍后重试。", "暫時無法連接結帳服務。請稍後重試。"));
      return;
    }

    if (response.status === 401 && data?.loginUrl) {
      window.location.assign(data.loginUrl);
      return;
    }

    if (!response.ok || !data?.checkoutUrl) {
      setStatus("error");
      setMessage(data?.message || pickLocale(locale, "暂时无法开始 Pro 结账。", "暫時無法開始 Pro 結帳。"));
      return;
    }

    window.location.assign(data.checkoutUrl);
  }

  return (
    <div className="space-y-2">
      <Button className={className} disabled={status === "loading"} onClick={() => void startCheckout()} size={size} variant={variant}>
        {status === "loading" ? pickLocale(locale, "正在前往结账...", "正在前往結帳...") : children}
      </Button>
      {message ? <p className="text-sm leading-6 text-red-700">{message}</p> : null}
    </div>
  );
}
