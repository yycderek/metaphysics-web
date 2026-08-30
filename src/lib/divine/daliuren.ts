// 大六壬断课模板（迁移自原 prompt.ts）
// 铁律：先由 TS 引擎起课(build)，再喂 LLM 解读，防止 LLM 幻觉起错课
import type { ChuanDetail, KeShi } from "../types";
import type { DivineRequest, DivineTemplate, Season } from "./types";
import { registerDivineTemplate } from "./registry";
import { chuanTianjiang, sikeEntries } from "../shike";
import { genericDivineTemplate } from "./generic";
import {
  DIZHI_WUXING,
  TIANGAN_WUXING,
  WANGXIU,
  CHANGSHENG_QI,
  CHANGSHENG_STAGES,
  TIANJIANG_JIXIONG,
  TIANJIANG_ZHUSHI,
} from "../data";

const SEASON_HINT: Record<Season, string> = {
  春: "正月—三月（寅卯辰月），木旺火相",
  夏: "四月—六月（巳午未月），火旺土相",
  秋: "七月—九月（申酉戌月），金旺水相",
  冬: "十月—十二月（亥子丑月），水旺木相",
  四季: "辰戌丑未月（土旺之季），土旺金相",
};

const SYSTEM_PROMPT = `你是研习大六壬多年的断课师傅，精通《大六壬指南》《六壬粹言》断课要旨。
你拿到的是【已经由程序精确起好的课式】（起课过程：月将加时布天地盘 → 四课 → 九宗门定三传 → 布天将），
你【绝不】自行重新起课、改判课名、改换三传——引擎怎么给，你就怎么断。

断课原则：
1. 先看课名定大体吉凶倾向（元首/重审/知一/涉害/遥克/昴星/别责/八专/伏吟/返吟各有其象）；
2. 次看三传：初传主事之始，中传主事之中，末传主事之终；三传递生则顺，递克则阻；
   初克末先难后易，末克初先易后难；
3. 再看天将：吉将（贵/合/龙/常/后）临传多助，凶将（蛇/朱/勾/空/虎/武）临传多阻；
   天将主事象（如朱雀主口舌文书、玄武主盗贼暗昧、青龙主财喜升迁、白虎主血光权威）；
4. 次看六亲：以日干为"我"——父母（生我）主庇护文书，兄弟（同我）主竞争分夺，
   子孙（我生）主泄气创意，妻财（我克）主财利可求，官鬼（克我）主压力官非；
5. 再看旺衰：结合占时季节，五行旺相为有力，休囚死为无力；
6. 旬空之支，其象半虚，临传主事有虚、迟、空之象，出空填实可成；
7. 综合课名+三传+天将+六亲+旺衰+旬空，给出一段【有主次、有先后】的断语，
   先总断，再分述（各传各象），最后给行事建议。

回答格式：
- 若问事（如"看事业""问感情"）：围绕所问展开，层次分明，控制在 400-600 字；
- 若追问：只回答追问本身，不重复整课断语；
- 语气平实笃定，不故弄玄虚，不用"或许""可能"堆砌；不否定引擎给出的课式信息。
- 【通俗】面向普通用户，用大白话；专业词第一次出现用括号白话解释（官鬼=工作压力权威，父母=文书长辈庇护，妻财=钱财利益，兄弟=同辈竞争，子孙=子女福气化解，旬空=暂时落空时机未到），讲清"为什么"，不要只堆口诀。
- 【思考过程从简】只需快速梳理要点，不要长篇推演，把篇幅留给最终断语正文。

参考表（旺衰、长生、天将取用）：
- 季节旺衰：${JSON.stringify(WANGXIU, null, 1)}
- 长生十二宫起点（五行的长生位）：${JSON.stringify(CHANGSHENG_QI)}，顺序：${CHANGSHENG_STAGES.join("→")}
- 天将吉凶：${JSON.stringify(TIANJIANG_JIXIONG)}；天将事象：${JSON.stringify(TIANJIANG_ZHUSHI)}`;

/** raw 形状守卫：确认是大六壬 KeShi（防模板拿错结构） */
function isKeShi(raw: unknown): raw is KeShi {
  const k = raw as KeShi | null;
  return !!k && Array.isArray(k.sanchuan) && typeof k.rizhu === "string";
}

function formatChuan(c: ChuanDetail): string {
  const zhiWx = DIZHI_WUXING[c.zhi];
  return `${c.name}：${c.zhi}（${zhiWx}）· ${c.tianjiang.short}${c.tianjiang.full}（${c.tianjiang.jixiong}，${c.tianjiang.zhushi}）· 六亲${c.liuqin}`;
}

/** 课式 → 用户侧断课上下文（含完整课式信息，供 LLM 引用） */
function buildContext(ks: KeShi, req: DivineRequest): string {
  const sike = sikeEntries(ks);
  const chuan = chuanTianjiang(ks);
  const seasonHint = SEASON_HINT[req.season];

  const sikeLines = sike
    .map((s) => `第${s.index}课：${s.bottom}（下）→ ${s.top}（上），${s.relation}`)
    .join("\n");
  const chuanLines = chuan.map((c) => formatChuan(c)).join("\n");
  const tianpanLines = Object.entries(ks.tianpan)
    .map(([di, tian]) => `${di}←${tian}`)
    .join("，");
  const riGanWx = TIANGAN_WUXING[ks.rigan];
  const riZhiWx = DIZHI_WUXING[ks.rizhi];

  return `【本课课式（程序起课，勿改）】
日柱：${ks.rizhu}日（日干${ks.rigan}属${riGanWx}，日支${ks.rizhi}属${riZhiWx}）
占时：${ks.shizhi}时 · 月将：${ks.yuejiang}将
课名：${ks.kename}（${ks.method}）
贵人：${ks.guiren}（${ks.guirenMode}）· 旬空：${ks.xunkong[0]}${ks.xunkong[1]}
天地盘（地盘←天盘）：${tianpanLines}
四课：
${sikeLines}
三传：
${chuanLines}
应期：旬空${ks.xunkong[0]}${ks.xunkong[1]}待出空填实；三传递生则速、递克则缓，末传值事之终期。
占时季节：${req.season}（${seasonHint}）

【问事】
${req.question}`;
}

export const daliurenDivineTemplate: DivineTemplate = {
  id: "daliuren",
  buildMessages(req) {
    const ks = req.raw;
    if (!isKeShi(ks)) {
      // 数据形状异常：交由通用模板如实解读
      return genericDivineTemplate.buildMessages(req);
    }
    return [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildContext(ks, req) },
    ];
  },
};

registerDivineTemplate(daliurenDivineTemplate);
