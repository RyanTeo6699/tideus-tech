import Link from "next/link";
import { notFound } from "next/navigation";

import { EventLink } from "@/components/site/event-link";
import { SectionContainer } from "@/components/site/section-container";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCaseStartHref, getSupportedUseCases, getUseCaseDefinition } from "@/lib/case-workflows";

type UseCaseDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export function generateStaticParams() {
  return getSupportedUseCases("zh-CN").map((item) => ({
    slug: item.slug
  }));
}

export default async function UseCaseDetailPage({ params }: UseCaseDetailPageProps) {
  const { slug } = await params;
  const useCase = getUseCaseDefinition(slug, "zh-CN");

  if (!useCase) {
    notFound();
  }

  return (
    <>
      <SectionContainer className="py-10">
        <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div>
            <Badge variant="secondary" className="mb-5 w-fit">
              {useCase.shortTitle}
            </Badge>
            <h1 className="font-serif text-4xl leading-tight text-foreground sm:text-5xl">{useCase.title}</h1>
            <p className="mt-4 text-base leading-7 text-muted-foreground">{useCase.detailSummary}</p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <EventLink
                className={buttonVariants({ size: "lg" })}
                eventType="use_case_cta_clicked"
                href={getCaseStartHref(useCase.slug)}
                metadata={{
                  sourceSurface: "use-case-detail",
                  cta: "start-this-case",
                  useCase: useCase.slug
                }}
              >
                直接开始
              </EventLink>
              <Link className={buttonVariants({ variant: "outline", size: "lg" })} href="/case-question">
                先问 AI
              </Link>
            </div>
          </div>

          <Card className="border-emerald-200 bg-emerald-50/80 shadow-none">
            <CardHeader>
              <CardTitle className="text-2xl">最后输出</CardTitle>
              <CardDescription>{useCase.outcomeSummary}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              {["清单", "缺失项", "风险标记", "下一步", "导出包"].map((item) => (
                <div className="rounded-2xl border border-emerald-200 bg-white p-4 text-sm font-semibold text-slate-950" key={item}>
                  {item}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </SectionContainer>

      <SectionContainer className="pb-16">
        <div className="grid gap-6 lg:grid-cols-2">
          <ScenarioBlock title="这是什么场景" items={[useCase.detailSummary]} />
          <ScenarioBlock title="适合谁" items={useCase.fitSignals} />
          <ScenarioBlock title="AI 能帮什么" items={useCase.whatYouGet} />
          <ScenarioBlock title="需要哪些材料" items={useCase.expectedDocuments.map((item) => item.label)} />
        </div>
      </SectionContainer>

      <SectionContainer className="pb-16">
        <Card>
          <CardHeader>
            <CardTitle>不适合的情况</CardTitle>
            <CardDescription>如果你的需求属于下面类型，Tideus 当前不会把它包装成完整解决方案。</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            {useCase.notFor.map((item) => (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700" key={item}>
                {item}
              </div>
            ))}
          </CardContent>
        </Card>
      </SectionContainer>
    </>
  );
}

function ScenarioBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item) => (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700" key={item}>
            {item}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
