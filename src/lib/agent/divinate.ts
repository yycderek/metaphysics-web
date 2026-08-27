// divinate 工具执行：解析参数 → 引擎起课 → 生成 LLM 可读的"观察结果"（复用断课模板上下文）
import { buildDivination } from "@/lib/algorithms/registry";
import { getDivineTemplate, genericDivineTemplate } from "@/lib/divine";
import { rizhuFromDate } from "@/lib/calendar";
import { shizhiFromHour } from "@/lib/data";
import type { AlgorithmInput, DivinationResult } from "@/lib/algorithms/types";
import type { ToolCall } from "@/lib/aiTypes";
import { seasonFromNow, yuejiangFromMonth } from "./params";
import type { Season } from "@/lib/divine/types";
import type { AgentMeta, DivinateParams } from "./types";

export interface AgentToolContext {
  context: string;
  result: DivinationResult;
  meta: AgentMeta;
  season: Season;
}

/** 工具对模型暴露的输入形状：接受算法 + 可选参数；daliuren 缺省取此刻 */
export function resolveDivinateArgs(argumentsJson: string): DivinateParams {
  const parsed = JSON.parse(argumentsJson || "{}") as DivinateParams;
  return { algorithm: parsed.algorithm || "daliuren", params: parsed.params ?? {} };
}

export function buildDaliurenDefaults(input: AlgorithmInput, now: Date): AlgorithmInput {
  return {
    rizhu: String(input.rizhu ?? "").trim() || rizhuFromDate(now),
    shizhi: String(input.shizhi ?? "").trim() || shizhiFromHour(now.getHours()),
    yuejiang: String(input.yuejiang ?? "").trim() || yuejiangFromMonth(now.getMonth() + 1),
  };
}

/** 校验并归一化：返回引擎可用的 input；不合法抛错（由调用方转成 tool 错误文本） */
export function resolveParams(
  algorithm: string,
  params: AlgorithmInput,
  now: Date,
): AlgorithmInput {
  if (algorithm === "daliuren") return buildDaliurenDefaults(params, now);
  // 其他算法：原样透传（其 adapter.parseInput 会校验）
  return params;
}

/** 起出的课式 → LLM 可读上下文（复用断课模板；算法无关，未注册回退 generic）
 *  并在末尾追加"推导步骤"，供模型输出"逐步"详细解读时对齐。 */
export function keShiContext(result: DivinationResult, question: string, season: Season): string {
  const template = getDivineTemplate(result.algorithmId) ?? genericDivineTemplate;
  const msgs = template.buildMessages({
    algorithmId: result.algorithmId,
    algorithmName: result.algorithmName,
    input: result.input,
    raw: result.raw,
    question,
    season,
    steps: result.steps,
  });
  let context = msgs[msgs.length - 1].content ?? "";
  if (result.steps.length) {
    context +=
      "\n\n【推导步骤】\n" +
      result.steps.map((s, i) => `${i + 1}. ${s.title}（key: ${s.key}）：${s.desc}`).join("\n");
  }
  return context;
}

/** 课式摘要：供前端展示"起的是什么课" */
export function keShiSummary(result: DivinationResult): string {
  const raw = result.raw as { kename?: string; sanchuan?: string[] } | null;
  if (result.algorithmId === "daliuren" && raw?.kename) {
    return `${raw.kename}（${(raw.sanchuan ?? []).join("→")}）`;
  }
  return `${result.algorithmName} · 参数 ${JSON.stringify(result.input)}`;
}

/** 执行 divinate：缺省参数取此刻（默认日柱=今天、时支=当前、月将=当月近似） */
export async function executeDivinate(
  call: ToolCall,
  question: string,
  now = new Date(),
): Promise<AgentToolContext> {
  const args = resolveDivinateArgs(call.function.arguments);
  const season = seasonFromNow(now);
  const input = resolveParams(args.algorithm!, args.params ?? {}, now);
  const result = await buildDivination(args.algorithm!, input);
  const context = keShiContext(result, question, season);
  const meta: AgentMeta = {
    summary: keShiSummary(result),
    divination: result,
  };
  return { context, result, meta, season };
}
