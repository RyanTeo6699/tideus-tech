"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { useLocaleContext } from "@/lib/i18n/client";

export function LogoutButton() {
  return <LogoutButtonWithRedirect />;
}

type LogoutButtonProps = {
  redirectTo?: string;
};

export function LogoutButtonWithRedirect({ redirectTo = "/login" }: LogoutButtonProps = {}) {
  const { locale } = useLocaleContext();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function handleLogout() {
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST"
      });
      const data = (await response.json().catch(() => null)) as { redirectTo?: string } | null;

      startTransition(() => {
        router.push(redirectTo ?? data?.redirectTo ?? "/login");
        router.refresh();
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Button className="w-full sm:w-auto" disabled={isLoading} onClick={handleLogout} variant="outline">
      {isLoading ? (locale === "zh-TW" ? "正在登出..." : "正在退出登录...") : locale === "zh-TW" ? "登出" : "退出登录"}
    </Button>
  );
}
