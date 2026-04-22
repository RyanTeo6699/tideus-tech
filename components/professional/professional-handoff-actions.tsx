"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { AppLocale } from "@/lib/i18n/config";
import { pickLocale } from "@/lib/i18n/workspace";
import type { HandoffRequestStatus } from "@/lib/handoffs";

type ProfessionalHandoffActionsProps = {
  handoffId: string;
  locale: AppLocale;
  currentStatus: string;
  internalNotes: string | null;
};

export function ProfessionalHandoffActions({
  handoffId,
  locale,
  currentStatus,
  internalNotes
}: ProfessionalHandoffActionsProps) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [notes, setNotes] = useState(internalNotes ?? "");
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  async function updateHandoff(payload: { status?: HandoffRequestStatus; internalNotes?: string }) {
    setMessage("");

    const response = await fetch(`/api/professional/handoffs/${handoffId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
    const data = (await response.json().catch(() => null)) as { message?: string; status?: string } | null;

    if (!response.ok) {
      setMessage(data?.message || pickLocale(locale, "暂时无法更新交接状态。", "暫時無法更新交接狀態。"));
      return;
    }

    if (payload.status) {
      setStatus(payload.status);
    }

    setMessage(data?.message || pickLocale(locale, "交接记录已更新。", "交接紀錄已更新。"));
    startTransition(() => {
      router.refresh();
    });
  }

  const actions = getStatusActions(status);

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-semibold text-slate-950">{pickLocale(locale, "处理状态", "處理狀態")}</p>
        {actions.length > 0 ? (
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            {actions.map((item) => (
              <Button
                disabled={isPending}
                key={item.status}
                onClick={() => void updateHandoff({ status: item.status })}
                size="sm"
                variant={item.status === "in_review" ? "default" : "outline"}
              >
                {item.label}
              </Button>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-sm leading-6 text-slate-700">
            {pickLocale(locale, "此交接已经关闭。可保留备注，后续如需重新处理可再扩展流程。", "此交接已經關閉。可保留備註，後續如需重新處理可再擴展流程。")}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="professional-handoff-internal-notes">
          {pickLocale(locale, "内部备注", "內部備註")}
        </Label>
        <Textarea
          id="professional-handoff-internal-notes"
          maxLength={2000}
          onChange={(event) => setNotes(event.target.value)}
          placeholder={pickLocale(
            locale,
            "仅供专业端内部后续审阅准备使用，不会显示给 C 端用户。",
            "僅供專業端內部後續審閱準備使用，不會顯示給 C 端使用者。"
          )}
          value={notes}
        />
        <p className="text-xs leading-5 text-slate-500">
          {pickLocale(locale, "最多 2000 个字符。", "最多 2000 個字元。")}
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button disabled={isPending} onClick={() => void updateHandoff({ internalNotes: notes })} size="sm">
          {pickLocale(locale, "保存内部备注", "儲存內部備註")}
        </Button>
        {message ? <p className="text-sm leading-6 text-slate-700">{message}</p> : null}
      </div>
    </div>
  );

  function getStatusActions(value: string) {
    switch (value) {
      case "new":
        return [
          {
            status: "opened" as const,
            label: pickLocale(locale, "标记为已打开", "標記為已開啟")
          },
          {
            status: "in_review" as const,
            label: pickLocale(locale, "开始审阅", "開始審閱")
          },
          {
            status: "closed" as const,
            label: pickLocale(locale, "关闭交接", "關閉交接")
          }
        ];
      case "opened":
        return [
          {
            status: "in_review" as const,
            label: pickLocale(locale, "开始审阅", "開始審閱")
          },
          {
            status: "closed" as const,
            label: pickLocale(locale, "关闭交接", "關閉交接")
          }
        ];
      case "in_review":
        return [
          {
            status: "closed" as const,
            label: pickLocale(locale, "关闭交接", "關閉交接")
          }
        ];
      default:
        return [];
    }
  }
}
