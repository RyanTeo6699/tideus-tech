import Link from "next/link";

import { CaseQuestionEntry } from "@/components/cases/case-question-entry";
import { SectionContainer } from "@/components/site/section-container";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { getSupportedUseCases } from "@/lib/case-workflows";

export default function CaseQuestionPage() {
  const supportedUseCases = getSupportedUseCases("zh-CN");

  return (
    <>
      <SectionContainer className="py-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <Badge variant="secondary" className="mb-5 w-fit">
              问 AI
            </Badge>
            <h1 className="font-serif text-4xl leading-tight text-foreground sm:text-5xl">先问一个案件问题，再决定是否保存成工作流。</h1>
            <p className="mt-4 text-base leading-7 text-muted-foreground">
              答案会按摘要、重要性、公开信息提示和下一步组织；如果有价值，可以直接保存到工作台。
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link className={buttonVariants({ size: "lg" })} href="/start-case">
              直接开始案件
            </Link>
            <Link className={buttonVariants({ variant: "outline", size: "lg" })} href="/dashboard">
              继续工作台
            </Link>
          </div>
        </div>
      </SectionContainer>

      <SectionContainer className="pb-6">
        <Card className="border-slate-200 bg-slate-50 shadow-none">
          <CardHeader>
            <p className="text-sm font-semibold text-slate-950">当前只支持：访客记录、学签延期。</p>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            {["回答摘要", "相关公开信息提示", "保存到工作台"].map((item) => (
              <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm font-semibold text-slate-800" key={item}>
                {item}
              </div>
            ))}
          </CardContent>
        </Card>
      </SectionContainer>

      <SectionContainer className="pb-16">
        <CaseQuestionEntry
          useCases={supportedUseCases.map((item) => ({
            slug: item.slug,
            shortTitle: item.shortTitle,
            description: item.description
          }))}
        />
      </SectionContainer>
    </>
  );
}
