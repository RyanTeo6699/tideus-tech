import { NextResponse } from "next/server";

import { getCurrentLocale } from "@/lib/i18n/server";
import { pickLocale } from "@/lib/i18n/workspace";
import { createClient } from "@/lib/supabase/server";

type SignupPayload = {
  fullName?: string;
  email?: string;
  password?: string;
  next?: string;
};

export async function POST(request: Request) {
  const locale = await getCurrentLocale();
  const body = (await request.json().catch(() => null)) as SignupPayload | null;
  const fullName = body?.fullName?.trim();
  const email = body?.email?.trim().toLowerCase();
  const password = body?.password?.trim();
  const next = body?.next?.startsWith("/") ? body.next : "/dashboard";

  if (!fullName || !email || !password) {
    return NextResponse.json(
      {
        message: pickLocale(locale, "请完整填写必填字段。", "請完整填寫必填欄位。")
      },
      { status: 400 }
    );
  }

  const origin = process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin;
  const emailRedirectTo = new URL("/auth/callback", origin);
  emailRedirectTo.searchParams.set("next", next);

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName
      },
      emailRedirectTo: emailRedirectTo.toString()
    }
  });

  if (error) {
    return NextResponse.json(
      {
        message: error.message.toLowerCase().includes("already")
          ? pickLocale(locale, "该邮箱已注册，请直接登录。", "此電子郵件已註冊，請直接登入。")
          : pickLocale(locale, "暂时无法创建账户。", "暫時無法建立帳戶。")
      },
      { status: 400 }
    );
  }

  if (data.session) {
    return NextResponse.json({
      message: pickLocale(locale, "账户已创建，正在跳转。", "帳戶已建立，正在跳轉。"),
      redirectTo: next
    });
  }

  return NextResponse.json({
    message: pickLocale(locale, "账户已创建。请先查收邮件并完成确认后再登录。", "帳戶已建立。請先查收電子郵件並完成確認後再登入。"),
    requiresEmailConfirmation: true
  });
}
