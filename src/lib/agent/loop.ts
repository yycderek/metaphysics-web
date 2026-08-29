// Agent 循环：感知→决策→行动（调用工具）→观察→自校验→二次反思→最终结构化输出
// 依赖一个可注入的 callLLM（便于用 mock 单测），工具执行用真实引擎。
import type { ChatMessage, ToolCall } from "@/lib/aiTypes";
import { executeDivinate, resolveDivinateArgs } from "./divinate";
import { verifyDivination } from "./verify";
import type {
  AgentDivineOne,
  AgentDivination,
  AgentEvent,
  AgentLoopResult,
  AgentMeta,
  AgentStepInterp,
  DivinateParams,
} from "./types";
import type { DivinationResult } from "@/lib/algorithms/types";

export type CallLLM = (
  messages: ChatMessage[],
) => Promise<{ content: string; tool_calls?: ToolCall[] }>;

export interface LoopOptions {
  system: string;
  callLLM: CallLLM;
  question: string;
  /** 多轮历史（不含本轮），供模型复用此前对话 */
  history?: ChatMessage[];
  /** 里程碑事件回调（用于 SSE 流式展示过程） */
  onEvent?: (e: AgentEvent) => void;
  maxIters?: number;
  now?: Date;
}

const DEFAULT_MAX_ITERS = 8;
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
    const f = obj["依据"] as Record<string, unknown> | undefined;
    // 多卦逐卦解读（可选）
    const gua = obj["卦组"];
    const 卦组: AgentDivineOne[] | undefined = Array.isArray(gua)
      ? gua
          .filter((g): g is Record<string, unknown> => !!g && typeof g === "object")
          .map((g) => ({
            卦象: String(g["卦象"] ?? ""),
            算法: typeof g["算法"] === "string" ? g["算法"] : undefined,
            吉凶: JIXIONG.has(g["吉凶"] as string) ? (g["吉凶"] as "吉" | "中" | "凶") : undefined,
            要点: String(g["要点"] ?? g["结论"] ?? ""),
            结论: String(g["结论"] ?? ""),
            建议: typeof g["建议"] === "string" ? g["建议"] : undefined,
          }))
          .filter((g) => g.卦象 && (g.要点 || g.结论))
      : undefined;
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
      卦组: 卦组?.length ? 卦组 : undefined,
      依据:
        f && typeof f === "object"
          ? {
              三传: Array.isArray(f["三传"]) ? f["三传"].map(String) : undefined,
              天将: Array.isArray(f["天将"]) ? f["天将"].map(String) : undefined,
              六亲: Array.isArray(f["六亲"]) ? f["六亲"].map(String) : undefined,
              结果: typeof f["结果"] === "string" ? f["结果"] : undefined,
            }
          : undefined,
      置信度: conf as AgentDivination["置信度"],
      出处: typeof obj["出处"] === "string" ? obj["出处"] : undefined,
    };
  } catch {
    return null;
  }
}

/** 审视结论解析：返回是否需要重写 */
function parseCritique(text: string): { rewrite: boolean; reason?: string } {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start >= 0 && end > start) {
    try {
      const o = JSON.parse(text.slice(start, end + 1)) as Record<string, unknown>;
      return {
        rewrite: o["重写"] === true,
        reason: typeof o["原因"] === "string" ? o["原因"] : undefined,
      };
    } catch {
      /* fallthrough */
    }
  }
  return { rewrite: /需|要修改|重写|有误|不符|矛盾/.test(text), reason: text.slice(0, 120) };
}

/** 从工具调用里解析澄清问题 */
function clarificationOf(toolCalls: ToolCall[]): string | null {
  const call = toolCalls.find((c) => c.function.name === "ask_clarification");
  if (!call) return null;
  try {
    const q = JSON.parse(call.function.arguments || "{}") as { question?: string };
    return q.question?.trim() || null;
  } catch {
    return null;
  }
}

const CRITIQUE_PROMPT = `请以挑剔的断卦师视角审视上面这份断语：检查 ①是否前后矛盾；②是否过度断言（说了引擎数据不支持的结论）；③是否遗漏了该卦的关键（如动爻/旬空/用神）。一切无误则输出 {"重写":false}；有问题则输出 {"重写":true,"原因":"具体问题"}。只输出该 JSON，不要其他文字。`;

