import Link from "next/link";

import { PageHero } from "@/components/site/page-hero";
import { SectionContainer } from "@/components/site/section-container";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentProfileContext } from "@/lib/profile-server";
import { getLocaleContext } from "@/lib/i18n/server";
import { pickLocale } from "@/lib/i18n/workspace";

export default async function ForProfessionalsPage() {
  const { locale } = await getLocaleContext();
  const { user } = await getCurrentProfileContext();
  const primaryHref = user ? "/professional/dashboard" : "/professional/login";

  return (
    <>
      <PageHero
        actions={
          <>
            <Link className={buttonVariants({ size: "lg" })} href={primaryHref}>
              {user
                ? pickLocale(locale, "打开专业仪表板", "打開專業儀表板")
                : pickLocale(locale, "进入专业登录", "進入專業登入")}
            </Link>
            <Link className={buttonVariants({ variant: "outline", size: "lg" })} href="/book-demo">
              {pickLocale(locale, "预约专业端演示", "預約專業端示範")}
            </Link>
          </>
        }
        description={pickLocale(
          locale,
          "Tideus 的专业端不是独立客户管理后台，也不是完整办案系统。当前重点是让专业用户安全接收、查看并开始处理 C 端交接请求，同时保留清晰的后续扩展边界。",
          "Tideus 的專業端不是獨立客戶管理後台，也不是完整辦案系統。目前重點是讓專業使用者安全接收、查看並開始處理 C 端交接請求，同時保留清晰的後續擴展邊界。"
        )}
        eyebrow={pickLocale(locale, "专业端", "專業端")}
        title={pickLocale(locale, "专业端现在是交接审阅的运营后台基础。", "專業端現在是交接審閱的營運後台基礎。")}
      />

      <SectionContainer className="pb-14">
        <div className="grid gap-6 lg:grid-cols-3">
          <FeatureCard
            description={pickLocale(
              locale,
              "专业端保留身份、组织、成员关系和专业权限这些后续一定要稳定存在的数据模型。",
              "專業端保留身分、組織、成員關係和專業權限這些後續一定要穩定存在的資料模型。"
            )}
            eyebrow={pickLocale(locale, "数据模型", "資料模型")}
            title={pickLocale(locale, "专业档案先于复杂工作流", "專業檔案先於複雜工作流程")}
          />
          <FeatureCard
            description={pickLocale(
              locale,
              "组织层保留名称、slug、状态、成员关系和可见性边界，不提前做完整团队管理或复杂权限矩阵。",
              "組織層保留名稱、slug、狀態、成員關係和可見性邊界，不提前做完整團隊管理或複雜權限矩陣。"
            )}
            eyebrow={pickLocale(locale, "组织骨架", "組織骨架")}
            title={pickLocale(locale, "先有组织结构，再谈队列与分配", "先有組織結構，再談佇列與分配")}
          />
          <FeatureCard
            description={pickLocale(
              locale,
              "当前已经接入交接队列、交接详情和基础状态推进；未来重点仍是审阅判断与交接延续，而不是扩展成宽泛后台。",
              "目前已經接入交接佇列、交接詳情和基礎狀態推進；未來重點仍是審閱判斷與交接延續，而不是擴展成寬泛後台。"
            )}
            eyebrow={pickLocale(locale, "交接运营", "交接營運")}
            title={pickLocale(locale, "审阅与交接是专业端主线", "審閱與交接是專業端主線")}
          />
        </div>
      </SectionContainer>

      <SectionContainer className="pb-14">
        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <Card>
            <CardHeader>
              <Badge variant="secondary" className="w-fit">
                {pickLocale(locale, "当前开放范围", "目前開放範圍")}
              </Badge>
              <CardTitle>{pickLocale(locale, "当前开放交接运营基础，不做完整业务流。", "目前開放交接營運基礎，不做完整業務流程。")}</CardTitle>
              <CardDescription>
                {pickLocale(
                  locale,
                  "这样可以让 C 端工作流继续前进，同时让 B 端已经具备安全收件、查看交接包和推进基础状态的边界。",
                  "這樣可以讓 C 端工作流程繼續前進，同時讓 B 端已經具備安全收件、查看交接包和推進基礎狀態的邊界。"
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                pickLocale(locale, "专业登录入口", "專業登入入口"),
                pickLocale(locale, "专业档案模型", "專業檔案模型"),
                pickLocale(locale, "组织与成员骨架", "組織與成員骨架"),
                pickLocale(locale, "交接队列与详情查看", "交接佇列與詳情查看"),
                pickLocale(locale, "基础状态推进与内部备注", "基礎狀態推進與內部備註")
              ].map((item) => (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700" key={item}>
                  {item}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Badge variant="secondary" className="w-fit">
                {pickLocale(locale, "当前不做", "目前不做")}
              </Badge>
              <CardTitle>{pickLocale(locale, "避免把专业端过早做成后台产品。", "避免把專業端過早做成後台產品。")}</CardTitle>
              <CardDescription>
                {pickLocale(
                  locale,
                  "Tideus 现在仍以 C 端案件工作流为主。专业端的目标是为后续接案、审阅和交接提供干净接口，而不是抢先铺开大而杂的后台。",
                  "Tideus 現在仍以 C 端案件工作流程為主。專業端的目標是為後續接案、審閱和交接提供乾淨介面，而不是搶先鋪開大而雜的後台。"
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                pickLocale(locale, "完整客户管理后台", "完整客戶管理後台"),
                pickLocale(locale, "完整案件分配系统", "完整案件分配系統"),
                pickLocale(locale, "复杂团队权限后台", "複雜團隊權限後台"),
                pickLocale(locale, "全面专业审阅流程", "全面專業審閱流程")
              ].map((item) => (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-slate-700" key={item}>
                  {item}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </SectionContainer>
    </>
  );
}

function FeatureCard({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <Card>
      <CardHeader>
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">{eyebrow}</p>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
    </Card>
  );
}
