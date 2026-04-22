import { NextResponse } from "next/server";

import { getCurrentLocale } from "@/lib/i18n/server";
import { pickLocale } from "@/lib/i18n/workspace";
import { ensureProfile } from "@/lib/profile-server";
import { createConsumerProCheckoutSession, hasStripeBillingConfig } from "@/lib/server/billing";
import { createClient } from "@/lib/supabase/server";

type CheckoutRequestBody = {
  sourceSurface?: unknown;
  gatedCapability?: unknown;
  caseId?: unknown;
  useCase?: unknown;
};

export async function POST(request: Request) {
  const locale = await getCurrentLocale();
  const body = (await request.json().catch(() => null)) as CheckoutRequestBody | null;
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      {
        message: pickLocale(locale, "请先登录，再开通 Pro。", "請先登入，再開通 Pro。"),
        loginUrl: `/login?next=${encodeURIComponent("/pricing")}`
      },
      { status: 401 }
    );
  }

  if (!hasStripeBillingConfig()) {
    return NextResponse.json(
      {
        message: pickLocale(
          locale,
          "当前结账配置尚未完成。请稍后重试或联系 Tideus 支持。",
          "目前結帳設定尚未完成。請稍後重試或聯絡 Tideus 支援。"
        )
      },
      { status: 500 }
    );
  }

  await ensureProfile(supabase, user);

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profileError) {
    return NextResponse.json(
      {
        message: pickLocale(locale, "暂时无法读取账户方案资料。", "暫時無法讀取帳戶方案資料。")
      },
      { status: 500 }
    );
  }

  try {
    const session = await createConsumerProCheckoutSession({
      user,
      profile,
      requestUrl: request.url,
      metadata: {
        sourceSurface: readString(body?.sourceSurface) || "unknown",
        gatedCapability: readString(body?.gatedCapability),
        caseId: readString(body?.caseId),
        useCase: readString(body?.useCase)
      }
    });

    if (!session.url) {
      return NextResponse.json(
        {
          message: pickLocale(locale, "暂时无法创建结账链接。", "暫時無法建立結帳連結。")
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      checkoutUrl: session.url
    });
  } catch (error) {
    console.error("Unable to create Pro checkout session", error);

    return NextResponse.json(
      {
        message: pickLocale(locale, "暂时无法开始 Pro 结账。", "暫時無法開始 Pro 結帳。")
      },
      { status: 500 }
    );
  }
}

function readString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}
