import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

type LoginPayload = {
  email?: string;
  password?: string;
  next?: string;
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as LoginPayload | null;
  const email = body?.email?.trim().toLowerCase();
  const password = body?.password?.trim();
  const next = body?.next?.startsWith("/") ? body.next : "/dashboard";

  if (!email || !password) {
    return NextResponse.json({ message: "Enter both email and password." }, { status: 400 });
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }

  revalidatePath("/dashboard");

  return NextResponse.json({
    message: "Signed in successfully. Redirecting to your case dashboard...",
    redirectTo: next
  });
}
