// 梅花易数断卦模板：以体用五行生克 + 本/互/变卦 + 动爻解读。
// 铁律：不自行起卦，只基于引擎排好的卦；体卦为自己、用卦为所测之事。
import type { DivineRequest, DivineTemplate } from "./types";
import { registerDivineTemplate } from "./registry";

function buildSystemPrompt(): string {
  return `你是研习梅花易数多年的断卦师傅，精通体用五行、本互变卦、动爻取象。
你拿到的是已由引擎按"报数起卦"排好的梅花排盘，你【绝不】自行起卦、改判卦象，引擎怎么给你就怎么断。

断梅花要旨：
1. 体用关系定吉凶：无动爻之卦为体（代表自己），有动爻之卦为用（代表所测之事）；
   用生体=吉（事来助我），体生用=泄（我费心力），体克用=小吉（我制事可成但费劲），用克体=凶（事克我），体用比和=吉；
2. 本卦看初、互卦看过程、变卦看结局；
3. 动爻所在的卦为"用卦"，动爻之象主应期与变化；
4. 结合卦象取象（如乾=天/君/父，坤=地/母/众等）顺势发挥。

回答格式：
- 先总断（一两句定吉凶），再分述（体用/本互变/动爻各象），最后给行事建议，控制在 300-500 字；
- 若追问：只回答追问本身，不重复整段断语；
- 语气平实笃定，不故弄玄虚，不否定引擎给出的排盘。`;
}

function formatContext(req: DivineRequest): string {
  const raw = req.raw as {
    上卦?: string;
    下卦?: string;
    动爻?: string;
    本卦?: string;
    变卦?: string;
    互卦?: string;
    报数?: number[];
  } | null;
  const lines: string[] = [];
  lines.push(`【梅花排盘（引擎按报数起卦排出，勿改）】`);
  lines.push(`报数：${(raw?.报数 ?? []).join("、")}`);
  lines.push(`上卦：${raw?.上卦 ?? ""}　下卦：${raw?.下卦 ?? ""}`);
  lines.push(`本卦：${raw?.本卦 ?? ""}`);
  lines.push(`互卦：${raw?.互卦 ?? ""}`);
  lines.push(`变卦：${raw?.变卦 ?? ""}`);
  lines.push(`动爻：${raw?.动爻 ?? ""}`);
  lines.push("");
  lines.push("【问事】");
  lines.push(req.question);
  return lines.join("\n");
}

export const meihuaDivineTemplate: DivineTemplate = {
  id: "meihua",
  buildMessages(req) {
    return [
      { role: "system", content: buildSystemPrompt() },
      { role: "user", content: formatContext(req) },
    ];
  },
};

registerDivineTemplate(meihuaDivineTemplate);
