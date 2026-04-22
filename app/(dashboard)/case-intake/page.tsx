import { redirect } from "next/navigation";

import { CaseIntakeForm } from "@/components/cases/case-intake-form";
import { WorkspaceShell } from "@/components/dashboard/workspace-shell";
import { PlanUpgradeCard } from "@/components/site/plan-upgrade-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buildProfileSummaryFacts } from "@/lib/profile";
import { getCaseIntakeInitialValues } from "@/lib/cases";
import { getUseCaseDefinition } from "@/lib/case-workflows";
import { getLocaleContext } from "@/lib/i18n/server";
import { pickLocale } from "@/lib/i18n/workspace";
import { formatConsumerCaseLimitMessage, getConsumerCaseCreationAccess } from "@/lib/permissions";

type CaseIntakePageProps = {
  searchParams: Promise<{
    useCase?: string;
  }>;
};

export default async function CaseIntakePage({ searchParams }: CaseIntakePageProps) {
  const { useCase: useCaseSlug } = await searchParams;
  const { locale } = await getLocaleContext();
  const useCase = getUseCaseDefinition(useCaseSlug, locale);

  if (!useCase) {
    redirect("/start-case");
  }

  const caseCreationAccess = await getConsumerCaseCreationAccess();

  if (!caseCreationAccess.user) {
    redirect(`/login?next=${encodeURIComponent(`/case-intake?useCase=${useCase.slug}`)}`);
  }

  return (
    <WorkspaceShell
      actions={[
        { href: "/start-case", label: locale === "zh-TW" ? "返回使用情境" : "返回使用场景", variant: "outline" },
        { href: "/dashboard", label: locale === "zh-TW" ? "開啟工作台" : "打开工作台", variant: "outline" }
      ]}
      description={locale === "zh-TW" ? "這份資料收集會建立可保存的案件紀錄，並為後續工作流程提供基礎。" : "这份资料收集会建立可保存的案件记录，并为后续工作流提供基础。"}
      eyebrow={locale === "zh-TW" ? "案件資料收集" : "案件资料收集"}
      title={locale === "zh-TW" ? `${useCase.shortTitle} 資料收集` : `${useCase.shortTitle} 资料收集`}
    >
      {caseCreationAccess.allowed ? (
        <CaseIntakeForm
          initialValues={getCaseIntakeInitialValues(caseCreationAccess.profile, useCase.slug)}
          profileFacts={buildProfileSummaryFacts(caseCreationAccess.profile, locale).slice(0, 5)}
          useCase={useCase}
        />
      ) : (
        <div className="space-y-5">
          <Card className="border-amber-200 bg-amber-50 shadow-none">
            <CardHeader>
              <CardTitle>{pickLocale(locale, "已达到 Free 活跃案件上限", "已達到免費版活躍案件上限")}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm leading-7 text-slate-700">
              {formatConsumerCaseLimitMessage(caseCreationAccess, locale)}
            </CardContent>
          </Card>
          <PlanUpgradeCard
            capability="active_case_slots"
            locale={locale}
            sourceSurface="case-intake-active-case-limit"
            useCase={useCase.slug}
          />
        </div>
      )}
    </WorkspaceShell>
  );
}
