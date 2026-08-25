// 断课模板抽象（阶段5）：AI 断课按算法模板化
// 目标：每种算法可注册自己的断课模板（system prompt + 课式上下文构建），
// 无专属模板的算法自动回退通用模板（generic），平台不绑定任何具体算法
import type { ChatMessage } from "../aiTypes";
import type { AlgorithmInput, StepResult } from "../algorithms/types";

export type Season = "春" | "夏" | "秋" | "冬" | "四季";

/** 断课请求：算法结果 + 问事（由前端在起课完成后随请求传入） */
export interface DivineRequest {
  algorithmId: string;
  algorithmName: string;
  /** 实际生效的输入参数（解析后） */
  input?: AlgorithmInput;
  /** 算法特有完整结果（大六壬 = KeShi，小六壬 = {palm, auspicious, ...}） */
  raw: unknown;
  question: string;
  season: Season;
  /** 推导步骤（可选，供模板简述推算过程） */
  steps?: StepResult[];
}

/** 断课模板：按算法 ID 注册，buildMessages 组装 system + user 消息 */
export interface DivineTemplate {
  id: string;
  buildMessages(req: DivineRequest): ChatMessage[];
}
