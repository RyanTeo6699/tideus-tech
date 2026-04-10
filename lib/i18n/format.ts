import { defaultLocale, type AppLocale } from "@/lib/i18n/config";

export function formatAppDate(value: string, locale: AppLocale = defaultLocale) {
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric"
  }).format(new Date(value));
}

export function formatAppDateTime(value: string, locale: AppLocale = defaultLocale) {
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}
