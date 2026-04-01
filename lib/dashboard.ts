import type { User } from "@supabase/supabase-js";

import type { Tables } from "@/lib/database.types";
import { createClient } from "@/lib/supabase/server";

export type DashboardData = {
  user: User;
  profile: Tables<"profiles"> | null;
  recentCases: Tables<"cases">[];
  metrics: {
    totalCases: number;
    reviewedCases: number;
    actionNeededCases: number;
  };
  legacyCounts: {
    assessments: number;
    comparisons: number;
    threads: number;
  };
};

export async function getDashboardData(): Promise<DashboardData | null> {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const [
    profileResult,
    recentCasesResult,
    totalCasesResult,
    reviewedCasesResult,
    actionNeededCasesResult,
    assessmentsCountResult,
    comparisonsCountResult,
    threadsCountResult
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle(),
    supabase.from("cases").select("*").eq("user_id", user.id).order("updated_at", { ascending: false }).limit(4),
    supabase.from("cases").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("cases").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("status", "reviewed"),
    supabase
      .from("cases")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .in("latest_readiness_status", ["not-ready", "needs-attention"]),
    supabase.from("assessments").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("comparisons").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("copilot_threads").select("id", { count: "exact", head: true }).eq("user_id", user.id)
  ]);

  return {
    user,
    profile: profileResult.data ?? null,
    recentCases: recentCasesResult.data ?? [],
    metrics: {
      totalCases: totalCasesResult.count ?? 0,
      reviewedCases: reviewedCasesResult.count ?? 0,
      actionNeededCases: actionNeededCasesResult.count ?? 0
    },
    legacyCounts: {
      assessments: assessmentsCountResult.count ?? 0,
      comparisons: comparisonsCountResult.count ?? 0,
      threads: threadsCountResult.count ?? 0
    }
  };
}
