import { BookDemoForm } from "@/components/site/book-demo-form";
import { EventLink } from "@/components/site/event-link";
import { PageHero } from "@/components/site/page-hero";
import { SectionContainer } from "@/components/site/section-container";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentProfileContext } from "@/lib/profile-server";
import { getLocaleContext } from "@/lib/i18n/server";

export default async function BookDemoPage() {
  const { user, profile } = await getCurrentProfileContext();
  const { locale } = await getLocaleContext();
  const initialEmail = user?.email ?? profile?.email ?? "";
  const copy =
    locale === "zh-TW"
      ? {
          eyebrow: "預約示範",
          title: "預約示範，或加入案件工作台的早期候補名單。",
          description: "你可以在這裡申請產品示範、表達早期存取意願，或同時完成兩者。整個漏斗刻意保持很窄，只圍繞目前支援的兩條工作流程。",
          startCase: "開始案件",
          bestFitTitle: "最適合示範的人群",
          bestFitDescription: "目前產品最適合仍在受支援工作流程內推進案件的人。",
          bestFitItems: [
            "訪客紀錄準備工作流程",
            "學簽延期準備工作流程",
            "正在評估清單優先案件審查產品的團隊",
            "希望在專業審查前減少清理工作的人"
          ]
        }
      : {
          eyebrow: "预约演示",
          title: "预约演示，或加入案件工作台的早期候补名单。",
          description: "你可以在这里申请产品演示、表达早期访问意愿，或同时完成两者。整个漏斗刻意保持很窄，只围绕目前支持的两条工作流。",
          startCase: "开始案件",
          bestFitTitle: "最适合演示的人群",
          bestFitDescription: "当前产品最适合仍在受支持工作流内推进案件的人。",
          bestFitItems: [
            "访客记录准备工作流",
            "学签延期准备工作流",
            "正在评估清单优先案件审查产品的团队",
            "希望在专业审查前减少清理工作的人"
          ]
        };

  return (
    <>
      <PageHero
        actions={
          <EventLink
            className={buttonVariants({ size: "lg" })}
            eventType="landing_cta_clicked"
            href="/start-case"
            metadata={{
              sourceSurface: "book-demo-page",
              cta: "start-case"
            }}
          >
            {copy.startCase}
          </EventLink>
        }
        description={copy.description}
        eyebrow={copy.eyebrow}
        title={copy.title}
      />

      <SectionContainer className="pb-24">
        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <Card>
            <CardHeader>
              <CardTitle>{copy.bestFitTitle}</CardTitle>
              <CardDescription>{copy.bestFitDescription}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {copy.bestFitItems.map((item) => (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700" key={item}>
                  {item}
                </div>
              ))}
            </CardContent>
          </Card>

          <BookDemoForm initialEmail={initialEmail} />
        </div>
      </SectionContainer>
    </>
  );
}
