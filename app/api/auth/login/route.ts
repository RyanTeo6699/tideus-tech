import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import { getCurrentLocale } from "@/lib/i18n/server";
import { pickLocale } from "@/lib/i18n/workspace";
import { createClient } from "@/lib/supabase/server";

type LoginPayload = {
  email?: string;
  password?: string;
  next?: string;
};

export async function POST(request: Request) {
  const locale = await getCurrentLocale();
  const body = (await request.json().catch(() => null)) as LoginPayload | null;
  const email = body?.email?.trim().toLowerCase();
  const password = body?.password?.trim();
  const next = body?.next?.startsWith("/") ? body.next : "/dashboard";

  if (!email || !password) {
    return NextResponse.json(
      {
        message: pickLocale(locale, "请输入邮箱和密码。", "請輸入電子郵件和密碼。")
      },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    return NextResponse.json(
      {
        message: pickLocale(locale, "邮箱或密码不正确。", "電子郵件或密碼不正確。")
      },
      { status: 400 }
    );
  }

  revalidatePath("/dashboard");
  revalidatePath("/professional/dashboard");

  return NextResponse.json({
    message: pickLocale(locale, "登录成功，正在跳转。", "登入成功，正在跳轉。"),
    redirectTo: next
  });
}
