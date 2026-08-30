// 六爻（文王卦 / 铜钱起卦）适配器：三枚铜钱摇掷六次 → 本卦/变卦 → 装卦纳甲/世应/六亲/六神/旬空。
// 输入：可选 { tosses?: number[] }（6 个 6/7/8/9，缺省则随机摇掷）。
import { rizhuFromDate } from "@/lib/calendar";
import { DIZHI_WUXING, xunkong } from "@/lib/data";
import type { KeShi } from "@/lib/types";
import type { AlgorithmAdapter, AlgorithmInput, DivinationResult, StepResult } from "./types";
import {
  hexagram,
  liuqinFor,
  liuShenStart,
  LIUSHEN,
  NAKKA,
  TRIGRAM_WX,
  trigramFromBinary,
  yingOf,
  type TrigramName,
} from "./yijing";

export const LIUYAO_ID = "liuyao";

type Toss = 6 | 7 | 8 | 9;

/** 一次摇掷三枚：背=3 字=2，和为 6/7/8/9 */
export function tossOnce(): Toss {
  let s = 0;
  for (let i = 0; i < 3; i++) s += Math.random() < 0.5 ? 3 : 2;
  return s as Toss;
}

export function tossLines(tosses: Toss[]): Toss[] {
  return tosses.length === 6 ? tosses : Array.from({ length: 6 }, tossOnce);
}

function yangOf(toss: Toss): number {
  return toss >= 7 ? 1 : 0; // 9/7 阳，8/6 阴
}
function movingOf(toss: Toss): boolean {
  return toss === 6 || toss === 9;
}
function labelOf(toss: Toss): "老阳" | "少阳" | "少阴" | "老阴" {
  return { 9: "老阳", 7: "少阳", 8: "少阴", 6: "老阴" }[toss] as "老阳" | "少阳" | "少阴" | "老阴";
}

interface Yao {
  pos: number;
  yang: boolean;
  moving: boolean;
  label: string;
  gan: string;
  zhi: string;
  wx: string;
  liuqin: string;
  liushen: string;
}

function nth(n: number): string {
  return ["初", "二", "三", "四", "五", "上"][n - 1];
}

function buildRaw(tosses: Toss[], now: Date) {
  const bins = tosses.map(yangOf);
  const lower = trigramFromBinary([bins[0], bins[1], bins[2]] as [number, number, number]);
  const upper = trigramFromBinary([bins[3], bins[4], bins[5]] as [number, number, number]);
  const hex = hexagram(upper, lower);
  // 变卦
  const vbins = bins.map((b, i) => (movingOf(tosses[i]) ? (b === 1 ? 0 : 1) : b));
  const vLower = trigramFromBinary([vbins[0], vbins[1], vbins[2]] as [number, number, number]);
  const vUpper = trigramFromBinary([vbins[3], vbins[4], vbins[5]] as [number, number, number]);
  const vHex = hexagram(vUpper, vLower);

  const rizhu = rizhuFromDate(now);
  const riGan = rizhu[0];
  const riZhi = rizhu[1];
  const sStart = liuShenStart(riGan);
  const kong = xunkong(riGan, riZhi);

  // 纳甲
  const ys: Yao[] = [];
  // 六亲以"卦宫五行"为我（火珠林/卜筮正宗法），非世爻地支五行
  const palaceWx = TRIGRAM_WX[hex.palace];
  for (let i = 0; i < 6; i++) {
    const isLower = i < 3;
    const t: TrigramName = isLower ? hex.lower : hex.upper;
    const nak = NAKKA[t];
    const zhi = nak.zhi[i];
    const gan = isLower ? nak.ganInner : nak.ganOuter;
    const wx = DIZHI_WUXING[zhi];
    ys.push({
      pos: i + 1,
      yang: bins[i] === 1,
      moving: movingOf(tosses[i]),
      label: labelOf(tosses[i]),
      gan,
      zhi,
      wx,
      liuqin: "",
      liushen: LIUSHEN[(sStart + i) % 6],
    });
  }
  for (const y of ys) y.liuqin = liuqinFor(palaceWx, y.wx);

  return {
    本卦: hex.name,
    本卦上下: `${hex.upper}上${hex.lower}下`,
    变卦: vHex.name,
    变卦上下: `${vHex.upper}上${vHex.lower}下`,
    宫: `${hex.palace}宫`,
    世爻: `${nth(hex.shi)}爻`,
    应爻: `${nth(yingOf(hex.shi))}爻`,
    世位: hex.shi,
    应位: yingOf(hex.shi),
    旬空: kong,
    用神: `以卦宫${palaceWx}（${hex.palace}宫）为"我"论六亲。取用神：占事业/官讼/职守取官鬼，占财取妻财，占父母/文书/房产/长辈取父母，占子女/福泽取子孙，占兄弟/同辈/竞争取兄弟，占婚姻男取妻财、女取官鬼。`,
    应期: (() => {
      const moving = ys.filter((y) => y.moving).map((y) => y.zhi);
      return moving.length
        ? `动爻在${moving.join("、")}，应期看动爻所值之日；若涉旬空（${kong.join("")}），则待出空填实之期。`
        : `静卦，应期较缓，看用神旺衰与其值日。`;
    })(),
    日柱: rizhu,
    爻: ys.map((y) => ({
      爻位: `${nth(y.pos)}${y.yang ? "阳" : "阴"}`,
      变: y.moving ? "动" : "静",
      纳: `${y.gan}${y.zhi}`,
      五行: y.wx,
      六亲: y.liuqin,
      六神: y.liushen,
    })),
  };
}

