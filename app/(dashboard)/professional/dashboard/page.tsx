import { redirect } from "next/navigation";

import { ProfessionalAccessLocked } from "@/components/professional/professional-access-locked";
import { ProfessionalDashboardShell } from "@/components/professional/professional-dashboard-shell";
import { canAccessProfessionalDashboard, getCurrentPermissionContext } from "@/lib/permissions";
import { getProfessionalDashboardData } from "@/lib/professionals";

export default async function ProfessionalDashboardPage() {
  const permissionContext = await getCurrentPermissionContext();

  if (!permissionContext.user) {
    redirect("/professional/login?next=/professional/dashboard");
  }

  if (!canAccessProfessionalDashboard(permissionContext)) {
    return <ProfessionalAccessLocked />;
  }

  const dashboardData = await getProfessionalDashboardData();

  if (!dashboardData) {
    redirect("/professional/login?next=/professional/dashboard");
  }

  return <ProfessionalDashboardShell {...dashboardData} />;
}
