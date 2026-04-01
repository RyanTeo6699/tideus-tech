import { notFound, redirect } from "next/navigation";

import { CaseMaterialsForm } from "@/components/cases/case-materials-form";
import { WorkspaceShell } from "@/components/dashboard/workspace-shell";
import { getCaseDetail } from "@/lib/cases";
import { getUseCaseDefinition } from "@/lib/case-workflows";

type UploadMaterialsPageProps = {
  params: Promise<{
    caseId: string;
  }>;
};

export default async function UploadMaterialsPage({ params }: UploadMaterialsPageProps) {
  const { caseId } = await params;
  const detail = await getCaseDetail(caseId);

  if (!detail.user) {
    redirect(`/login?next=${encodeURIComponent(`/upload-materials/${caseId}`)}`);
  }

  if (!detail.caseRecord) {
    notFound();
  }

  const useCase = getUseCaseDefinition(detail.caseRecord.use_case_slug);

  return (
    <WorkspaceShell
      actions={[
        { href: "/dashboard/cases", label: "Back to cases", variant: "outline" },
        { href: `/dashboard/cases/${caseId}`, label: "View case", variant: "outline" }
      ]}
      description="Organize the expected materials so the system can generate a structured review from an actual package state."
      eyebrow="Upload Materials"
      title={useCase?.materialsTitle || "Update case materials"}
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
