import { notFound, redirect } from "next/navigation";

import { CaseMaterialsForm } from "@/components/cases/case-materials-form";
import { WorkspaceShell } from "@/components/dashboard/workspace-shell";
import { getCaseDetail } from "@/lib/cases";
import { getUseCaseDefinition } from "@/lib/case-workflows";
import { getCurrentLocale } from "@/lib/i18n/server";
import { getWorkspaceCopy } from "@/lib/i18n/workspace";

type UploadMaterialsPageProps = {
  params: Promise<{
    caseId: string;
  }>;
};

export default async function UploadMaterialsPage({ params }: UploadMaterialsPageProps) {
  const { caseId } = await params;
  const detail = await getCaseDetail(caseId, {
    resumeSource: "materials"
  });
  const locale = await getCurrentLocale();
  const copy = getWorkspaceCopy(locale);

  if (!detail.user) {
    redirect(`/login?next=${encodeURIComponent(`/upload-materials/${caseId}`)}`);
  }

  if (!detail.caseRecord) {
    notFound();
  }

  const useCase = getUseCaseDefinition(detail.caseRecord.use_case_slug, locale);

  return (
    <WorkspaceShell
      actions={[
        { href: "/dashboard/cases", label: copy.actions.backToCases, variant: "outline" },
        { href: `/dashboard/cases/${caseId}`, label: copy.actions.viewCase, variant: "outline" }
      ]}
      description={copy.materials.description}
      eyebrow={copy.shell.materialsEyebrow}
      title={useCase?.materialsTitle || copy.materials.title}
    >
      <CaseMaterialsForm
        caseId={caseId}
        caseTitle={detail.caseRecord.title}
        documents={detail.documents}
        useCaseTitle={useCase?.shortTitle || detail.caseRecord.use_case_slug}
      />
    </WorkspaceShell>
  );
}
