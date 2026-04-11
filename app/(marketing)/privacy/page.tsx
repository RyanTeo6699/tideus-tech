import { PageHero } from "@/components/site/page-hero";
import { SectionContainer } from "@/components/site/section-container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getLocaleContext } from "@/lib/i18n/server";
import { getSiteConfig } from "@/lib/site";

export default async function PrivacyPage() {
  const { locale } = await getLocaleContext();
  const siteConfig = getSiteConfig(locale);
  const copy =
    locale === "zh-TW"
      ? {
          eyebrow: "隱私",
          title: "隱私說明應該與產品真正提供的案件工作台相匹配。",
          description:
            "這一頁說明 Tideus 在目前案件優先工作流程產品中保存的資料：帳戶紀錄、案件紀錄、上傳材料中繼資料、審查輸出、線索請求與工作流程歷史。",
          sections: [
            {
              title: "帳戶資料",
              body: "Tideus 會保存經過驗證的帳戶資料，例如電子郵件與維持案件工作台綁定所需的基本個人資料。"
            },
            {
              title: "案件工作台資料",
              body: "目前產品會保存案件紀錄、資料收集回覆、材料狀態追蹤、審查輸出、工作流程狀態歷史與審查版本，讓使用者不必重頭開始。"
            },
            {
              title: "上傳材料",
              body: "當使用者上傳案件材料時，Tideus 會把檔案儲存在私有案件儲存空間，並在案件紀錄中保存相關中繼資料，例如檔名、檔案型別、大小、上傳時間和所屬材料列。"
            },
            {
              title: "工作流程歷史",
              body: "Tideus 也會保存結構化案件事件，例如案件建立、資料收集完成、材料更新、審查生成與案件恢復。目標是產品連續性與未來工作流程分析，而不是在本階段建立面向使用者的分析儀表板。"
            },
            {
              title: "示範與早期存取請求",
              body: "如果有人使用預約示範或早期存取表單，Tideus 會保存提交的電子郵件、支援工作流程興趣、目前階段、請求意圖、可選備註，以及相關漏斗中繼資料。"
            },
            {
              title: "服務邊界",
              body: "Tideus 不是政府服務，也不是律師事務所。保存的資料是為了支援產品內的案件準備工作流程與結構化審查模組。"
            },
            {
              title: "聯絡方式",
              body: `如果有隱私相關問題，請聯繫 ${siteConfig.supportEmail}。`
            }
          ]
        }
      : {
          eyebrow: "隐私",
          title: "隐私说明应该与产品真正提供的案件工作台相匹配。",
          description:
            "这一页说明 Tideus 在当前案件优先工作流产品中保存的数据：账户记录、案件记录、上传材料元数据、审查输出、线索请求与工作流历史。",
          sections: [
            {
              title: "账户数据",
              body: "Tideus 会保存经过验证的账户资料，例如邮箱与维持案件工作台绑定所需的基础个人信息。"
            },
            {
              title: "案件工作台数据",
              body: "当前产品会保存案件记录、资料收集回答、材料状态跟踪、审查输出、工作流状态历史与审查版本，让用户不必从头开始。"
            },
            {
              title: "上传材料",
              body: "当用户上传案件材料时，Tideus 会把文件保存在私有案件存储空间，并在案件记录中保存相关元数据，例如文件名、文件类型、大小、上传时间和所属材料行。"
            },
            {
              title: "工作流历史",
              body: "Tideus 也会保存结构化案件事件，例如案件创建、资料收集完成、材料更新、审查生成与案件恢复。目标是产品连续性与未来工作流分析，而不是在本阶段建立面向用户的分析仪表盘。"
            },
            {
              title: "演示与早期访问请求",
              body: "如果有人使用预约演示或早期访问表单，Tideus 会保存提交的邮箱、支持工作流兴趣、当前阶段、请求意图、可选备注，以及相关漏斗元数据。"
            },
            {
              title: "服务边界",
              body: "Tideus 不是政府服务，也不是律师事务所。保存的数据是为了支持产品内的案件准备工作流与结构化审查模块。"
            },
            {
              title: "联系方式",
              body: `如果有隐私相关问题，请联系 ${siteConfig.supportEmail}。`
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
