import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type FeatureCardProps = {
  eyebrow: string;
  title: string;
  description: string;
  bullets?: string[];
  cta?: {
    href: string;
    label: string;
  };
};

export function FeatureCard({ eyebrow, title, description, bullets, cta }: FeatureCardProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <Badge variant="secondary" className="w-fit">
          {eyebrow}
        </Badge>
        <CardTitle className="text-2xl">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex h-full flex-col justify-between gap-6">
        {bullets ? (
          <div className="space-y-3">
            {bullets.map((bullet) => (
              <div className="flex items-start gap-3 text-sm text-muted-foreground" key={bullet}>
                <span className="mt-1 h-2.5 w-2.5 rounded-full bg-primary" />
                <span>{bullet}</span>
              </div>
            ))}
          </div>
        ) : null}

        {cta ? (
          <Link className="text-sm font-semibold text-foreground underline-offset-4 hover:underline" href={cta.href}>
            {cta.label}
          </Link>
        ) : null}
      </CardContent>
    </Card>
  );
}
