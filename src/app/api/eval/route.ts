// API route：断课质量评估。对一个 provider（可切多个 model）跑黄金题库，SSE 流式返回逐题结果 + 汇总。
import { NextRequest } from "next/server";
import "@/plugins"; // 注册本地算法供引擎起课
import { resolveAIConfig } from "@/lib/aiProvider";
import { guardAI, guardResponse } from "@/lib/guard";
import { runEvalCase, type EvalCaseResult } from "@/lib/eval/run";
import { EVAL_CASES } from "@/lib/eval/cases";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_MODELS = 6;

function sanitizeModels(raw: unknown): string[] {
  if (typeof raw === "string")
    return raw
      .split(/[,，\s]+/)
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, MAX_MODELS);
  if (Array.isArray(raw))
    return raw
      .map(String)
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, MAX_MODELS);
  return [];
}

export async function POST(req: NextRequest) {
  let body: { models?: unknown; 应验?: unknown; aiConfig?: Parameters<typeof resolveAIConfig>[0] };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return Response.json({ ok: false, error: "请求体不是合法 JSON" }, { status: 400 });
  }
  const models = sanitizeModels(body.models);
  if (!models.length) {
    return Response.json(
      { ok: false, error: "请提供至少一个模型名（如 deepseek-v4-flash）" },
      { status: 400 },
    );
  }
  const g = guardAI(req, 5, 50);
  const denied = guardResponse(g);
  if (denied) return denied;
  const base = resolveAIConfig(body.aiConfig);
  if (!base.apiKey) {
    return Response.json({ ok: false, error: "未配置 AI API Key" }, { status: 500 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (payload: unknown) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
      try {
        const rows: (EvalCaseResult & { model: string })[] = [];
        const totals: Record<string, number[]> = {};
        for (const model of models) {
          totals[model] = [];
          send({ type: "progress", text: `评估模型 ${model}：共 ${EVAL_CASES.length} 题` });
          for (const c of EVAL_CASES) {
            send({ type: "progress", text: `→ ${c.title}` });
            const row = {
              ...(await runEvalCase(
                { ...base, model },
                c,
                new Date(),
                typeof body.应验 === "number" ? body.应验 : null,
              )),
              model,
            };
            rows.push(row);
            totals[model].push(row.total);
            send({ type: "case", row });
          }
        }
        const matrix = {
          models,
          cases: EVAL_CASES.map((c) => ({ id: c.id, title: c.title })),
          rows,
          summary: Object.fromEntries(
            models.map((m) => {
              const modelRows = rows.filter((r) => r.model === m);
              const pass = modelRows.filter((r) => r.grounding?.卦象一致).length;
              return [
                m,
                {
                  平均分: modelRows.length
                    ? Math.round(modelRows.reduce((a, b) => a + b.total, 0) / modelRows.length)
                    : null,
                  通过率: modelRows.length ? Math.round((pass / modelRows.length) * 100) : null,
                },
              ];
            }),
          ),
        };
        send({ type: "done", matrix });
      } catch (e) {
        send({ type: "error", error: `评估失败：${(e as Error).message}` });
      } finally {
        controller.close();
      }
    },
    cancel() {},
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
