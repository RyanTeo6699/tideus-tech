import { redirect } from "next/navigation";

import { ProfessionalDashboardShell } from "@/components/professional/professional-dashboard-shell";
import { getProfessionalDashboardData } from "@/lib/professionals";

export default async function ProfessionalDashboardPage() {
  const dashboardData = await getProfessionalDashboardData();

  if (!dashboardData) {
    redirect("/professional/login?next=/professional/dashboard");
  }

  return <ProfessionalDashboardShell {...dashboardData} />;
}