export async function runAgentLoop(opts: LoopOptions): Promise<AgentLoopResult> {
  const { system, callLLM, question, now = new Date() } = opts;
  const onEvent = opts.onEvent ?? (() => {});
  const history = (opts.history ?? [])
    .filter((m) => m.content !== null && ["user", "assistant", "tool"].includes(m.role))
    .slice(-14);
  const maxIters = opts.maxIters ?? DEFAULT_MAX_ITERS;
  const messages: ChatMessage[] = [{ role: "system", content: system }, ...history];
  let lastMeta: AgentMeta | undefined;
  const executed: DivinationResult[] = [];
  // 同参数 divinate 去重：避免模型在同一循环内重复起同一卦（同算法+参数复用上次结果）
  const divinationCache = new Map<string, { context: string; meta: AgentMeta }>();

  onEvent({ type: "status", text: "正在理解你的问题并决定起课参数…" });

  for (let i = 0; i < maxIters; i++) {
    if (i === 0) messages.push({ role: "user", content: question });
    const turn = await callLLM(messages);

    // 模型请求调用工具
    if (turn.tool_calls?.length) {
      const clarifyQ = clarificationOf(turn.tool_calls);
      if (clarifyQ) {
        messages.push({ role: "assistant", content: clarifyQ });
        return { ok: true, kind: "clarify", question: clarifyQ, trace: messages };
      }
      messages.push({
        role: "assistant",
        content: turn.content ?? "",
        tool_calls: turn.tool_calls.filter((c) => c.function.name !== "ask_clarification"),
      });
      onEvent({ type: "status", text: "正在调用引擎起课…" });
      for (const call of turn.tool_calls.filter((c) => c.function.name === "divinate")) {
        const args = resolveDivinateArgs(call.function.arguments);
        const key = `${args.algorithm}|${JSON.stringify(args.params ?? {})}|${args.longitude ?? 120}`;
        let toolContent: string;
        const cached = divinationCache.get(key);
        if (cached) {
          toolContent = `${cached.context}\n（注：此询问与前面已算的课参数完全相同，已复用该课，无需重复起卦。）`;
          lastMeta = cached.meta;
        } else {
          try {
            const outcome = await executeDivinate(call, question, now);
            lastMeta = outcome.meta;
            executed.push(outcome.result);
            toolContent = outcome.context;
            divinationCache.set(key, { context: outcome.context, meta: outcome.meta });
            onEvent({
              type: "divination",
              summary: outcome.meta.summary,
              algorithmId: outcome.meta.divination.algorithmId,
            });
          } catch (e) {
            toolContent = `起课失败：${(e as Error).message}`;
          }
        }
        messages.push({ role: "tool", content: toolContent, tool_call_id: call.id });
      }
      onEvent({ type: "status", text: "正在根据课式断课并校对…" });
      continue;
    }

    // 无更多工具调用 → 解析最终结构化 JSON
    const content = (turn.content ?? "").trim();
    if (!content) return { ok: false, error: "AI 未返回内容", trace: messages };
    const parsed = tryParseStructured(content);
    if (!parsed) {
      if (i < maxIters - 1) {
        messages.push({ role: "assistant", content });
        messages.push({
          role: "user",
          content:
            "你输出的必须是合法 JSON（符合 {卦象:string, 算法:string, 结论:{总断,现状,建议}, 逐步:[{步骤,解读}], 卦组?:[{卦象,要点,结论}], 依据?, 置信度:高|中|低}）。请重新只输出该 JSON 对象，不要加任何解释。",
        });
        continue;
      }
      return {
        ok: false,
        error: `AI 输出不是合法 JSON：${content.slice(0, 200)}`,
        trace: messages,
      };
    }

    // 自校验：比对断语引用的卦理事实与引擎真实事实
    if (lastMeta) {
      const v = verifyDivination(lastMeta.divination, parsed);
      if (!v.ok) {
        if (i < maxIters - 1) {
          messages.push({ role: "assistant", content });
          messages.push({
            role: "user",
            content: `你的断语引用了与引擎不符的卦理事实：${v.mismatch}。请基于引擎给定的正确事实，重新完整输出 JSON（"依据"字段必须与引擎完全一致）。`,
          });
          onEvent({ type: "status", text: "自校验发现误差，正在重新校对…" });
          continue;
        }
        return { ok: false, error: `自校验未通过：${v.mismatch}`, trace: messages };
      }
    }

    // 二次反思：低置信度/有风险时审视一遍，发现问题则重写
    if (parsed.置信度 !== "高" && i < maxIters - 1) {
      onEvent({ type: "status", text: "正在审视断语是否自洽…" });
      const critiqueTurn = await callLLM([
        ...messages,
        { role: "assistant", content },
        { role: "user", content: CRITIQUE_PROMPT },
      ]);
      const crit = parseCritique(critiqueTurn.content);
      if (crit.rewrite) {
        messages.push({ role: "assistant", content });
        messages.push({
          role: "user",
          content: `你刚才的断语未经得起审视：${crit.reason ?? "存在矛盾或过度断言"}。请重新输出更严谨、紧扣引擎数据的 JSON（保持结构）。`,
        });
        onEvent({ type: "status", text: "断语经审视需修正，正在重写…" });
        continue;
      }
    }

    const meta = lastMeta
      ? { ...lastMeta, divinations: executed.length ? executed : undefined }
      : undefined;
    return { ok: true, kind: "answer", result: parsed, meta, trace: messages };
  }
  return { ok: false, error: "Agent 达到最大迭代次数仍未给出结构化结果", trace: messages };
}

export type { AgentDivination, AgentMeta, AgentStepInterp, DivinateParams };
