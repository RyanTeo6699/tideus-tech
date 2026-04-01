import { redirect } from "next/navigation";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { getDashboardData } from "@/lib/dashboard";

export default async function DashboardPage() {
  const dashboardData = await getDashboardData();

  if (!dashboardData) {
    redirect("/login?next=/dashboard");
  }

  return <DashboardShell {...dashboardData} />;
}
