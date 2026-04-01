import type { User } from "@supabase/supabase-js";

import type { Tables } from "@/lib/database.types";
import { createClient } from "@/lib/supabase/server";

type DetailResult<T> = {
  user: User | null;
  record: T | null;
};

type ListResult<T> = {
  user: User | null;
  items: T[];
};

export async function getAssessmentDetail(assessmentId: string): Promise<DetailResult<Tables<"assessments">>> {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      user: null,
      record: null
    };
  }

  const { data } = await supabase
    .from("assessments")
    .select("*")
    .eq("user_id", user.id)
    .eq("id", assessmentId)
    .maybeSingle();

  return {
    user,
    record: data ?? null
  };
}

export async function getAssessmentHistory(limit = 24): Promise<ListResult<Tables<"assessments">>> {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      user: null,
      items: []
    };
  }

  const { data } = await supabase
    .from("assessments")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  return {
    user,
    items: data ?? []
  };
}

export async function getComparisonDetail(comparisonId: string): Promise<DetailResult<Tables<"comparisons">>> {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      user: null,
      record: null
    };
  }

  const { data } = await supabase
    .from("comparisons")
    .select("*")
    .eq("user_id", user.id)
    .eq("id", comparisonId)
    .maybeSingle();

  return {
    user,
    record: data ?? null
  };
}

export async function getComparisonHistory(limit = 24): Promise<ListResult<Tables<"comparisons">>> {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      user: null,
      items: []
    };
  }

  const { data } = await supabase
    .from("comparisons")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  return {
    user,
    items: data ?? []
  };
}

export async function getCopilotThreadHistory(limit = 24): Promise<ListResult<Tables<"copilot_threads">>> {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      user: null,
      items: []
    };
  }

  const { data } = await supabase
    .from("copilot_threads")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(limit);

  return {
    user,
    items: data ?? []
  };
}
