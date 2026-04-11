import Link from "next/link";

import type { AppLocale } from "@/lib/i18n/config";
import type { Json } from "@/lib/database.types";
import type { ConsumerPlanCapability } from "@/lib/plans";
import { getConsumerCapabilityUpgradePrompt } from "@/lib/plans";
import { EventLink } from "@/components/site/event-link";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type PlanUpgradeCardProps = {
  capability: ConsumerPlanCapability;
  locale: AppLocale;
  sourceSurface: string;
  caseId?: string;
  useCase?: string | null;
  className?: string;
};

export function PlanUpgradeCard({
  capability,
  locale,
  sourceSurface,
  caseId,
  useCase = null,
  className
}: PlanUpgradeCardProps) {
  const prompt = getConsumerCapabilityUpgradePrompt(capability, locale);
  const metadata: Json = {
    sourceSurface,
    requestedPlan: "pro",
    gatedCapability: capability,
    useCase: useCase ?? "not-selected"
  };

  return (
    <Card className={cn("border-amber-200 bg-amber-50/70 shadow-none", className)}>
      <CardHeader>
        <Badge variant="secondary" className="w-fit">
          {prompt.eyebrow}
        </Badge>
        <CardTitle>{prompt.title}</CardTitle>
        <CardDescription>{prompt.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2 text-sm leading-6 text-slate-700">
          {prompt.bullets.map((item) => (
            <div className="rounded-2xl border border-amber-200 bg-white/80 p-3" key={item}>
              {item}
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link className={buttonVariants({ variant: "outline", size: "sm" })} href="/pricing">
            {prompt.primaryLabel}
          </Link>
          <EventLink
            caseId={caseId}
            className={buttonVariants({ size: "sm" })}
            eventType="book_demo_clicked"
            href="/book-demo"
            metadata={metadata}
          >
            {prompt.secondaryLabel}
          </EventLink>
        </div>
      </CardContent>
    </Card>
  );
}
