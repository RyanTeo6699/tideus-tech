export const appLocales = ["zh-CN", "zh-TW"] as const;

export type AppLocale = (typeof appLocales)[number];

export const defaultLocale: AppLocale = "zh-CN";
export const localeCookieName = "tideus-locale";

export function isAppLocale(value: string | null | undefined): value is AppLocale {
  return appLocales.includes(value as AppLocale);
}
