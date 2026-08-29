// 断课评估执行：固定用例 → 引擎起课 → 模型断语 → 硬指标 + judge 打分。
import { buildDivination } from "../algorithms/registry";
import { keShiContext } from "../agent/divinate";
import { seasonFromNow } from "../agent/params";
import { tryParseStructured } from "../agent/loop";
import { chatCompletion } from "../aiProvider";
import { scoreGrounding, blendTotal, type GroundingScore } from "./score";
import { judgeQuality, type JudgeResult } from "./judge";
import type { EvalCase } from "./cases";
import type { AIProviderConfig, ChatMessage } from "../aiTypes";
import type { AgentDivination } from "../agent/types";

const EVAL_SYSTEM = `你是一名断卦师。下面是一个已由引擎精确算好的占卜结果（含课式信息与推导步骤，勿改）。请直接依据它输出结构化 JSON，不要提问、不要假装调用工具。
输出字段必须为：
{"卦象":"课名/卦名","算法":"算法名","吉凶":"吉|中|凶","结论":{"总断":"一句话","现状":"解读","建议":"建议","风险":"可能不利"（可省略）},"逐步":[{"步骤":"推导步骤名","解读":"该步卦理"}],"依据":{"结果":"本卦（→变卦）","三传":[],"天将":[],"六亲":[]},"置信度":"高|中|低","出处":"古法/断例"（可省略）}
直接输出 JSON 对象本身，不加解释文字。`;

export interface EvalCaseResult {
  caseId: string;
  title: string;
  卦象: string;
  grounding: GroundingScore;
  quality: JudgeResult | null;
  total: number;
  error?: string;
}

export async function runEvalCase(
  config: AIProviderConfig,
  evalCase: EvalCase,
  now = new Date(),
): Promise<EvalCaseResult> {
  let divination;
  try {
    divination = await buildDivination(evalCase.algorithm, evalCase.input);
  } catch (e) {
    return {
      caseId: evalCase.id,
      title: evalCase.title,
      卦象: "",
      grounding: { 卦象一致: false, 自校验通过: false, 步骤数: 0, 有出处: false, score: 0 },
      quality: null,
      total: 0,
      error: `起课失败：${(e as Error).message}`,
    };
  }
  const context = keShiContext(divination, evalCase.question, seasonFromNow(now));
  const messages: ChatMessage[] = [
    { role: "system", content: EVAL_SYSTEM },
    { role: "user", content: context },
  ];
  let interpretation: AgentDivination | null = null;
  try {
    const turn = await chatCompletion(config, messages);
    interpretation = tryParseStructured(turn.content);
    // 结构解析失败 → 给一次纠正机会（与 agent 一致，保证公平）
    if (!interpretation && turn.content) {
      const retry = await chatCompletion(config, [
        ...messages,
        { role: "assistant", content: turn.content },
        {
          role: "user",
          content:
            "请只输出符合格式的 JSON 对象（必须含 卦象/算法/结论{总断,现状,建议}/逐步[{步骤,解读}]/置信度），不要任何解释或代码块。",
        },
      ]);
      interpretation = tryParseStructured(retry.content);
    }
  } catch (e) {
    const g = scoreGrounding(divination, null, evalCase);
    return {
      caseId: evalCase.id,
      title: evalCase.title,
      卦象: "",
      grounding: g,
      quality: null,
      total: g.score,
      error: `模型调用失败：${(e as Error).message}`,
    };
  }
  const grounding = scoreGrounding(divination, interpretation, evalCase);
  const quality = interpretation ? await judgeQuality(config, evalCase, interpretation) : null;
  return {
    caseId: evalCase.id,
    title: evalCase.title,
    卦象: interpretation?.卦象 ?? "(解析失败)",
    grounding,
    quality,
    total: blendTotal(grounding.score, quality?.score ?? null),
  };
}

export type { AIProviderConfig };
