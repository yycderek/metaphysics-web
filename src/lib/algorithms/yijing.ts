// 易学（周易）公共数据与查询：六十四卦、八宫世应、纳甲、先天八卦数。
// 供六爻/梅花易数适配器复用。数据依据标准《分宫卦象次序歌》与纳甲规则。
import { DIZHI_WUXING } from "@/lib/data";
import type { KeShi } from "@/lib/types";

// ---- 八卦 ----
// 先天八卦数：乾1 兑2 离3 震4 巽5 坎6 艮7 坤8
export const TRIGRAM_ORDER = ["乾", "兑", "离", "震", "巽", "坎", "艮", "坤"] as const;
export type TrigramName = (typeof TRIGRAM_ORDER)[number];

// 三爻二进制，自下而上，阳=1 阴=0
export const TRIGRAM_BINARY: Record<TrigramName, [number, number, number]> = {
  乾: [1, 1, 1],
  兑: [1, 1, 0],
  离: [1, 0, 1],
  震: [1, 0, 0],
  巽: [0, 1, 1],
  坎: [0, 1, 0],
  艮: [0, 0, 1],
  坤: [0, 0, 0],
};

// 八卦五行
export const TRIGRAM_WX: Record<TrigramName, string> = {
  乾: "金",
  兑: "金",
  离: "火",
  震: "木",
  巽: "木",
  坎: "水",
  艮: "土",
  坤: "土",
};

// 纳甲：每卦天干（内/外）+ 六爻地支（自下而上）
export interface Nakka {
  ganInner: string;
  ganOuter: string;
  zhi: string[];
  wx: string;
}
export const NAKKA: Record<TrigramName, Nakka> = {
  乾: { ganInner: "甲", ganOuter: "壬", zhi: ["子", "寅", "辰", "午", "申", "戌"], wx: "金" },
  兑: { ganInner: "丁", ganOuter: "丁", zhi: ["巳", "卯", "丑", "亥", "酉", "未"], wx: "金" },
  离: { ganInner: "己", ganOuter: "己", zhi: ["卯", "丑", "亥", "酉", "未", "巳"], wx: "火" },
  震: { ganInner: "庚", ganOuter: "庚", zhi: ["子", "寅", "辰", "午", "申", "戌"], wx: "木" },
  巽: { ganInner: "辛", ganOuter: "辛", zhi: ["丑", "亥", "酉", "未", "巳", "卯"], wx: "木" },
  坎: { ganInner: "戊", ganOuter: "戊", zhi: ["寅", "辰", "午", "申", "戌", "子"], wx: "水" },
  艮: { ganInner: "丙", ganOuter: "丙", zhi: ["辰", "午", "申", "戌", "子", "寅"], wx: "土" },
  坤: { ganInner: "乙", ganOuter: "癸", zhi: ["未", "巳", "卯", "丑", "亥", "酉"], wx: "土" },
};

// ---- 六十四卦（名 / 上下卦 / 所属宫 / 世爻） ----
export interface Hexagram {
  name: string;
  lower: TrigramName;
  upper: TrigramName;
  palace: TrigramName;
  /** 世爻位置（1-6），应爻 = 世爻+3 循环 */
  shi: number;
}

const H: Array<[string, TrigramName, TrigramName, TrigramName, number]> = [
  ["乾为天", "乾", "乾", "乾", 6],
  ["天风姤", "巽", "乾", "乾", 1],
  ["天山遁", "艮", "乾", "乾", 2],
  ["天地否", "坤", "乾", "乾", 3],
  ["风地观", "坤", "巽", "乾", 4],
  ["山地剥", "坤", "艮", "乾", 5],
  ["火地晋", "坤", "离", "乾", 4],
  ["火天大有", "乾", "离", "乾", 3],
  ["坎为水", "坎", "坎", "坎", 6],
  ["水泽节", "兑", "坎", "坎", 1],
  ["水雷屯", "震", "坎", "坎", 2],
  ["水火既济", "离", "坎", "坎", 3],
  ["泽火革", "离", "兑", "坎", 4],
  ["雷火丰", "离", "震", "坎", 5],
  ["地火明夷", "离", "坤", "坎", 4],
  ["地水师", "坎", "坤", "坎", 3],
  ["艮为山", "艮", "艮", "艮", 6],
  ["山火贲", "离", "艮", "艮", 1],
  ["山天大畜", "乾", "艮", "艮", 2],
  ["山泽损", "兑", "艮", "艮", 3],
  ["火泽睽", "兑", "离", "艮", 4],
  ["天泽履", "兑", "乾", "艮", 5],
  ["风泽中孚", "兑", "巽", "艮", 4],
  ["风山渐", "艮", "巽", "艮", 3],
  ["震为雷", "震", "震", "震", 6],
  ["雷地豫", "坤", "震", "震", 1],
  ["雷水解", "坎", "震", "震", 2],
  ["雷风恒", "巽", "震", "震", 3],
  ["地风升", "巽", "坤", "震", 4],
  ["水风井", "巽", "坎", "震", 5],
  ["泽风大过", "巽", "兑", "震", 4],
  ["泽雷随", "震", "兑", "震", 3],
  ["巽为风", "巽", "巽", "巽", 6],
  ["风天小畜", "乾", "巽", "巽", 1],
  ["风火家人", "离", "巽", "巽", 2],
  ["风雷益", "震", "巽", "巽", 3],
  ["天雷无妄", "震", "乾", "巽", 4],
  ["火雷噬嗑", "震", "离", "巽", 5],
  ["山雷颐", "震", "艮", "巽", 4],
  ["山风蛊", "巽", "艮", "巽", 3],
  ["离为火", "离", "离", "离", 6],
  ["火山旅", "艮", "离", "离", 1],
  ["火风鼎", "巽", "离", "离", 2],
  ["火水未济", "坎", "离", "离", 3],
  ["山水蒙", "坎", "艮", "离", 4],
  ["风水涣", "坎", "巽", "离", 5],
  ["天水讼", "坎", "乾", "离", 4],
  ["天火同人", "离", "乾", "离", 3],
  ["坤为地", "坤", "坤", "坤", 6],
  ["地雷复", "震", "坤", "坤", 1],
  ["地泽临", "兑", "坤", "坤", 2],
  ["地天泰", "乾", "坤", "坤", 3],
  ["雷天大壮", "乾", "震", "坤", 4],
  ["泽天夬", "乾", "兑", "坤", 5],
  ["水天需", "乾", "坎", "坤", 4],
  ["水地比", "坤", "坎", "坤", 3],
  ["兑为泽", "兑", "兑", "兑", 6],
  ["泽水困", "坎", "兑", "兑", 1],
  ["泽地萃", "坤", "兑", "兑", 2],
  ["泽山咸", "艮", "兑", "兑", 3],
  ["水山蹇", "艮", "坎", "兑", 4],
  ["地山谦", "艮", "坤", "兑", 5],
  ["雷山小过", "艮", "震", "兑", 4],
  ["雷泽归妹", "兑", "震", "兑", 3],
];

