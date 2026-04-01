import { Suspense } from "react";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { AuthForm } from "@/components/forms/auth-form";
import { Badge } from "@/components/ui/badge";

const highlights = [
  "Email and password sign-in gives you access to the case workspace.",
  "A valid session is required before the dashboard will render.",
  "Saved case intake, materials, and review history appear in the dashboard after sign-in."
];

export default async function LoginPage() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="grid w-full gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
      <div className="max-w-xl">
        <Badge variant="inverse" className="mb-6">
          Login
        </Badge>
        <h1 className="font-serif text-5xl leading-tight">Sign in and continue the case workflow where you left it.</h1>
        <p className="mt-6 text-lg leading-8 text-slate-300">
          Sign in to access your case dashboard, saved materials state, and structured review history from one place.
        </p>
        <div className="mt-10 space-y-3">
          {highlights.map((item) => (
            <div className="rounded-[24px] border border-white/10 bg-white/5 p-4 text-sm leading-6 text-slate-200" key={item}>
              {item}
            </div>
          ))}
        </div>
      </div>

      <Suspense fallback={<AuthFormFallback />}>
        <AuthForm mode="login" />
      </Suspense>
    </div>
  );
}

function AuthFormFallback() {
  return <div className="min-h-[30rem] rounded-[28px] border border-white/10 bg-white/10" />;
}
