import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

type SignupPayload = {
  fullName?: string;
  email?: string;
  password?: string;
  next?: string;
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as SignupPayload | null;
  const fullName = body?.fullName?.trim();
  const email = body?.email?.trim().toLowerCase();
  const password = body?.password?.trim();
  const next = body?.next?.startsWith("/") ? body.next : "/dashboard";

  if (!fullName || !email || !password) {
    return NextResponse.json({ message: "Complete all required fields." }, { status: 400 });
  }

  const origin = process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin;
  const emailRedirectTo = new URL("/auth/callback", origin);
  emailRedirectTo.searchParams.set("next", next);

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName
      },
      emailRedirectTo: emailRedirectTo.toString()
    }
  });

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }

  if (data.session) {
    return NextResponse.json({
      message: "Your account is ready. Redirecting to your case dashboard...",
      redirectTo: next
    });
  }

  return NextResponse.json({
    message: "Account created. Check your email to confirm your address before signing in.",
    requiresEmailConfirmation: true
  });
}
