// 断课质量评分：硬指标（grounding）纯函数，供 eval 复用与测试。
import { verifyDivination } from "../agent/verify";
import type { EvalCase } from "./cases";
import type { AgentDivination } from "../agent/types";
import type { DivinationResult } from "../algorithms/types";

export interface GroundingScore {
  卦象一致: boolean;
  自校验通过: boolean;
  步骤数: number;
  有出处: boolean;
  score: number; // 0-100
}

/** 断语是否提到期望卦象/卦名（宽容：卦象字段 或 依据.结果 含期望词） */
export function mentionsExpected(
  interpretation: AgentDivination | null,
  expected: string,
): boolean {
  if (!interpretation) return false;
  const s = [interpretation.卦象, interpretation.依据?.结果 ?? ""].join(" ");
  return s.includes(expected);
}

/** 硬指标评分（0-100）：卦象一致 50 + 自校验通过 30 + 步骤覆盖 20 */
export function scoreGrounding(
  divination: DivinationResult,
  interpretation: AgentDivination | null,
  evalCase: EvalCase,
): GroundingScore {
  const 卦象一致 = mentionsExpected(interpretation, evalCase.期望卦象);
  const verify = interpretation ? verifyDivination(divination, interpretation).ok : false;
  const 步骤数 = interpretation?.逐步?.length ?? 0;
  const 有出处 = !!interpretation?.出处;
  const score = (卦象一致 ? 50 : 0) + (verify ? 30 : 0) + Math.round(Math.min(步骤数 / 3, 1) * 20);
  return { 卦象一致, 自校验通过: verify, 步骤数, 有出处, score };
}

/** 取一个用例的总分（正规范化后）会在 run 里混入 judge 分数 */
export function blendTotal(grounding: number, quality: number | null): number {
  return quality == null ? grounding : Math.round(0.5 * grounding + 0.5 * quality);
}
