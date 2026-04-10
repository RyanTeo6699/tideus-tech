"use client";

import { Button } from "@/components/ui/button";
import { useLocaleContext } from "@/lib/i18n/client";

export function PrintReviewButton() {
  const { locale } = useLocaleContext();

  return (
    <Button onClick={() => window.print()} type="button" variant="outline">
      {locale === "zh-TW" ? "列印或另存 PDF" : "打印或另存为 PDF"}
    </Button>
  );
}
