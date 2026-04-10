"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { appLocales, type AppLocale } from "@/lib/i18n/config";
import { useLocaleContext } from "@/lib/i18n/client";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

type LanguageSwitcherProps = {
  compact?: boolean;
};

export function LanguageSwitcher({ compact = false }: LanguageSwitcherProps) {
  const router = useRouter();
  const { locale, messages } = useLocaleContext();
  const [isSaving, setIsSaving] = useState(false);

  async function handleChange(nextLocale: AppLocale) {
    if (nextLocale === locale) {
      return;
    }

    setIsSaving(true);

    try {
      await fetch("/api/preferences/locale", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          locale: nextLocale
        })
      });

      router.refresh();
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className={compact ? "flex items-center gap-2" : "space-y-2"}>
      {!compact ? <Label htmlFor="language-switcher">{messages.switcher.label}</Label> : null}
      <div className="flex items-center gap-2">
        {compact ? <span className="text-xs text-muted-foreground">{messages.switcher.label}</span> : null}
        <Select
          className={compact ? "h-10 min-w-[7.75rem] rounded-xl px-3 py-2 text-xs" : undefined}
          disabled={isSaving}
          id="language-switcher"
          onChange={(event) => void handleChange(event.target.value as AppLocale)}
          value={locale}
        >
          {appLocales.map((item) => (
            <option key={item} value={item}>
              {messages.languageNames[item]}
            </option>
          ))}
        </Select>
      </div>
      {!compact && isSaving ? <p className="text-sm text-muted-foreground">{messages.switcher.saving}</p> : null}
    </div>
  );
}
