// 六爻断课模板：基于排盘（纳甲爻/六亲/六神/世应/动爻/变卦/旬空）解读。
// 铁律：不自行起卦，只基于引擎排好的盘；本卦看现状、变卦看结局、动爻为关键。
import type { DivineRequest, DivineTemplate } from "./types";
import { registerDivineTemplate } from "./registry";

interface SixYao {
  爻位?: string;
  变?: string;
  纳?: string;
  五行?: string;
  六亲?: string;
  六神?: string;
}

function buildSystemPrompt(): string {
  return `你是研习六爻（文王卦/火珠林）多年的断卦师傅，精通纳甲装卦、六亲六神、世应、动变之义。
你拿到的是已由引擎精确排好的六爻盘，你【绝不】自行起卦、改判卦象，引擎怎么给你就怎么断。

断六爻要旨：
1. 先看卦宫与世应：世爻为"我"，应爻为对方/所测之事；用神按所测事类取（父母=文书/房产/长辈，官鬼=事业/官府/压力，妻财=财源/妻，子孙=喜悦/解忧/子孙，兄弟=竞争/破财）；
2. 动爻为关键：动则变，动爻旺衰与旬空决定吉凶转化；静卦看本卦卦辞；
3. 变卦看结局：本卦观现状，变卦观变化结果，动爻多主反复；
4. 六神主事象：青龙=喜/酒色（吉），朱雀=口舌/文书，勾陈=田土/旧事，螣蛇=虚惊/怪异，白虎=血光/凶（多凶），玄武=盗暗/暧昧；
5. 句中有动爻更须看其生克（我克财、克我官、生我父母、我生子女）。
【注】六爻为摇卦，无时辰/月将参数；若用户想换时辰改卦，应说明六爻无法换时辰，可改用大六壬。

回答格式：
- 先总断（一两句定吉凶），再分述（世应/用神/动爻/六神各象），最后给行事建议，控制在 400-600 字；
- 若追问：只回答追问本身，不重复整段断语；
- 语气平实笃定，不故弄玄虚，不否定引擎给出的排盘。`;
}

function formatContext(req: DivineRequest): string {
  const raw = req.raw as {
    本卦?: string;
    变卦?: string;
    宫?: string;
    世爻?: string;
    应爻?: string;
    旬空?: string[];
    日柱?: string;
    爻?: SixYao[];
  } | null;
  const lines: string[] = [];
  lines.push(`【六爻排盘（引擎排出，勿改）】`);
  lines.push(
    `本卦：${raw?.本卦 ?? "?"}（${raw?.宫 ?? ""}）${raw?.变卦 && raw?.变卦 !== raw?.本卦 ? ` → 变卦：${raw?.变卦}` : ""}`,
  );
  lines.push(
    `世爻：${raw?.世爻 ?? ""}　应爻：${raw?.应爻 ?? ""}　旬空：${(raw?.旬空 ?? []).join("")}　占日：${raw?.日柱 ?? ""}`,
  );
  if (raw?.爻?.length) {
    lines.push(`六爻：`);
    for (const y of raw.爻) {
      lines.push(
        `  ${y.爻位}${y.变 === "动" ? "（动）" : ""}：${y.纳}（${y.五行}）· ${y.六亲} · ${y.六神}`,
      );
    }
  }
  lines.push("");
  lines.push("【问事】");
  lines.push(req.question);
  return lines.join("\n");
}

export const liuyaoDivineTemplate: DivineTemplate = {
  id: "liuyao",
  buildMessages(req) {
    return [
      { role: "system", content: buildSystemPrompt() },
      { role: "user", content: formatContext(req) },
    ];
  },
};

registerDivineTemplate(liuyaoDivineTemplate);
