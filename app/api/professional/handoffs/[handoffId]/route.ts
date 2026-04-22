import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { isHandoffRequestStatus } from "@/lib/handoffs";
import { getCurrentLocale } from "@/lib/i18n/server";
import { pickLocale } from "@/lib/i18n/workspace";
import { updateProfessionalHandoffOperation } from "@/lib/server/handoffs";

type ProfessionalHandoffRouteProps = {
  params: Promise<{
    handoffId: string;
  }>;
};

export async function PATCH(request: Request, { params }: ProfessionalHandoffRouteProps) {
  const { handoffId } = await params;
  const locale = await getCurrentLocale();
  const body = (await request.json().catch(() => null)) as {
    status?: unknown;
    internalNotes?: unknown;
  } | null;

  if (body?.status !== undefined && !isHandoffRequestStatus(body.status)) {
    return NextResponse.json(
      {
        message: pickLocale(locale, "交接状态不受支持。", "交接狀態不受支援。")
      },
      { status: 400 }
    );
  }

  if (typeof body?.internalNotes === "string" && body.internalNotes.length > 2000) {
    return NextResponse.json(
      {
        message: pickLocale(locale, "内部备注请控制在 2000 个字符以内。", "內部備註請控制在 2000 個字元以內。")
      },
      { status: 400 }
    );
  }

  let result: Awaited<ReturnType<typeof updateProfessionalHandoffOperation>>;

  try {
    result = await updateProfessionalHandoffOperation({
      handoffId,
      nextStatus: isHandoffRequestStatus(body?.status) ? body.status : undefined,
      internalNotes: typeof body?.internalNotes === "string" ? body.internalNotes : undefined
    });
  } catch (error) {
    console.error("Unable to update professional handoff operation", error);

    return NextResponse.json(
      {
        message: pickLocale(locale, "暂时无法更新交接记录。", "暫時無法更新交接紀錄。")
      },
      { status: 500 }
    );
  }

  switch (result.status) {
    case "updated":
      revalidatePath("/professional/dashboard");
      revalidatePath("/professional/handoffs");
      revalidatePath(`/professional/handoffs/${handoffId}`);

      return NextResponse.json({
        message: pickLocale(locale, "交接记录已更新。", "交接紀錄已更新。"),
        handoffRequest: result.record
      });
    case "not_found":
      return NextResponse.json(
        {
          message: pickLocale(locale, "找不到这条交接请求。", "找不到這條交接請求。")
        },
        { status: 404 }
      );
    case "unauthorized":
      return NextResponse.json(
        {
          message: pickLocale(locale, "当前账号没有权限处理这条交接请求。", "目前帳號沒有權限處理這條交接請求。")
        },
        { status: 403 }
      );
    case "invalid_notes":
      return NextResponse.json(
        {
          message: pickLocale(locale, "内部备注请控制在 2000 个字符以内。", "內部備註請控制在 2000 個字元以內。")
        },
        { status: 400 }
      );
    case "invalid_status":
      return NextResponse.json(
        {
          message: pickLocale(locale, "交接状态不受支持。", "交接狀態不受支援。")
        },
        { status: 400 }
      );
  }
}
