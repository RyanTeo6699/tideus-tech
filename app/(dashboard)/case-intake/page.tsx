import { redirect } from "next/navigation";

import { CaseIntakeForm } from "@/components/cases/case-intake-form";
import { WorkspaceShell } from "@/components/dashboard/workspace-shell";
import { buildProfileSummaryFacts } from "@/lib/profile";
import { getCurrentProfileContext } from "@/lib/profile-server";
import { getCaseIntakeInitialValues } from "@/lib/cases";
import { getUseCaseDefinition } from "@/lib/case-workflows";
import { getLocaleContext } from "@/lib/i18n/server";

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

  const { user, profile } = await getCurrentProfileContext();

  if (!user) {
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
      <CaseIntakeForm
        initialValues={getCaseIntakeInitialValues(profile, useCase.slug)}
        profileFacts={buildProfileSummaryFacts(profile, locale).slice(0, 5)}
        useCase={useCase}
      />
    </WorkspaceShell>
  );
}
