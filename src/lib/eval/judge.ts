// LLM-as-judge：按用例评判标准给断语质量打分（0-100）。
import type { AIProviderConfig, ChatMessage } from "../aiTypes";
import { chatCompletion } from "../aiProvider";
import type { EvalCase } from "./cases";
import type { AgentDivination } from "../agent/types";

const JUDGE_SYSTEM = `你是断卦质量的评审。下面给出 [用例]（含固定课式事实与评判标准）和 [断语]。
请严格按标准逐条判断断语质量，输出 {"分数":0-100,"理由":"一句话"}（只输出该 JSON，不加其他文字）。
参考尺度：90+ 优秀且紧扣课式；75+ 良好、抓对关键；60+ 及格、有据但有瑕疵；<60 有幻觉或明显偏差。`;

export interface JudgeResult {
  score: number;
  reason: string;
}

export async function judgeQuality(
  config: AIProviderConfig,
  evalCase: EvalCase,
  interpretation: AgentDivination,
): Promise<JudgeResult | null> {
  const rubric = evalCase.rubric.map((r, i) => `${i + 1}. ${r}`).join("\n");
  const messages: ChatMessage[] = [
    { role: "system", content: JUDGE_SYSTEM },
    {
      role: "user",
      content: `【用例】${evalCase.title}
期望卦象：${evalCase.期望卦象}
关键事实：${evalCase.关键.join("；")}
评判标准：
${rubric}

【断语】
${JSON.stringify(interpretation)}`,
    },
  ];
  try {
    const turn = await chatCompletion(config, messages);
    const m = turn.content.match(/\{[\s\S]*\}/);
    if (!m) return null;
    const o = JSON.parse(m[0]) as { 分数?: number; 理由?: string };
    const score = Number(o["分数"]);
    if (!Number.isFinite(score)) return null;
    return {
      score: Math.max(0, Math.min(100, Math.round(score))),
      reason: String(o["理由"] ?? ""),
    };
  } catch {
    return null;
  }
}
