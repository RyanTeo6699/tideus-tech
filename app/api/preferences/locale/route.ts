import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { defaultLocale, isAppLocale, localeCookieName } from "@/lib/i18n/config";
import { pickLocale } from "@/lib/i18n/workspace";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    locale?: string;
  } | null;
  const locale = body?.locale;
  const cookieStore = await cookies();
  const savedLocale = cookieStore.get(localeCookieName)?.value;
  const currentLocale = isAppLocale(savedLocale) ? savedLocale : defaultLocale;

  if (!isAppLocale(locale)) {
    return NextResponse.json(
      {
        message: pickLocale(currentLocale, "语言设置无效。", "語言設定無效。")
      },
      { status: 400 }
    );
  }

  const response = NextResponse.json({
    locale
  });

  response.cookies.set(localeCookieName, locale ?? defaultLocale, {
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365
  });

  return response;
}
