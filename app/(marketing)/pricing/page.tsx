import Link from "next/link";

import { EventLink } from "@/components/site/event-link";
import { SectionContainer } from "@/components/site/section-container";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getLocaleContext } from "@/lib/i18n/server";
import { pickLocale } from "@/lib/i18n/workspace";
import {
  formatConsumerPlanName,
  getConsumerPlanDefinitions,
  getConsumerPlanState
} from "@/lib/plans";
import { getCurrentProfileContext } from "@/lib/profile-server";

const comparisonRows = [
  {
    key: "workspace-foundation",
    free: true,
    pro: true
  },
  {
    key: "structured-review",
    free: true,
    pro: true
  },
  {
    key: "workspace-case-questions",
    free: false,
    pro: true
  },
  {
    key: "workspace-material-actions",
    free: false,
    pro: true
  },
  {
    key: "review-delta",
    free: false,
    pro: true
  },
  {
    key: "handoff-intelligence",
    free: false,
    pro: true
  }
] as const;

export default async function PricingPage() {
  const { locale } = await getLocaleContext();
  const { user, profile } = await getCurrentProfileContext();
  const planState = getConsumerPlanState(profile);
  const plans = getConsumerPlanDefinitions(locale);
  const currentPlanName = formatConsumerPlanName(planState.tier, locale);

  return (
    <>
      <SectionContainer className="py-20">
        <div className="max-w-4xl">
          <Badge variant="secondary" className="mb-5">
            {pickLocale(locale, "Free / Pro 方案", "Free / Pro 方案")}
          </Badge>
          <h1 className="font-serif text-5xl text-foreground">
            {pickLocale(locale, "让免费版和 Pro 在工作流价值上真正分开。", "讓免費版和 Pro 在工作流程價值上真正分開。")}
          </h1>
          <p className="mt-6 max-w-3xl text-base leading-8 text-muted-foreground">
            {pickLocale(
              locale,
              "Tideus 不用“更多次数”来假装分层。Free 保留案件、材料和基础审查工作流；Pro 增加持续 AI 协作、变化追踪和更强的交接输出。",
              "Tideus 不用「更多次數」來假裝分層。免費版保留案件、材料和基礎審查工作流程；Pro 增加持續 AI 協作、變化追蹤和更強的交接輸出。"
            )}
          </p>
          <div className="mt-8 rounded-[28px] border border-amber-200 bg-amber-50 px-6 py-5 text-sm leading-7 text-slate-800">
            <p className="font-semibold">
              {pickLocale(locale, "当前计划状态", "目前方案狀態")} · {currentPlanName}
            </p>
            <p className="mt-2">
              {pickLocale(
                locale,
                user
                  ? "当前阶段未接入在线支付。Pro 先通过预约演示与人工开通，避免在价值分层尚未稳定前过早接入计费。"
                  : "当前阶段未接入在线支付。你可以先体验 Free，再通过预约演示申请开通 Pro。",
                user
                  ? "目前階段未接入線上支付。Pro 先透過預約示範與人工開通，避免在價值分層尚未穩定前過早接入計費。"
                  : "目前階段未接入線上支付。你可以先體驗免費版，再透過預約示範申請開通 Pro。"
              )}
            </p>
          </div>
        </div>
      </SectionContainer>

      <SectionContainer className="pb-14">
        <div className="grid gap-6 lg:grid-cols-2">
          {plans.map((plan) => {
            const isCurrentPlan = planState.tier === plan.tier;

            return (
              <Card
                className={plan.tier === "pro" ? "border-emerald-200 bg-emerald-50/60" : "border-border bg-background"}
                key={plan.tier}
              >
                <CardHeader>
                  <div className="flex items-center justify-between gap-3">
                    <Badge variant={plan.tier === "pro" ? "secondary" : "default"}>{plan.badge}</Badge>
                    {isCurrentPlan ? (
                      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
                        {pickLocale(locale, "当前方案", "目前方案")}
                      </span>
                    ) : null}
                  </div>
                  <CardTitle className="text-3xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.headline}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{plan.activation}</p>
                    <p className="mt-2 text-sm leading-7 text-slate-700">{plan.summary}</p>
                  </div>
                  <div className="space-y-3">
                    {plan.features.map((item) => (
                      <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-700" key={item}>
                        {item}
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    {plan.tier === "free" ? (
                      <>
                        <EventLink
                          className={buttonVariants({ size: "sm" })}
                          eventType="landing_cta_clicked"
                          href={user ? "/dashboard" : "/start-case"}
                          metadata={{
                            sourceSurface: "pricing-page",
                            cta: user ? "open-dashboard" : "start-free",
                            requestedPlan: "free"
                          }}
                        >
                          {user ? pickLocale(locale, "打开案件工作台", "打開案件工作台") : plan.ctaLabel}
                        </EventLink>
                        <Link className={buttonVariants({ variant: "outline", size: "sm" })} href="/case-question">
                          {pickLocale(locale, "先从提问入口体验", "先從提問入口體驗")}
                        </Link>
                      </>
                    ) : (
                      <>
                        <EventLink
                          className={buttonVariants({ size: "sm" })}
                          eventType="book_demo_clicked"
                          href="/book-demo"
                          metadata={{
                            sourceSurface: "pricing-page",
                            cta: "upgrade-pro",
                            requestedPlan: "pro"
                          }}
                        >
                          {plan.ctaLabel}
                        </EventLink>
                        <Link className={buttonVariants({ variant: "outline", size: "sm" })} href="/start-case">
                          {pickLocale(locale, "先用 Free 建立案件", "先用免費版建立案件")}
                        </Link>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </SectionContainer>

      <SectionContainer className="pb-14">
        <div className="mb-8 max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            {pickLocale(locale, "能力分层", "能力分層")}
          </p>
          <h2 className="mt-4 font-serif text-4xl text-foreground">
            {pickLocale(locale, "差异放在工作流质量上，不放在无意义的额度上。", "差異放在工作流程品質上，不放在無意義的額度上。")}
          </h2>
        </div>
        <div className="overflow-hidden rounded-[28px] border border-border bg-background">
          <div className="grid grid-cols-[1.3fr_0.7fr_0.7fr] border-b border-border bg-slate-50 px-5 py-4 text-sm font-semibold text-slate-700">
            <div>{pickLocale(locale, "能力", "能力")}</div>
            <div>{formatConsumerPlanName("free", locale)}</div>
            <div>Pro</div>
          </div>
          {comparisonRows.map((row, index) => (
            <div
              className="grid grid-cols-[1.3fr_0.7fr_0.7fr] px-5 py-4 text-sm leading-6 text-slate-700"
              key={row.key}
            >
              {index > 0 ? <div className="col-span-3 -mt-4 mb-4 border-t border-border" /> : null}
              <div>{getComparisonLabel(row.key, locale)}</div>
              <div>{row.free ? pickLocale(locale, "包含", "包含") : pickLocale(locale, "不包含", "不包含")}</div>
              <div>{row.pro ? pickLocale(locale, "包含", "包含") : pickLocale(locale, "不包含", "不包含")}</div>
            </div>
          ))}
        </div>
      </SectionContainer>

      <SectionContainer className="pb-24">
        <Card className="border-slate-200 bg-slate-50">
          <CardHeader>
            <CardTitle>{pickLocale(locale, "什么场景更适合升级到 Pro", "什麼情境更適合升級到 Pro")}</CardTitle>
            <CardDescription>
              {pickLocale(
                locale,
                "如果你已经进入连续推进阶段，Pro 的价值会明显高于“多几次使用机会”。",
                "如果你已經進入連續推進階段，Pro 的價值會明顯高於「多幾次使用機會」。"
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 lg:grid-cols-3">
            <CapabilityHint
              body={pickLocale(
                locale,
                "你会反复追问同一个案件：为什么还是缺、为什么还是风险、下一步到底先做什么。",
                "你會反覆追問同一個案件：為什麼還是缺、為什麼還是風險、下一步到底先做什麼。"
              )}
              title={pickLocale(locale, "需要持续 AI 协作", "需要持續 AI 協作")}
            />
            <CapabilityHint
              body={pickLocale(
                locale,
                "你已经生成过不止一版审查，需要知道哪些地方在变好、哪些地方仍阻塞交接。",
                "你已經產生過不只一版審查，需要知道哪些地方在變好、哪些地方仍阻塞交接。"
              )}
              title={pickLocale(locale, "需要版本变化判断", "需要版本變化判斷")}
            />
            <CapabilityHint
              body={pickLocale(
                locale,
                "你准备把结果发给专业人士、自查或内部同事，希望导出内容更适合下一步人工处理。",
                "你準備把結果發給專業人士、自查或內部同事，希望匯出內容更適合下一步人工處理。"
              )}
              title={pickLocale(locale, "需要更强交接输出", "需要更強交接輸出")}
            />
          </CardContent>
        </Card>
      </SectionContainer>
    </>
  );
}

function CapabilityHint({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <p className="text-base font-semibold text-slate-950">{title}</p>
      <p className="mt-3 text-sm leading-7 text-slate-700">{body}</p>
    </div>
  );
}

function getComparisonLabel(
  key: (typeof comparisonRows)[number]["key"],
  locale: "zh-CN" | "zh-TW"
) {
  switch (key) {
    case "workspace-foundation":
      return pickLocale(locale, "保存案件、材料状态与继续路径", "儲存案件、材料狀態與繼續路徑");
    case "structured-review":
      return pickLocale(locale, "结构化审查与基础导出摘要", "結構化審查與基礎匯出摘要");
    case "workspace-case-questions":
      return pickLocale(locale, "案件内 AI 提问与 why / next-step 解释", "案件內 AI 提問與 why / next-step 解釋");
    case "workspace-material-actions":
      return pickLocale(locale, "材料工作动作建议与补充材料提示", "材料工作動作建議與補充材料提示");
    case "review-delta":
      return pickLocale(locale, "审查版本变化对比", "審查版本變化對比");
    case "handoff-intelligence":
      return pickLocale(locale, "更强的交接摘要与人工审阅提示", "更強的交接摘要與人工審閱提示");
  }
}
