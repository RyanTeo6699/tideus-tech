"use client";

import { createContext, useContext, type ReactNode } from "react";

import type { AppLocale } from "@/lib/i18n/config";
import type { AppMessages } from "@/lib/i18n/messages";

type LocaleContextValue = {
  locale: AppLocale;
  messages: AppMessages;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({
  children,
  locale,
  messages
}: LocaleContextValue & {
  children: ReactNode;
}) {
  return <LocaleContext.Provider value={{ locale, messages }}>{children}</LocaleContext.Provider>;
}

export function useLocaleContext() {
  const context = useContext(LocaleContext);

  if (!context) {
    throw new Error("useLocaleContext must be used inside LocaleProvider.");
  }

  return context;
}
