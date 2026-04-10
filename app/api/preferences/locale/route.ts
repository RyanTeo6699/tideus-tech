import { NextResponse } from "next/server";

import { defaultLocale, isAppLocale, localeCookieName } from "@/lib/i18n/config";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    locale?: string;
  } | null;
  const locale = body?.locale;

  if (!isAppLocale(locale)) {
    return NextResponse.json(
      {
        message: "语言设置无效。"
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
