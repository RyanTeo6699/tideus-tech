"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

export function LogoutButton() {
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
        router.push(data?.redirectTo ?? "/login");
        router.refresh();
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Button className="w-full sm:w-auto" disabled={isLoading} onClick={handleLogout} variant="outline">
      {isLoading ? "Signing out..." : "Sign out"}
    </Button>
  );
}
