import { Suspense } from "react";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { AuthForm } from "@/components/forms/auth-form";
import { Badge } from "@/components/ui/badge";

const highlights = [
  "The form includes validation, loading, success, and error handling.",
  "New accounts can support email confirmation when it is enabled.",
  "Saved cases and review versions are tied to one account from the start."
];

export default async function SignupPage() {
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
          Signup
        </Badge>
        <h1 className="font-serif text-5xl leading-tight">Create an account and save case prep work from the first intake.</h1>
        <p className="mt-6 text-lg leading-8 text-slate-300">
          Create an account to keep intake answers, materials tracking, and structured review results inside one workspace.
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
        <AuthForm mode="signup" />
      </Suspense>
    </div>
  );
}

function AuthFormFallback() {
  return <div className="min-h-[30rem] rounded-[28px] border border-white/10 bg-white/10" />;
}
