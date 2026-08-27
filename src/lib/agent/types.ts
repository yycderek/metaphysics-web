// 智能占卜 Agent 类型：结构化断语（简略/详细）+ Agent 内部消息形状
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
/** 结构化断语（P0 目标 2 + 简略/详细）：最终输出必须是该 JSON 形状 */
export interface AgentDivination {
  卦象: string;
  算法: string;
  吉凶?: "吉" | "中" | "凶";
  结论: AgentConcl;
  逐步: AgentStepInterp[];
  置信度: "高" | "中" | "低";
  出处?: string;
}

/** divinate 工具参数 */
export interface DivinateParams {
  algorithm?: string;
  params?: AlgorithmInput;
}

/** Agent 循环返回 */
export interface AgentLoopResult {
  ok: boolean;
  result?: AgentDivination;
  error?: string;
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
