import Link from "next/link";

import { PageHero } from "@/components/site/page-hero";
import { SectionContainer } from "@/components/site/section-container";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getLocaleContext } from "@/lib/i18n/server";
import { getTrustBoundaryPoints } from "@/lib/site";

export default async function TrustPage() {
  const { locale } = await getLocaleContext();
  const trustBoundaryPoints = getTrustBoundaryPoints(locale);
  const copy =
    locale === "zh-TW"
      ? {
          heroEyebrow: "信任與邊界",
          heroTitle: "Tideus 是案件工作台，不是法律建議。",
          heroDescription:
            "這裡的信任來自狹窄範圍、結構化審查輸出、可保存的工作流程歷史，以及當人工審查應該接手時的明確交接點。",
          viewUseCases: "查看支援情境",
          bookDemo: "預約示範",
          boundariesEyebrow: "邊界",
          boundariesTitle: "只有把限制寫清楚，產品才會持續可信。",
          boundaryLabel: "邊界",
          commitmentsTitle: "Tideus 承諾做什麼",
          commitmentsDescription:
            "承諾本身是狹窄的：幫助使用者整理案件資料包、看清仍缺什麼，並把乾淨的工作流程歷史帶入下一個嚴肅審查步驟。",
          commitments: [
            "Tideus 不會被包裝成政府服務、法律顧問或通用移民平台。",
            "產品的目標是整理案件準備、暴露工作流程缺口，並為少數受支援工作流程保存結構化審查歷史。",
            "如果案件事實超出受支援工作流程，或風險輪廓顯著升高，正確的下一步應是專業人工審查。"
          ]
        }
      : {
          heroEyebrow: "信任与边界",
          heroTitle: "Tideus 是案件工作台，不是法律建议。",
          heroDescription:
            "这里的信任来自狭窄范围、结构化审查输出、可保存的工作流历史，以及当人工审查应该接手时的明确交接点。",
          viewUseCases: "查看支持场景",
          bookDemo: "预约演示",
          boundariesEyebrow: "边界",
          boundariesTitle: "只有把限制写清楚，产品才会持续可信。",
          boundaryLabel: "边界",
          commitmentsTitle: "Tideus 承诺做什么",
          commitmentsDescription:
            "承诺本身是狭窄的：帮助用户整理案件资料包、看清仍缺什么，并把干净的工作流历史带入下一个严肃审查步骤。",
          commitments: [
            "Tideus 不会被包装成政府服务、法律顾问或通用移民平台。",
            "产品的目标是整理案件准备、暴露工作流缺口，并为少数受支持工作流保存结构化审查历史。",
            "如果案件事实超出受支持工作流，或风险轮廓显著升高，正确的下一步应是专业人工审查。"
          ]
        };

  return (
    <>
      <PageHero
        actions={
          <>
            <Link className={buttonVariants({ size: "lg" })} href="/use-cases">
              {copy.viewUseCases}
            </Link>
            <Link className={buttonVariants({ variant: "outline", size: "lg" })} href="/book-demo">
              {copy.bookDemo}
            </Link>
          </>
        }
        description={copy.heroDescription}
        eyebrow={copy.heroEyebrow}
        title={copy.heroTitle}
      />

      <SectionContainer className="pb-16">
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="max-w-md">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">{copy.boundariesEyebrow}</p>
            <h2 className="mt-4 font-serif text-4xl text-foreground">{copy.boundariesTitle}</h2>
          </div>
          <div className="space-y-4">
            {trustBoundaryPoints.map((item) => (
              <Card key={item}>
                <CardHeader>
                  <CardTitle className="text-xl">{copy.boundaryLabel}</CardTitle>
                  <CardDescription>{item}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </SectionContainer>

      <SectionContainer className="pb-24">
        <Card>
          <CardHeader>
            <CardTitle>{copy.commitmentsTitle}</CardTitle>
            <CardDescription>{copy.commitmentsDescription}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            {copy.commitments.map((item) => (
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