function buildSteps(tosses: Toss[], raw: ReturnType<typeof buildRaw>): StepResult[] {
  return [
    {
      key: "qi",
      title: "一、摇卦得爻",
      desc: "以三枚铜钱摇掷六次，自初爻至上爻，得六爻之变。",
      data: { 摇掷: tosses.map((t) => ({ 值: t, 爻: labelOf(t) })) },
    },
    {
      key: "ding",
      title: "二、定本卦变卦",
      desc: "下三爻为内卦、上三爻为外卦；动爻爻变为变卦。",
      data: { 本卦: raw.本卦, 本卦上下: raw.本卦上下, 变卦: raw.变卦 },
    },
    {
      key: "najia",
      title: "三、装卦纳甲",
      desc: "按八卦纳甲，为六爻配天干地支五行。",
      data: { 爻: raw.爻 },
    },
    {
      key: "shiying",
      title: "四、定世应论六亲",
      desc: "以八宫定世爻，世爻+3为应爻；以世爻五行为我论六亲。",
      data: { 宫: raw.宫, 世爻: raw.世爻, 应爻: raw.应爻, 用神: raw.用神 },
    },
    {
      key: "liushen",
      title: "五、配六神论旬空",
      desc: "以占日日干起六神，依日干支查旬空之支。",
      data: { 六神: raw.爻.map((y) => y.六神), 旬空: raw.旬空, 日柱: raw.日柱 },
    },
  ];
}

export const liuyaoAdapter: AlgorithmAdapter = {
  id: LIUYAO_ID,
  name: "六爻",
  description:
    "六爻（文王卦）铜钱起卦：摇掷六次得本卦变卦，装纳甲、定世应六亲六神。输入 {tosses?}（6 个 6/7/8/9），缺省随机摇掷。",

  parseInput(input: AlgorithmInput) {
    const t = input.tosses;
    if (t == null || t === "") return {};
    if (typeof t !== "string") return null;
    const parts = t.split(/[,，\s]+/).map((s) => Number(s.trim()));
    if (parts.length !== 6) return null;
    if (!parts.every((v) => [6, 7, 8, 9].includes(v))) return null;
    return { tosses: parts.join(",") };
  },

  build(input: AlgorithmInput): DivinationResult {
    const parsed = this.parseInput!(input);
    if (!parsed) {
      throw new Error(
        '六爻输入不合法：tosses 为 6 个 6/7/8/9 逗号分隔，如 "6,7,8,9,6,7"，或留空自动随机摇掷',
      );
    }
    const tosses = tossLines(parseTosses(String(parsed.tosses ?? "")));
    const now = new Date();
    const raw = buildRaw(tosses, now);
    const steps = buildSteps(tosses, raw);
    return { algorithmId: this.id, algorithmName: this.name, input: parsed, steps, raw };
  },
};

function parseTosses(s: string): Toss[] {
  return s
    .split(/[,，\s]+/)
    .map((v) => Number(v.trim()))
    .filter((v) => [6, 7, 8, 9].includes(v)) as Toss[];
}

export type { KeShi };
