// Agent 循环：感知→决策→行动（调用工具）→观察→最终结构化输出
// 依赖一个可注入的 callLLM（便于用 mock 单测），工具执行用真实引擎。
import type { ChatMessage, ToolCall } from "@/lib/aiTypes";
import { executeDivinate } from "./divinate";
import type {
  AgentDivination,
  AgentLoopResult,
  AgentMeta,
  AgentStepInterp,
  DivinateParams,
} from "./types";

export type CallLLM = (
  messages: ChatMessage[],
) => Promise<{ content: string; tool_calls?: ToolCall[] }>;

export interface LoopOptions {
  system: string;
  callLLM: CallLLM;
  question: string;
  /** 多轮历史（不含本轮），供模型复用此前卦象上下文 */
  history?: ChatMessage[];
  maxIters?: number;
  now?: Date;
}

const DEFAULT_MAX_ITERS = 5;
const CONFIDENCE = new Set(["高", "中", "低"]);
const JIXIONG = new Set(["吉", "中", "凶"]);

/** 宽容解析模型输出的 JSON：剥离 markdown 代码块、找到首尾大括号再 parse */
export function tryParseStructured(text: string): AgentDivination | null {
  const raw = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/, "");
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    const obj = JSON.parse(raw.slice(start, end + 1)) as Record<string, unknown>;
    if (typeof obj["卦象"] !== "string" || typeof obj["算法"] !== "string") return null;
    const c = obj["结论"] as Record<string, unknown> | undefined;
    if (!c || typeof c["总断"] !== "string" || typeof c["现状"] !== "string") return null;
    if (typeof c["建议"] !== "string") return null;
    if (!Array.isArray(obj["逐步"])) return null;
    const steps: AgentStepInterp[] = obj["逐步"]
      .filter(
        (s): s is { 步骤: string } =>
          typeof s === "object" && !!s && typeof (s as { 步骤?: unknown }).步骤 === "string",
      )
      .map((s) => ({ 步骤: s.步骤, 解读: String((s as { 解读?: unknown }).解读 ?? "") }));
    const conf = obj["置信度"];
    if (!CONFIDENCE.has(conf as string)) return null;
    const jx = obj["吉凶"];
    return {
      卦象: obj["卦象"],
      算法: obj["算法"],
      吉凶: JIXIONG.has(jx as string) ? (jx as AgentDivination["吉凶"]) : undefined,
      结论: {
        总断: c["总断"],
        现状: c["现状"],
        建议: c["建议"],
        风险: typeof c["风险"] === "string" ? c["风险"] : undefined,
      },
      逐步: steps,
      置信度: conf as AgentDivination["置信度"],
      出处: typeof obj["出处"] === "string" ? obj["出处"] : undefined,
    };
  } catch {
    return null;
  }
}

export async function runAgentLoop(opts: LoopOptions): Promise<AgentLoopResult> {
  const { system, callLLM, question, now = new Date() } = opts;
  const history = (opts.history ?? [])
    .filter((m) => m.content !== null && (m.role === "user" || m.role === "assistant"))
    .slice(-12);
  const maxIters = opts.maxIters ?? DEFAULT_MAX_ITERS;
  const messages: ChatMessage[] = [{ role: "system", content: system }, ...history];
  let lastMeta: AgentMeta | undefined;

  for (let i = 0; i < maxIters; i++) {
    const userMessages: ChatMessage[] =
      i === 0 ? [...messages, { role: "user", content: question }] : messages;
    const turn = await callLLM(userMessages);

    // 模型请求调用工具 → 执行引擎 → 把观察结果回灌
    if (turn.tool_calls?.length) {
      messages.push({
        role: "assistant",
        content: turn.content ?? "",
        tool_calls: turn.tool_calls,
      });
      for (const call of turn.tool_calls) {
        let toolContent: string;
        try {
          const outcome = await executeDivinate(call, question, now);
          lastMeta = outcome.meta;
          toolContent = outcome.context;
        } catch (e) {
          toolContent = `起课失败：${(e as Error).message}`;
        }
        messages.push({ role: "tool", content: toolContent, tool_call_id: call.id });
      }
      continue;
    }

    // 无更多工具调用 → 解析最终结构化 JSON
    const content = (turn.content ?? "").trim();
    if (!content) return { ok: false, error: "AI 未返回内容", trace: messages };
    const parsed = tryParseStructured(content);
    if (parsed) {
      return { ok: true, result: parsed, meta: lastMeta, trace: messages };
    }
    // 不合法：给一次纠正机会（追加要求重新输出 JSON）
    if (i < maxIters - 1) {
      messages.push({ role: "assistant", content });
      messages.push({
        role: "user",
        content:
          "你输出的必须是合法 JSON（符合 {卦象:string, 算法:string, 结论:{总断,现状,建议}, 逐步:[{步骤,解读}], 置信度:高|中|低}）。请重新只输出该 JSON 对象，不要加任何解释。",
      });
      continue;
    }
    return { ok: false, error: `AI 输出不是合法 JSON：${content.slice(0, 200)}`, trace: messages };
  }
  return { ok: false, error: "Agent 达到最大迭代次数仍未给出结构化结果", trace: messages };
}

export type { AgentDivination, AgentMeta, AgentStepInterp, DivinateParams };
