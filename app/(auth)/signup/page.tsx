import { Suspense } from "react";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { AuthForm } from "@/components/forms/auth-form";
import { Badge } from "@/components/ui/badge";
import { getLocaleContext } from "@/lib/i18n/server";

export default async function SignupPage() {
  const supabase = await createClient();
  const { messages } = await getLocaleContext();
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
          {messages.authPage.signupBadge}
        </Badge>
        <h1 className="font-serif text-5xl leading-tight">{messages.authPage.signupTitle}</h1>
        <p className="mt-6 text-lg leading-8 text-slate-300">{messages.authPage.signupDescription}</p>
        <div className="mt-10 space-y-3">
          {messages.authPage.signupHighlights.map((item) => (
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
