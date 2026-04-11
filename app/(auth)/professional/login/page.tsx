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
          {pickLocale(locale, "登录到专业端外壳，准备后续审阅与交接流程。", "登入到專業端外殼，準備後續審閱與交接流程。")}
        </h1>
        <p className="mt-6 text-lg leading-8 text-slate-300">
          {pickLocale(
            locale,
            "当前专业端只开放最小壳层：专业档案、组织结构和未来工作流入口。它不会在这轮扩展成完整后台。",
            "目前專業端只開放最小殼層：專業檔案、組織結構和未來工作流程入口。它不會在這輪擴展成完整後台。"
          )}
        </p>
        <div className="mt-10 space-y-3">
          {[
            pickLocale(locale, "查看专业身份与开通状态。", "查看專業身分與開通狀態。"),
            pickLocale(locale, "查看所属组织与成员角色关系。", "查看所屬組織與成員角色關係。"),
            pickLocale(locale, "为未来案件审阅和交接队列预留统一入口。", "為未來案件審閱和交接佇列預留統一入口。")
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
