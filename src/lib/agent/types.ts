// 智能占卜 Agent 类型：结构化断语（简略/详细）+ 澄清 + 自校验 + 卦记忆
import type { AlgorithmInput, DivinationResult } from "@/lib/algorithms/types";
import type { ChatMessage } from "@/lib/aiTypes";

/** 简略解读：卦象 + 结论性解读 */
export interface AgentConcl {
  总断: string;
  现状: string;
  建议: string;
  风险?: string;
}
/** 详细解读：每一步的占断含义（与引擎推导步骤按顺序对应） */
export interface AgentStepInterp {
  步骤: string;
  解读: string;
}
/** 断语引用的事实（自校验用）：声明这句断语依据的引擎卦理事实 */
export interface AgentFacts {
  三传?: string[];
  天将?: string[];
  六亲?: string[];
  结果?: string;
}
/** 结构化断语（P0 目标 2 + 简略/详细 + 自校验）：最终输出必须是该 JSON 形状 */
export interface AgentDivination {
  卦象: string;
  算法: string;
  吉凶?: "吉" | "中" | "凶";
  结论: AgentConcl;
  逐步: AgentStepInterp[];
  /** 依据（大六壬建议必填），声明引用的三传/天将/六亲，供服务端与引擎逐项核对 */
  依据?: AgentFacts;
  置信度: "高" | "中" | "低";
  出处?: string;
}

/** divinate 工具参数 */
export interface DivinateParams {
  algorithm?: string;
  params?: AlgorithmInput;
}

/** 先前已起的卦（卦记忆）：供模型在后续轮次"复读"已算过的卦 */
export interface PriorDivination {
  summary: string;
  facts: string;
}

/** Agent 循环运行中上报的里程碑事件（供 SSE 流式展示过程） */
export type AgentEvent =
  { type: "status"; text: string } | { type: "divination"; summary: string; algorithmId: string };

/** Agent 循环返回 */
export interface AgentLoopResult {
  ok: boolean;
  /** answer = 最终断语；clarify = 需要向用户澄清（见 question / meta 为 undefined） */
  kind?: "answer" | "clarify";
  result?: AgentDivination;
  error?: string;
  /** clarify 时的追问内容 */
  question?: string;
  /** 起课元信息（算法名/课式摘要/引擎完整结果），供前端可视化 + 简略/详细展示 */
  meta?: AgentMeta;
  /** 完整消息轨迹（含 tool 往返），供调试/后续多轮复用 */
  trace: ChatMessage[];
}

export interface AgentMeta {
  /** 用户可读的课式摘要，如 "返吟课（卯→酉→卯）" */
  summary: string;
  /** 引擎完整结果（steps + raw），供 StepRenderer / 天地盘 / 四课 / 三传 复用 */
  divination: DivinationResult;
}
