import { PageHero } from "@/components/site/page-hero";
import { SectionContainer } from "@/components/site/section-container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getLocaleContext } from "@/lib/i18n/server";
import { getSiteConfig } from "@/lib/site";

export default async function TermsPage() {
  const { locale } = await getLocaleContext();
  const siteConfig = getSiteConfig(locale);
  const copy =
    locale === "zh-TW"
      ? {
          eyebrow: "條款",
          title: "產品邊界應從一開始就寫清楚。",
          description: "這一頁說明目前的產品邊界，並且在正式公開發布前仍需要進一步擴充。",
          sections: [
            {
              title: "產品邊界",
              body: `${siteConfig.name} 提供的是結構化準備支持，不應被視為法律建議、官方移民裁定，或受監管專業審查的替代品。`
            },
            {
              title: "負責任使用",
              body: "使用者應提供準確資訊、對審查輸出保持批判性閱讀，並在採取任何重要遞交、身分或資格決定前，向合格專業人士確認。"
            },
            {
              title: "後續變更",
              body: "產品、路由保護與整合將持續演進。在正式公開發布前，條款仍需擴充，以覆蓋帳戶所有權、資料使用、服務限制與爭議處理。"
            }
          ]
        }
      : {
          eyebrow: "条款",
          title: "产品边界应从一开始就写清楚。",
          description: "这一页说明当前的产品边界，并且在正式公开发布前仍需要进一步扩展。",
          sections: [
            {
              title: "产品边界",
              body: `${siteConfig.name} 提供的是结构化准备支持，不应被视为法律建议、官方移民裁定，或受监管专业审查的替代品。`
            },
            {
              title: "负责任使用",
              body: "用户应提供准确资料、对审查输出保持批判性阅读，并在采取任何重要递交、身份或资格决定前，向合格专业人士确认。"
            },
            {
              title: "后续变更",
              body: "产品、路由保护与集成将持续演进。在正式公开发布前，条款仍需扩展，以覆盖账户所有权、数据使用、服务限制与争议处理。"
            }
          ]
        };

  return (
    <>
      <PageHero description={copy.description} eyebrow={copy.eyebrow} title={copy.title} />

      <SectionContainer className="pb-24">
        <div className="grid gap-6">
          {copy.sections.map((section) => (
            <Card key={section.title}>
              <CardHeader>
                <CardTitle>{section.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="max-w-4xl text-base leading-7 text-muted-foreground">{section.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </SectionContainer>
    </>
  );
}
