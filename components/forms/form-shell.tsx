import { type ReactNode } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type FormShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  aside: ReactNode;
};

export function FormShell({ eyebrow, title, description, children, aside }: FormShellProps) {
  return (
    <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
      <Card>
        <CardHeader>
          <Badge variant="secondary" className="w-fit">
            {eyebrow}
          </Badge>
          <CardTitle className="text-2xl">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>

      <Card className="h-full">
        <CardContent className="flex h-full flex-col justify-start p-6">{aside}</CardContent>
      </Card>
    </div>
  );
}
