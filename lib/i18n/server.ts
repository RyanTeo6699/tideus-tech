import { cookies } from "next/headers";

import { defaultLocale, isAppLocale, localeCookieName, type AppLocale } from "@/lib/i18n/config";
import { getAppMessages } from "@/lib/i18n/messages";

export async function getCurrentLocale(): Promise<AppLocale> {
  const cookieStore = await cookies();
  const locale = cookieStore.get(localeCookieName)?.value;
  return isAppLocale(locale) ? locale : defaultLocale;
}

export async function getLocaleContext() {
  const locale = await getCurrentLocale();
  return {
    locale,
    messages: getAppMessages(locale)
  };
}
