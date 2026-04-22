import Link from "next/link";

import { getCaseStartHref, getSupportedUseCases } from "@/lib/case-workflows";
import { getCurrentProfileContext } from "@/lib/profile-server";
import { EventLink } from "@/components/site/event-link";
import { SectionContainer } from "@/components/site/section-container";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function StartCasePage() {
  const { user } = await getCurrentProfileContext();
  const supportedUseCases = getSupportedUseCases("zh-CN");

  return (
    <>
      <SectionContainer className="py-10">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <Badge variant="secondary" className="mb-5 w-fit">
              开始跟踪
            </Badge>
            <h1 className="font-serif text-4xl leading-tight text-foreground sm:text-5xl">选择场景，创建可继续推进的案件。</h1>
            <p className="mt-4 text-base leading-7 text-muted-foreground">
              创建后会进入资料收集、材料状态、审查、导出和交接路径。当前只开放访客记录与学签延期。
            </p>
          </div>
          <Link className={buttonVariants({ variant: "outline", size: "lg" })} href={user ? "/dashboard" : "/login?next=/dashboard"}>
            {user ? "继续工作台" : "登录后继续工作台"}
          </Link>
        </div>
      </SectionContainer>

      <SectionContainer className="pb-16">
        <div className="grid gap-6 lg:grid-cols-2">
          {supportedUseCases.map((item) => (
            <Card key={item.slug}>
              <CardHeader>
                <Badge variant="secondary" className="w-fit">
                  当前支持
                </Badge>
                <CardTitle className="text-3xl">{item.shortTitle}</CardTitle>
                <CardDescription>{item.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <ScenarioLine label="这是什么场景" value={item.detailSummary} />
                <ScenarioLine label="适合谁" value={item.fitSignals[0] ?? "需要整理当前案件的人"} />
                <ScenarioLine label="AI 能帮什么" value={item.whatYouGet[0] ?? "生成结构化工作流输出"} />
                <ScenarioLine label="最后输出什么" value={item.outcomeSummary} />
                <div className="flex flex-col gap-3 sm:flex-row">
                  <EventLink
                    className={buttonVariants({ size: "sm" })}
                    eventType="start_case_selected"
                    href={getCaseStartHref(item.slug)}
                    metadata={{
                      sourceSurface: "start-case-page",
                      useCase: item.slug
                    }}
                  >
                    开始这个案件
                  </EventLink>
                  <Link className={buttonVariants({ variant: "outline", size: "sm" })} href={`/use-cases/${item.slug}`}>
                    查看场景结构
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </SectionContainer>
    </>
  );
}

function ScenarioLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-2 text-sm leading-6 text-slate-800">{value}</p>
    </div>
  );
}
