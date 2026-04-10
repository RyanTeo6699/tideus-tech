import { redirect } from "next/navigation";

import { ProfileForm } from "@/components/profile/profile-form";
import { WorkspaceShell } from "@/components/dashboard/workspace-shell";
import { getCurrentLocale } from "@/lib/i18n/server";
import { getWorkspaceCopy } from "@/lib/i18n/workspace";
import { getProfileFormValues } from "@/lib/profile";
import { getCurrentProfileContext } from "@/lib/profile-server";

export default async function DashboardProfilePage() {
  const { user, profile } = await getCurrentProfileContext();
  const locale = await getCurrentLocale();
  const copy = getWorkspaceCopy(locale);

  if (!user) {
    redirect("/login?next=/dashboard/profile");
  }

  return (
    <WorkspaceShell
      actions={[
        { href: "/dashboard", label: copy.actions.backToOverview, variant: "outline" },
        { href: "/start-case", label: copy.actions.startCase }
      ]}
      description={copy.profile.description}
      eyebrow={copy.shell.profileEyebrow}
      title={copy.profile.title}
    >
      <ProfileForm email={user.email ?? copy.common.notSet} initialValues={getProfileFormValues(profile, user)} updatedAt={profile?.updated_at ?? null} />
    </WorkspaceShell>
  );
}
