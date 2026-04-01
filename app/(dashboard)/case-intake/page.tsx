import { redirect } from "next/navigation";

import { CaseIntakeForm } from "@/components/cases/case-intake-form";
import { WorkspaceShell } from "@/components/dashboard/workspace-shell";
import { buildProfileSummaryFacts } from "@/lib/profile";
import { getCurrentProfileContext } from "@/lib/profile-server";
import { getCaseIntakeInitialValues } from "@/lib/cases";
import { getUseCaseDefinition } from "@/lib/case-workflows";

type CaseIntakePageProps = {
  searchParams: Promise<{
    useCase?: string;
  }>;
};

export default async function CaseIntakePage({ searchParams }: CaseIntakePageProps) {
  const { useCase: useCaseSlug } = await searchParams;
  const useCase = getUseCaseDefinition(useCaseSlug);

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
        { href: "/start-case", label: "Back to use cases", variant: "outline" },
        { href: "/dashboard", label: "Open dashboard", variant: "outline" }
      ]}
      description="This intake creates the saved case record and anchors the rest of the workflow."
      eyebrow="Case Intake"
      title={`${useCase.shortTitle} intake`}
    >
      <CaseIntakeForm
        initialValues={getCaseIntakeInitialValues(profile, useCase.slug)}
        profileFacts={buildProfileSummaryFacts(profile).slice(0, 5)}
        useCase={useCase}
      />
    </WorkspaceShell>
  );
}
