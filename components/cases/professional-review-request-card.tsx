"use client";

import { useMemo, useState } from "react";

import type { HandoffRequestRecord } from "@/lib/handoffs";
import { formatReadinessStatus } from "@/lib/case-workflows";
import { formatHandoffRequestStatus } from "@/lib/handoffs";
import { formatAppDateTime } from "@/lib/i18n/format";
import { useLocaleContext } from "@/lib/i18n/client";
import { pickLocale } from "@/lib/i18n/workspace";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type ProfessionalReviewRequestCardProps = {
  caseId: string;
  initialHandoffRequest: HandoffRequestRecord | null;
};

export function ProfessionalReviewRequestCard({
  caseId,
  initialHandoffRequest
}: ProfessionalReviewRequestCardProps) {
  const { locale, messages } = useLocaleContext();
  const [note, setNote] = useState("");
  const [handoffRequest, setHandoffRequest] = useState<HandoffRequestRecord | null>(initialHandoffRequest);
  const initialMessage = useMemo(
    () =>
      handoffRequest
        ? pickLocale(
            locale,
            "当前案件已经进入专业端收件箱。平台会基于本次导出包与最新审查快照保留这条交接记录。",
            "目前案件已經進入專業端收件箱。平台會根據本次匯出包與最新審查快照保留這條交接記錄。"
          )
        : pickLocale(
            locale,
            "请求会把当前最新导出包、审查摘要和关键事实固化为一条专业审阅 handoff 记录。",
            "請求會把目前最新匯出包、審查摘要和關鍵事實固化為一條專業審閱 handoff 記錄。"
          ),
    [handoffRequest, locale]
  );
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState(initialMessage);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setStatus("loading");
    setMessage(pickLocale(locale, "正在创建专业审阅请求...", "正在建立專業審閱請求..."));

    try {
      const response = await fetch(`/api/cases/${caseId}/handoff`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          note
        })
      });

      const data = (await response.json().catch(() => null)) as
        | {
            message?: string;
            handoffRequest?: HandoffRequestRecord;
          }
        | null;

      if (response.status === 409 && data?.handoffRequest) {
        setHandoffRequest(data.handoffRequest);
        setStatus("success");
        setMessage(
          data.message ||
            pickLocale(locale, "这个案件已经有一条活跃的专业审阅请求。", "這個案件已經有一條活躍的專業審閱請求。")
        );
        return;
      }

      if (!response.ok || !data?.handoffRequest) {
        throw new Error(
          data?.message ||
            pickLocale(locale, "暂时无法创建专业审阅请求。", "暫時無法建立專業審閱請求。")
        );
      }

      setHandoffRequest(data.handoffRequest);
      setStatus("success");
      setMessage(
        data.message ||
          pickLocale(locale, "专业审阅请求已发送。", "專業審閱請求已送出。")
      );
    } catch (error) {
      setStatus("error");
      setMessage(
        error instanceof Error
          ? error.message
          : pickLocale(locale, "暂时无法创建专业审阅请求。", "暫時無法建立專業審閱請求。")
      );
    }
  }

  const submittedSummary =
    handoffRequest?.packet?.handoffIntelligence?.externalSummary ||
    handoffRequest?.packet?.resultSummary ||
    pickLocale(locale, "当前没有可显示的交接摘要。", "目前沒有可顯示的交接摘要。");

  return (
    <Card className="border-slate-200 bg-white shadow-none print:hidden">
      <CardHeader>
        <Badge variant="secondary" className="w-fit">
          {pickLocale(locale, "请求专业审阅", "請求專業審閱")}
        </Badge>
        <CardTitle>{pickLocale(locale, "把当前导出包送入专业端收件箱", "把目前匯出包送入專業端收件箱")}</CardTitle>
        <CardDescription>
          {pickLocale(
            locale,
            "这一步不会创建完整协作流，只会生成一条结构化交接记录，供未来专业审阅和接案处理继续使用。",
            "這一步不會建立完整協作流程，只會產生一條結構化交接記錄，供未來專業審閱和接案處理繼續使用。"
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {handoffRequest ? (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <InfoCard
                label={pickLocale(locale, "请求状态", "請求狀態")}
                value={formatHandoffRequestStatus(handoffRequest.handoffRequest.status, locale)}
              />
              <InfoCard
                label={pickLocale(locale, "提交时间", "提交時間")}
                value={formatAppDateTime(handoffRequest.handoffRequest.created_at, locale)}
              />
              <InfoCard
                label={pickLocale(locale, "关联审查版本", "關聯審查版本")}
                value={pickLocale(
                  locale,
                  `版本 ${handoffRequest.handoffRequest.requested_review_version}`,
                  `版本 ${handoffRequest.handoffRequest.requested_review_version}`
                )}
              />
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
              <p className="font-semibold uppercase tracking-[0.18em] text-slate-500">
                {pickLocale(locale, "当前交接摘要", "目前交接摘要")}
              </p>
              <p className="mt-2">{submittedSummary}</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <InfoCard
                label={pickLocale(locale, "审查就绪状态", "審查就緒狀態")}
                value={formatReadinessStatus(handoffRequest.handoffRequest.requested_readiness_status, locale)}
              />
              <InfoCard
                label={pickLocale(locale, "客户备注", "客戶備註")}
                value={
                  handoffRequest.handoffRequest.request_note ||
                  pickLocale(locale, "本次请求没有附加备注。", "本次請求沒有附加備註。")
                }
              />
            </div>
          </div>
        ) : (
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="professional-review-request-note">
                {pickLocale(locale, "可选备注", "可選備註")}
              </Label>
              <Textarea
                id="professional-review-request-note"
                maxLength={1000}
                onChange={(event) => setNote(event.target.value)}
                placeholder={pickLocale(
                  locale,
                  "例如：我希望专业人士重点看哪些缺口、风险或时间问题。",
                  "例如：我希望專業人士重點看哪些缺口、風險或時間問題。"
                )}
                rows={4}
                value={note}
              />
              <p className="text-sm leading-6 text-slate-600">
                {pickLocale(
                  locale,
                  "可说明你希望专业端优先关注的问题。这不会改变导出包结构，只会附加到 handoff 记录里。",
                  "可說明你希望專業端優先關注的問題。這不會改變匯出包結構，只會附加到 handoff 記錄裡。"
                )}
              </p>
            </div>

            <div
              className={cn("rounded-2xl border p-4 text-sm leading-6", {
                "border-slate-200 bg-slate-50 text-slate-700": status === "idle" || status === "loading",
                "border-emerald-200 bg-emerald-50 text-slate-900": status === "success",
                "border-red-200 bg-red-50 text-red-700": status === "error"
              })}
            >
              <p className="font-semibold uppercase tracking-[0.18em]">
                {status === "loading"
                  ? messages.common.working
                  : status === "success"
                    ? messages.common.saved
                    : status === "error"
                      ? messages.common.error
                      : messages.common.ready}
              </p>
              <p className="mt-2">{status === "idle" ? initialMessage : message}</p>
            </div>

            <Button disabled={status === "loading"} type="submit">
              {status === "loading"
                ? pickLocale(locale, "发送中...", "送出中...")
                : pickLocale(locale, "请求专业审阅", "請求專業審閱")}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-2 text-sm leading-6 text-slate-900">{value}</p>
    </div>
  );
}
