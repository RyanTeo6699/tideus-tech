import { Suspense } from "react";
import { redirect } from "next/navigation";

import { ProfessionalLoginForm } from "@/components/professional/professional-login-form";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { getLocaleContext } from "@/lib/i18n/server";
import { pickLocale } from "@/lib/i18n/workspace";

export default async function ProfessionalLoginPage() {
  const supabase = await createClient();
  const { locale } = await getLocaleContext();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/professional/dashboard");
  }

  return (
    <div className="grid w-full gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
      <div className="max-w-xl">
        <Badge variant="inverse" className="mb-6">
          {pickLocale(locale, "专业端入口", "專業端入口")}
        </Badge>
        <h1 className="font-serif text-5xl leading-tight">
          {pickLocale(locale, "登录到专业端，接收并查看交接审阅请求。", "登入到專業端，接收並查看交接審閱請求。")}
        </h1>
        <p className="mt-6 text-lg leading-8 text-slate-300">
          {pickLocale(
            locale,
            "当前专业端开放身份、组织、交接队列、交接详情和基础状态处理。它不会在这轮扩展成完整客户管理后台。",
            "目前專業端開放身分、組織、交接佇列、交接詳情和基礎狀態處理。它不會在這輪擴展成完整客戶管理後台。"
          )}
        </p>
        <div className="mt-10 space-y-3">
          {[
            pickLocale(locale, "查看专业身份与开通状态。", "查看專業身分與開通狀態。"),
            pickLocale(locale, "查看所属组织与成员角色关系。", "查看所屬組織與成員角色關係。"),
            pickLocale(locale, "接收 C 端交接请求并查看结构化交接包。", "接收 C 端交接請求並查看結構化交接包。")
          ].map((item) => (
            <div className="rounded-[24px] border border-white/10 bg-white/5 p-4 text-sm leading-6 text-slate-200" key={item}>
              {item}
            </div>
          ))}
        </div>
      </div>

      <Suspense fallback={<ProfessionalLoginFallback />}>
        <ProfessionalLoginForm />
      </Suspense>
    </div>
  );
}

function ProfessionalLoginFallback() {
  return <div className="min-h-[30rem] rounded-[28px] border border-white/10 bg-white/10" />;
}
