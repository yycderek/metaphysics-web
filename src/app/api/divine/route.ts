// API route：断课 → AI Provider 流式解读（SSE 透传）
// 铁律：前端已用 TS 引擎起好课（结果 raw 随请求传入），本路由只负责解读，不自行起课
// 阶段5：按算法 ID 分发断课模板（daliuren/xiaoliuren/通用 fallback），平台不绑定具体算法
import { NextRequest } from "next/server";
import { resolveAIConfig, streamChat, type UserAIConfig } from "@/lib/aiProvider";
import type { ChatMessage } from "@/lib/aiTypes";
import "@/lib/divine"; // 副作用导入：注册内置断课模板
import { getDivineTemplate, genericDivineTemplate, type Season } from "@/lib/divine";
import type { StepResult } from "@/lib/algorithms/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ChatMsg {
  role: "user" | "assistant";
  content: string;
}

interface DivineRequestBody {
  algorithmId: string;
  algorithmName?: string;
  input?: Record<string, string | number | undefined>;
  raw: unknown;
  question: string;
  season: Season;
  steps?: StepResult[];
  history?: ChatMsg[]; // 追问历史（不含本轮）
  aiConfig?: UserAIConfig; // 用户自定义 AI 配置（设置面板，可省略）
}

export async function POST(req: NextRequest) {
  let body: DivineRequestBody;
  try {
    body = (await req.json()) as DivineRequestBody;
  } catch {
    return Response.json({ error: "请求体不是合法 JSON" }, { status: 400 });
  }

  const { algorithmId, algorithmName, input, raw, question, season, steps, history, aiConfig } = body;
  if (!algorithmId || raw == null || !question?.trim()) {
    return Response.json({ error: "缺少算法标识、结果数据或问题" }, { status: 400 });
  }
  if (!["春", "夏", "秋", "冬", "四季"].includes(season)) {
    return Response.json({ error: "季节参数非法" }, { status: 400 });
  }

  const config = resolveAIConfig(aiConfig);
  if (!config.apiKey) {
    return Response.json(
      { error: "未配置 AI API Key（请在 AI 断课面板的 ⚙️ 设置中填写，或设置环境变量 DEEPSEEK_API_KEY）" },
      { status: 500 },
    );
  }

  // 按算法 ID 分发断课模板；未注册的算法回退通用模板
  const template = getDivineTemplate(algorithmId) ?? genericDivineTemplate;
  const base = template.buildMessages({
    algorithmId,
    algorithmName: algorithmName ?? algorithmId,
    input,
    raw,
    question,
    season,
    steps,
  });
  const historyMsgs: ChatMsg[] = (history ?? []).slice(-8); // 最多保留最近 8 轮追问
  const messages = [
    ...base.slice(0, 1), // system
    ...historyMsgs.map((h): ChatMessage => ({ role: h.role, content: h.content })),
    ...base.slice(1), // 结果上下文 + 本轮问题
  ];

  try {
    const upstream = await streamChat(config, messages);

    if (!upstream.ok) {
      const errText = await upstream.text().catch(() => "");
      return Response.json(
        { error: `AI 上游错误 ${upstream.status}: ${errText.slice(0, 200)}` },
        { status: 502 },
      );
    }

    // 透传 SSE 流
    const reader = upstream.body?.getReader();
    if (!reader) {
      return Response.json({ error: "上游无响应体" }, { status: 502 });
    }

    const stream = new ReadableStream({
      async start(controller) {
        const decoder = new TextDecoder();
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            controller.enqueue(decoder.decode(value, { stream: true }));
          }
        } catch (e) {
          controller.error(e);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (e) {
    return Response.json({ error: `请求 AI 失败: ${(e as Error).message}` }, { status: 502 });
  }
}
