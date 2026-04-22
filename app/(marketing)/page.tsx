import Link from "next/link";

import { EventLink } from "@/components/site/event-link";
import { SectionContainer } from "@/components/site/section-container";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCaseStartHref, getSupportedUseCases } from "@/lib/case-workflows";

const outputItems = ["清单", "缺失项", "风险标记", "下一步", "导出包"] as const;

const workflowSteps = [
  "提问或开始一个案件",
  "获得结构化回答与审查",
  "更新材料并继续推进工作流",
  "准备好后导出或交接"
] as const;

export default function HomePage() {
  const supportedUseCases = getSupportedUseCases("zh-CN");

  return (
    <>
      <section className="relative overflow-hidden border-b border-border/80 bg-slate-950 text-slate-50">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.28),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(59,130,246,0.24),_transparent_30%)]" />
        <SectionContainer className="relative py-8 sm:py-10">
          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-stretch">
            <div className="flex flex-col justify-between rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-panel sm:p-8">
              <div>
                <Badge variant="inverse" className="mb-5 w-fit">
                  AI 案件工作台
                </Badge>
                <h1 className="max-w-2xl font-serif text-4xl leading-tight sm:text-5xl">
                  直接开始案件准备，不先读一整页说明。
                </h1>
                <p className="mt-5 max-w-xl text-base leading-7 text-slate-300">
                  Tideus 把问题、材料、审查、导出和交接放进同一个工作流。你现在可以提问、建案件、继续工作台。
                </p>
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                <EventLink
                  className={buttonVariants({ size: "lg" })}
                  eventType="landing_cta_clicked"
                  href="/case-question"
                  metadata={{
                    sourceSurface: "home-task-console",
                    cta: "ask-ai"
                  }}
                >
                  问 AI
                </EventLink>
                <EventLink
                  className={buttonVariants({ variant: "secondary", size: "lg" })}
                  eventType="landing_cta_clicked"
                  href="/start-case"
                  metadata={{
                    sourceSurface: "home-task-console",
                    cta: "start-case"
                  }}
                >
                  开始案件 / 开始跟踪
                </EventLink>
                <Link className={buttonVariants({ variant: "outline", size: "lg" })} href="/dashboard">
                  打开 / 继续工作台
                </Link>
                <Link className={buttonVariants({ variant: "outline", size: "lg" })} href="/pricing">
                  查看 Free / Pro
                </Link>
              </div>
            </div>

            <Card className="border-white/10 bg-white text-slate-950">
              <CardHeader>
                <Badge variant="secondary" className="mb-3 w-fit">
                  支持场景
                </Badge>
                <CardTitle className="text-3xl">选择一个入口，马上进入工作流</CardTitle>
                <CardDescription>当前只支持两个高频场景，不做泛化移民门户。</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                {supportedUseCases.map((item) => (
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5" key={item.slug}>
                    <p className="text-sm font-semibold text-emerald-700">{item.homepageLabel}</p>
                    <h2 className="mt-2 text-2xl font-semibold text-slate-950">{item.shortTitle}</h2>
                    <p className="mt-3 text-sm leading-6 text-slate-700">{item.description}</p>
                    <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                      <EventLink
                        className={buttonVariants({ size: "sm" })}
                        eventType="start_case_selected"
                        href={getCaseStartHref(item.slug)}
                        metadata={{
                          sourceSurface: "home-scenario-shortcut",
                          useCase: item.slug
                        }}
                      >
                        开始这个案件
                      </EventLink>
                      <Link className={buttonVariants({ variant: "outline", size: "sm" })} href={`/use-cases/${item.slug}`}>
                        看场景结构
                      </Link>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </SectionContainer>
      </section>

      <SectionContainer className="py-10" id="outputs">
        <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <Badge variant="secondary" className="mb-4 w-fit">
              输出
            </Badge>
            <h2 className="font-serif text-4xl text-foreground">平台最终应该产出什么</h2>
            <p className="mt-4 text-base leading-7 text-muted-foreground">
              不是长聊天记录。每次关键动作都应该进入可保存、可继续、可导出的工作流。
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {outputItems.map((item) => (
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft" key={item}>
                <p className="text-sm font-semibold text-slate-500">输出</p>
                <p className="mt-3 text-lg font-semibold text-slate-950">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </SectionContainer>

      <SectionContainer className="pb-14">
        <Card className="border-emerald-200 bg-emerald-50/80 shadow-none">
          <CardHeader>
            <Badge variant="secondary" className="mb-3 w-fit">
              4 步工作流
            </Badge>
            <CardTitle className="text-3xl">从问题到交接，保持在同一个工作流里</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-4">
            {workflowSteps.map((step, index) => (
              <div className="rounded-3xl border border-emerald-200 bg-white p-5" key={step}>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">{String(index + 1).padStart(2, "0")}</p>
                <p className="mt-3 text-base font-semibold leading-6 text-slate-950">{step}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </SectionContainer>
    </>
  );
}
