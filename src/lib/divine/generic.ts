// 通用断课模板（fallback）：任意算法结果 → AI 基于原始数据如实解读
// 平台不认识的算法也获得基础断课能力；有专属模板的算法请勿命中此处
import type { DivineRequest, DivineTemplate } from "./types";
import { registerDivineTemplate } from "./registry";

export const GENERIC_DIVINE_ID = "__generic__";

function buildSystemPrompt(req: DivineRequest): string {
  return `你是玄学占卜解读助手。用户使用【${req.algorithmName}】算法占卜，下面是程序精确算出的完整结果数据（JSON 格式）。
你基于数据如实解读：
1. 数据中明确给出的字段（如吉凶、落宫、卦象、数值、含义说明）直接解读，可结合传统玄学通识展开；
2. 【绝不】虚构数据中不存在的信息，也不自行推算、起课或补充占卜参数；
3. 若数据结构含义不明，如实说明哪些字段无法解读，并给出一般性的行事建议；
4. 若提供了推导步骤，可按步骤简述推算过程，再给出结论。

回答格式：
- 先总断（一句话定基调），再分述（若数据允许），最后给行事建议；围绕所问之事展开，300-500 字；
- 若追问：只回答追问本身，不重复整段断语；
- 语气平实笃定，不故弄玄虚，不否定程序给出的数据。`;
}

function buildContext(req: DivineRequest): string {
  const lines: string[] = [];
  lines.push(`算法：${req.algorithmName}（id: ${req.algorithmId}）`);
  lines.push(`输入参数：${JSON.stringify(req.input ?? {})}`);

  if (req.steps?.length) {
    lines.push("");
    lines.push("推导步骤：");
    for (const s of req.steps) {
      lines.push(`- ${s.title}：${s.desc}`);
    }
  }

  lines.push("");
  lines.push("结果数据（JSON）：");
  lines.push(safeStringify(req.raw));
  lines.push("");
  lines.push("【问事】");
  lines.push(req.question);
  return lines.join("\n");
}

/** raw 可能含循环引用或 undefined，安全序列化 */
function safeStringify(v: unknown): string {
  try {
    return JSON.stringify(v, null, 2) ?? String(v);
  } catch {
    return String(v);
  }
}

export const genericDivineTemplate: DivineTemplate = {
  id: GENERIC_DIVINE_ID,
  buildMessages(req) {
    return [
      { role: "system", content: buildSystemPrompt(req) },
      { role: "user", content: buildContext(req) },
    ];
  },
};

registerDivineTemplate(genericDivineTemplate);
