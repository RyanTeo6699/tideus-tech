import { redirect } from "next/navigation";

import { ProfileForm } from "@/components/profile/profile-form";
import { WorkspaceShell } from "@/components/dashboard/workspace-shell";
import { getProfileFormValues } from "@/lib/profile";
import { getCurrentProfileContext } from "@/lib/profile-server";

export default async function DashboardProfilePage() {
  const { user, profile } = await getCurrentProfileContext();

  if (!user) {
    redirect("/login?next=/dashboard/profile");
  }

  return (
    <WorkspaceShell
      actions={[
        { href: "/dashboard", label: "Back to overview", variant: "outline" },
        { href: "/start-case", label: "Start a case" }
      ]}
      description="Keep the core profile details in one place so case intake stays shorter and the review workflow can reuse the same background context."
      eyebrow="Profile"
      title="Manage your saved immigration profile"
    >
      <ProfileForm email={user.email ?? "No email available"} initialValues={getProfileFormValues(profile, user)} updatedAt={profile?.updated_at ?? null} />
    </WorkspaceShell>
  );
}
