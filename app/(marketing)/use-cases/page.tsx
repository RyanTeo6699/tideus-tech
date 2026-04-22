import Link from "next/link";

import { EventLink } from "@/components/site/event-link";
import { SectionContainer } from "@/components/site/section-container";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCaseStartHref, getSupportedUseCases } from "@/lib/case-workflows";

export default function UseCasesPage() {
  const supportedUseCases = getSupportedUseCases("zh-CN");

  return (
    <>
      <SectionContainer className="py-10">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <Badge variant="secondary" className="mb-5 w-fit">
              场景入口
            </Badge>
            <h1 className="font-serif text-4xl leading-tight text-foreground sm:text-5xl">选择一个场景，直接开始案件工作流。</h1>
            <p className="mt-4 text-base leading-7 text-muted-foreground">
              这里不是文章库。每个场景都对应资料收集、材料跟踪、审查和导出路径。
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link className={buttonVariants({ size: "lg" })} href="/start-case">
              开始新案件
            </Link>
            <Link className={buttonVariants({ variant: "outline", size: "lg" })} href="/dashboard">
              继续工作台
            </Link>
          </div>
        </div>
      </SectionContainer>

      <SectionContainer className="pb-16">
        <div className="grid gap-6 lg:grid-cols-2">
          {supportedUseCases.map((item) => (
            <ScenarioCard key={item.slug} item={item} />
          ))}
        </div>
      </SectionContainer>
    </>
  );
}

function ScenarioCard({ item }: { item: ReturnType<typeof getSupportedUseCases>[number] }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <Badge variant="secondary" className="w-fit">
          当前支持
        </Badge>
        <CardTitle className="text-3xl">{item.shortTitle}</CardTitle>
        <CardDescription>{item.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <ScenarioBlock label="这是什么场景" value={item.detailSummary} />
        <ScenarioBlock label="适合谁" value={item.fitSignals.slice(0, 2).join("；")} />
        <ScenarioBlock label="AI 能帮什么" value={item.whatYouGet.slice(0, 2).join("；")} />
        <ScenarioBlock label="最后输出什么" value={item.outcomeSummary} />
        <div className="flex flex-col gap-3 sm:flex-row">
          <EventLink
            className={buttonVariants({ size: "sm" })}
            eventType="start_case_selected"
            href={getCaseStartHref(item.slug)}
            metadata={{
              sourceSurface: "use-cases-list",
              useCase: item.slug
            }}
          >
            开始这个案件
          </EventLink>
          <Link className={buttonVariants({ variant: "outline", size: "sm" })} href={`/use-cases/${item.slug}`}>
            查看结构
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

function ScenarioBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-2 text-sm leading-6 text-slate-800">{value}</p>
    </div>
  );
}
