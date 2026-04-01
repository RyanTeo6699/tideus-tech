import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }

  revalidatePath("/dashboard");

  return NextResponse.json({
    message: "Signed out.",
    redirectTo: "/login"
  });
}
