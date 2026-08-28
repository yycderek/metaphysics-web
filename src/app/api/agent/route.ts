// API route：智能占卜 Agent（P0）——模型通过 divinate 工具自主起课，最终输出结构化断语 JSON。
// 铁律：起课永远由本服务端引擎执行（buildDivination），模型只做参数决策与解读。
import { NextRequest } from "next/server";
import "@/plugins"; // 副作用导入：注册本地算法（xiaoliuren 等）供服务端起课
import { resolveAIConfig, chatCompletion } from "@/lib/aiProvider";
import { buildAgentSystem, divinateTool, askClarificationTool } from "@/lib/agent/prompt";
import { runAgentLoop } from "@/lib/agent/loop";
import { derivePersona } from "@/lib/agent/params";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_QUESTION_LEN = 2000;
const MAX_MSG_LEN = 6000;

function sanitizeHistory(raw: unknown) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((m) => m as { role?: string; content?: unknown })
    .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .slice(-14)
    .map((m) => ({
      role: m.role as "user" | "assistant",
      content: (m.content as string).slice(0, MAX_MSG_LEN),
    }));
}

/** 先前已起的卦（卦记忆），送入上下文供模型复读 */
function sanitizeDivinations(raw: unknown): { summary: string; facts: string }[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((m) => m as { summary?: unknown; facts?: unknown })
    .filter((m) => typeof m.summary === "string" && typeof m.facts === "string")
    .slice(-6)
    .map((m) => ({
      summary: (m.summary as string).slice(0, 200),
      facts: (m.facts as string).slice(0, 600),
    }));
}

export async function POST(req: NextRequest) {
  let body: {
    question?: string;
    history?: unknown;
    divinations?: unknown;
    profile?: string;
    aiConfig?: Parameters<typeof resolveAIConfig>[0];
  };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return Response.json({ ok: false, error: "请求体不是合法 JSON" }, { status: 400 });
  }

  const question = body.question?.trim() ?? "";
  if (!question) {
    return Response.json({ ok: false, error: "缺少问事内容" }, { status: 400 });
  }
  if (question.length > MAX_QUESTION_LEN) {
    return Response.json(
      { ok: false, error: `问事过长（最多 ${MAX_QUESTION_LEN} 字）` },
      { status: 400 },
    );
  }

  const config = resolveAIConfig(body.aiConfig);
  if (!config.apiKey) {
    return Response.json(
      {
        ok: false,
        error: "未配置 AI API Key（请在面板设置或环境变量 AI_API_KEY / DEEPSEEK_API_KEY）",
      },
      { status: 500 },
    );
  }

  const encoder = new TextEncoder();
  // SSE 流式返回 agent 过程：progress 事件 + 最终 done/clarify/error
  const stream = new ReadableStream({
    async start(controller) {
      const send = (payload: unknown) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
      try {
        const prior = sanitizeDivinations(body.divinations);
        const persona = derivePersona(body.profile);
        const result = await runAgentLoop({
          system: buildAgentSystem(prior, persona),
          question,
          history: sanitizeHistory(body.history),
          callLLM: (messages) =>
            chatCompletion(config, messages, [divinateTool, askClarificationTool]),
          onEvent: (e) => send(e),
        });
        send({
          type: "done",
          ok: result.ok,
          kind: result.kind,
          result: result.result,
          meta: result.meta,
          question: result.question,
          error: result.error,
        });
      } catch (e) {
        send({ type: "error", error: `AI 请求失败: ${(e as Error).message}` });
      } finally {
        controller.close();
      }
    },
    cancel() {},
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
