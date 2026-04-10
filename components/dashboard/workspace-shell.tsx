import type { ReactNode } from "react";
import Link from "next/link";

import { getCurrentLocale } from "@/lib/i18n/server";
import { LanguageSwitcher } from "@/components/site/language-switcher";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type ActionLink = {
  href: string;
  label: string;
  variant?: "default" | "outline";
};

type WorkspaceShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ActionLink[];
  children: ReactNode;
};

export async function WorkspaceShell({ eyebrow, title, description, actions = [], children }: WorkspaceShellProps) {
  await getCurrentLocale();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            {actions.map((action) => (
              <Link
                className={cn(
                  buttonVariants({
                    size: "sm",
                    variant: action.variant === "outline" ? "outline" : "default"
                  }),
                  action.variant === "outline" ? "border-white/15 bg-white/5 text-white hover:bg-white/10" : null
                )}
                href={action.href}
                key={`${action.href}-${action.label}`}
              >
                {action.label}
              </Link>
            ))}
          </div>
          <LanguageSwitcher />
        </div>

        <Card className="border-white/10 bg-white text-slate-950">
          <CardHeader>
            <Badge variant="secondary" className="mb-4 w-fit">
              {eyebrow}
            </Badge>
            <CardTitle className="text-3xl">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
        </Card>

        <Card className="border-white/10 bg-white text-slate-950">
          <CardContent className="pt-6">{children}</CardContent>
        </Card>
      </div>
    </div>
  );
}
