import { type ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { SectionContainer } from "@/components/site/section-container";

type PageHeroProps = {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
};

export function PageHero({ eyebrow, title, description, actions }: PageHeroProps) {
  return (
    <SectionContainer className="pb-10 pt-14 sm:pb-14 sm:pt-20">
      <div className="max-w-3xl">
        <Badge variant="secondary" className="mb-5">
          {eyebrow}
        </Badge>
        <h1 className="font-serif text-4xl leading-tight text-foreground sm:text-5xl">{title}</h1>
        <p className="mt-5 text-lg leading-8 text-muted-foreground">{description}</p>
        {actions ? <div className="mt-8 flex flex-wrap gap-3">{actions}</div> : null}
      </div>
    </SectionContainer>
  );
}
