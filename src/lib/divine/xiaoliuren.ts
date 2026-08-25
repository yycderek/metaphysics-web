// 小六壬断课模板（数字起课法）
// 结果结构：raw = { palm, auspicious, meaning, numerology: { month, day, hour } }
// 三宫（起月宫→起日宫→落宫）在 steps 中，用于细化断事走势
import type { DivineRequest, DivineTemplate } from "./types";
import { registerDivineTemplate } from "./registry";
import { genericDivineTemplate } from "./generic";

const SYSTEM_PROMPT = `你是研习小六壬多年的断课师傅，精通六宫掌诀断法。
你拿到的是【已经由程序精确算好的结果】（数字起课：大安起月 → 月上起日 → 日上起时），
你【绝不】自行重新起课、改换落宫——程序给什么宫，你就按什么宫断。

六宫要旨（掌诀口诀）：
- 大安（吉）：身不动时，属木青龙。主平安顺遂、谋事可成；问出行、求财、婚恋皆宜，宜静守渐进。
- 留连（凶）：卒未归时，属水玄武。主拖延反复、事难速成；问事多阻滞，宜缓不宜急，待时机明朗。
- 速喜（吉）：人即至时，属火朱雀。主喜事临门、消息速达；问求财、求职、喜事皆利，行动宜快。
- 赤口（凶）：官事凶时，属金白虎。主口舌是非、官非破财；问事防争执诉讼，宜谨言慎行。
- 小吉（吉）：人来喜时，属水六合。主凡事和合、贵人相助；问合作、婚恋、求谋皆吉。
- 空亡（凶）：音信稀时，属土勾陈。主谋事落空、劳而无成；问事多虚，宜待时另图。

断课方法：
1. 落宫定吉凶基调（六宫吉凶已定，落宫是最终断事核心）；
2. 若有三宫（起月宫→起日宫→落宫）：初宫主事之始、中宫主事之中、落宫主事之终，
   看三宫吉凶变化推事态走势（如先吉后凶主先顺后阻，先凶后吉主先难后成）；
3. 结合所问之事取象：问事业看文书官鬼之象，问感情看和合之象，问财运看财喜之象，
   问出行看动静之象（大安/速喜宜动，留连/空亡宜缓）；
4. 给出一段【有主次、有先后】的断语：先总断，再分述（各宫各象），最后给行事建议。

回答格式：
- 若问事（如"看事业""问感情"）：围绕所问展开，层次分明，控制在 300-500 字；
- 若追问：只回答追问本身，不重复整段断语；
- 语气平实笃定，不故弄玄虚，不用"或许""可能"堆砌；不否定程序给出的结果。`;

interface XLRRaw {
  palm?: string;
  auspicious?: string;
  meaning?: string;
  numerology?: { month?: number; day?: number; hour?: number };
}

function isXLRRaw(raw: unknown): raw is XLRRaw {
  const r = raw as XLRRaw | null;
  return !!r && typeof r.palm === "string";
}

function buildContext(req: DivineRequest): string {
  const r = req.raw as XLRRaw;
  const nums = r.numerology ?? {};
  // 三宫从推导步骤中取（起月宫 → 起日宫 → 落宫）
  const palmSteps = (req.steps ?? [])
    .filter((s) => (s.data as { landed?: string } | null)?.landed)
    .map((s) => (s.data as { landed: string }).landed);
  const chain = palmSteps.length >= 2 ? `${palmSteps.join(" → ")}（落宫 ${palmSteps[palmSteps.length - 1]}）` : r.palm;

  return `【本课结果（程序起课，勿改）】
算法：小六壬（数字起课）
起课数：月 ${nums.month ?? "?"} · 日 ${nums.day ?? "?"} · 时 ${nums.hour ?? "?"}
三宫：${chain}
落宫吉凶：${r.auspicious ?? "?"}
掌诀释义：${r.meaning ?? "?"}

【问事】
${req.question}`;
}

export const xiaoliurenDivineTemplate: DivineTemplate = {
  id: "xiaoliuren",
  buildMessages(req) {
    if (!isXLRRaw(req.raw)) {
      return genericDivineTemplate.buildMessages(req);
    }
    return [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildContext(req) },
    ];
  },
};

registerDivineTemplate(xiaoliurenDivineTemplate);
