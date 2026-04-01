"use client";

import Link from "next/link";
import { startTransition, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type AuthMode = "login" | "signup";

type AuthFormProps = {
  mode: AuthMode;
};

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextHref = searchParams.get("next") || "/dashboard";
  const errorCode = searchParams.get("error");
  const [values, setValues] = useState({
    fullName: "",
    email: "",
    password: ""
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "success">(
    errorCode === "auth-callback" ? "error" : "idle"
  );
  const [message, setMessage] = useState(
    errorCode === "auth-callback"
      ? "We couldn't complete that email confirmation. Try signing in again."
      : mode === "login"
        ? "Use your account details to continue."
        : "Create an account to save cases and review history."
  );

  function validate() {
    const nextErrors: Record<string, string> = {};

    if (mode === "signup" && !values.fullName.trim()) {
      nextErrors.fullName = "Full name is required.";
    }

    if (!/^\S+@\S+\.\S+$/.test(values.email)) {
      nextErrors.email = "Enter a valid email address.";
    }

    if (values.password.trim().length < 8) {
      nextErrors.password = "Use at least 8 characters.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!validate()) {
      setStatus("error");
      setMessage("Fix the highlighted fields before continuing.");
      return;
    }

    setStatus("loading");
    setMessage(mode === "login" ? "Signing you in..." : "Creating your account...");

    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          fullName: values.fullName,
          email: values.email,
          password: values.password,
          next: nextHref
        })
      });

      const data = (await response.json()) as {
        message?: string;
        redirectTo?: string;
        requiresEmailConfirmation?: boolean;
      };

      if (!response.ok) {
        throw new Error(data.message || "Unable to complete authentication.");
      }

      setStatus("success");
      setMessage(data.message || "Authentication complete.");

      const redirectTo = data.redirectTo;

      if (redirectTo) {
        startTransition(() => {
          router.push(redirectTo);
          router.refresh();
        });
      }
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Unable to complete authentication.");
    }
  }

  return (
    <Card className="border-white/10 bg-white/95 text-slate-950">
      <CardHeader>
        <Badge variant="secondary" className="w-fit">
          Account access
        </Badge>
        <CardTitle className="text-2xl">{mode === "login" ? "Log in to your account" : "Create your account"}</CardTitle>
        <CardDescription>
          Use your account to access saved cases, structured review versions, and the full workspace.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-5" noValidate onSubmit={handleSubmit}>
          {mode === "signup" ? (
            <div className="space-y-2">
              <Label htmlFor="fullName">Full name</Label>
              <Input
                aria-invalid={Boolean(errors.fullName)}
                id="fullName"
                onChange={(event) => setValues((current) => ({ ...current, fullName: event.target.value }))}
                placeholder="Jordan Lee"
                value={values.fullName}
              />
              {errors.fullName ? <p className="text-sm font-medium text-red-600">{errors.fullName}</p> : null}
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              aria-invalid={Boolean(errors.email)}
              id="email"
              onChange={(event) => setValues((current) => ({ ...current, email: event.target.value }))}
              placeholder="you@example.com"
              type="email"
              value={values.email}
            />
            {errors.email ? <p className="text-sm font-medium text-red-600">{errors.email}</p> : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              aria-invalid={Boolean(errors.password)}
              id="password"
              onChange={(event) => setValues((current) => ({ ...current, password: event.target.value }))}
              placeholder="At least 8 characters"
              type="password"
              value={values.password}
            />
            {errors.password ? <p className="text-sm font-medium text-red-600">{errors.password}</p> : null}
          </div>

          <Button className="w-full" disabled={status === "loading"} type="submit">
            {status === "loading"
              ? "Working..."
              : mode === "login"
                ? "Continue to dashboard"
                : "Create account"}
          </Button>

          <div
            className={cn("rounded-2xl border p-4 text-sm leading-6", {
              "border-border bg-slate-50 text-slate-700": status === "idle" || status === "loading" || status === "success",
              "border-red-200 bg-red-50 text-red-700": status === "error"
            })}
          >
            <p className="font-semibold uppercase tracking-[0.18em]">
              {status === "idle" ? "Ready" : status === "loading" ? "Working" : status === "success" ? "Saved" : "Error"}
            </p>
            <p className="mt-2">{message}</p>
          </div>

          <p className="text-sm text-slate-600">
            {mode === "login" ? "Need an account?" : "Already have access?"}{" "}
            <Link className="font-semibold text-slate-950 underline underline-offset-4" href={mode === "login" ? "/signup" : "/login"}>
              {mode === "login" ? "Create one" : "Log in"}
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
