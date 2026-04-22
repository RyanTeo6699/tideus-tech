import { NextResponse } from "next/server";

import { parseKnowledgeRefreshRequest, saveKnowledgeRefreshSnapshot } from "@/lib/knowledge/refresh";

export async function POST(request: Request) {
  const configuredToken = process.env.TIDEUS_KNOWLEDGE_REFRESH_TOKEN?.trim();

  if (!configuredToken) {
    return NextResponse.json(
      {
        message: "知识刷新令牌尚未配置。"
      },
      { status: 503 }
    );
  }

  const providedToken = request.headers.get("x-tideus-knowledge-refresh-token")?.trim();

  if (!providedToken || providedToken !== configuredToken) {
    return NextResponse.json(
      {
        message: "知识刷新认证失败。"
      },
      { status: 401 }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = parseKnowledgeRefreshRequest(body);

  if (!parsed.success) {
    return NextResponse.json({ message: parsed.message }, { status: 400 });
  }

  let error: Awaited<ReturnType<typeof saveKnowledgeRefreshSnapshot>>;

  try {
    error = await saveKnowledgeRefreshSnapshot(parsed.data);
  } catch (refreshError) {
    console.error("Unable to persist knowledge refresh snapshot", refreshError);

    return NextResponse.json(
      {
        message: "知识刷新暂时无法写入。"
      },
      { status: 500 }
    );
  }

  if (error) {
    return NextResponse.json(
      {
        message: error.message
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    packVersion: parsed.data.packVersion,
    scenarioTag: parsed.data.scenarioTag,
    sourceVersion: parsed.data.sourceVersion,
    refreshedAt: parsed.data.refreshedAt
  });
}