export const HEXAGRAMS: Hexagram[] = H.map(([name, lower, upper, palace, shi]) => ({
  name,
  lower,
  upper,
  palace,
  shi,
}));

/** 由卦名取六爻二进制（自下而上，阳=1 阴=0） */
export function hexagramBinary(name: string): number[] {
  const h = HEXAGRAMS.find((x) => x.name === name || x.name.startsWith(name));
  if (!h) throw new Error(`未知卦名：${name}`);
  return [...TRIGRAM_BINARY[h.lower], ...TRIGRAM_BINARY[h.upper]];
}

const HEX_BY_UPPER_LOWER = new Map<string, Hexagram>();
for (const h of HEXAGRAMS) HEX_BY_UPPER_LOWER.set(`${h.upper}|${h.lower}`, h);

export function hexagram(upper: TrigramName, lower: TrigramName): Hexagram {
  const h = HEX_BY_UPPER_LOWER.get(`${upper}|${lower}`);
  if (!h) throw new Error(`未知卦：上${upper}下${lower}`);
  return h;
}

/** 应爻位置：世爻 + 3 循环（1-6） */
export function yingOf(shi: number): number {
  return ((shi + 2) % 6) + 1;
}

/** 由三爻二进制取卦名 */
export function trigramFromBinary(b: [number, number, number]): TrigramName {
  for (const [name, bin] of Object.entries(TRIGRAM_BINARY) as [
    TrigramName,
    [number, number, number],
  ][]) {
    if (bin[0] === b[0] && bin[1] === b[1] && bin[2] === b[2]) return name;
  }
  throw new Error(`未知三爻：${b.join("")}`);
}

/** 六爻地支具体位：内卦(下)用 zhi[0..2]，外卦(上)用 zhi[3..5] */
export function liuyaoZhili(h: Hexagram): string[] {
  const inner = NAKKA[h.lower].zhi.slice(0, 3);
  const outer = NAKKA[h.upper].zhi.slice(3, 6);
  return [...inner, ...outer];
}

/** 六亲：以世爻地支五行为"我" */
export function liuqinFor(woWx: string, lineWx: string): string {
  return liuqinRelative(woWx, lineWx);
}

function liuqinRelative(wo: string, other: string): string {
  const sheng = (a: string, b: string) => {
    const M: Record<string, string> = { 木: "火", 火: "土", 土: "金", 金: "水", 水: "木" };
    return M[a] === b;
  };
  const ke = (a: string, b: string) => {
    const M: Record<string, string> = { 木: "土", 土: "水", 水: "火", 火: "金", 金: "木" };
    return M[a] === b;
  };
  if (other === wo) return "兄弟";
  if (sheng(wo, other)) return "子孙";
  if (sheng(other, wo)) return "父母";
  if (ke(wo, other)) return "妻财";
  if (ke(other, wo)) return "官鬼";
  return "";
}

/** 六神起始：以日干定（青龙朱雀勾陈螣蛇白虎玄武），初爻起 0 */
export const LIUSHEN = ["青龙", "朱雀", "勾陈", "螣蛇", "白虎", "玄武"] as const;
export function liuShenStart(riGan: string): number {
  if ("甲乙".includes(riGan)) return 0;
  if ("丙丁".includes(riGan)) return 1;
  if (riGan === "戊") return 2;
  if (riGan === "己") return 3;
  if ("庚辛".includes(riGan)) return 4;
  if ("壬癸".includes(riGan)) return 5;
  return 0;
}

export { DIZHI_WUXING };
export type { KeShi };
