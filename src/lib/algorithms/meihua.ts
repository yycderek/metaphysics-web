// 梅花易数（报数起卦）适配器：两数起卦 → 上卦/下卦（先天八卦数）+ 动爻 → 本卦/变卦/互卦。
// 输入：{ num1, num2 } 两个正整数（报数起卦）。
import type { AlgorithmAdapter, AlgorithmInput, DivinationResult, StepResult } from "./types";
import {
  TRIGRAM_BINARY,
  TRIGRAM_ORDER,
  TRIGRAM_WX,
  hexagram,
  trigramFromBinary,
  type TrigramName,
} from "./yijing";
import { sheng, ke } from "@/lib/data";

export const MEIHUA_ID = "meihua";

function trigramByNumber(n: number): TrigramName {
  return TRIGRAM_ORDER[(((n - 1) % 8) + 8) % 8];
}

function binaryOf(hexLines: { lower: TrigramName; upper: TrigramName }): number[] {
  return [...TRIGRAM_BINARY[hexLines.lower], ...TRIGRAM_BINARY[hexLines.upper]];
}

function nameOfUpperLower(binary: number[], flipPos?: number): string {
  const lines = [...binary];
  if (flipPos) lines[flipPos - 1] = lines[flipPos - 1] === 1 ? 0 : 1;
  const lower = trigramFromBinary([lines[0], lines[1], lines[2]] as [number, number, number]);
  const upper = trigramFromBinary([lines[3], lines[4], lines[5]] as [number, number, number]);
  return hexagram(upper, lower).name;
}

function buildRaw(num1: number, num2: number) {
  const upper = trigramByNumber(num1);
  const lower = trigramByNumber(num2);
  const dong = ((((num1 + num2 - 1) % 6) + 6) % 6) + 1; // 动爻 1-6
  const bin = binaryOf({ lower, upper });
  const ben = hexagram(upper, lower);
  const bian = nameOfUpperLower(bin, dong);
  // 互卦：二至四爻为下卦，三至五爻为上卦
  const huLower = trigramFromBinary([bin[1], bin[2], bin[3]] as [number, number, number]);
  const huUpper = trigramFromBinary([bin[2], bin[3], bin[4]] as [number, number, number]);
  const hu = hexagram(huUpper, huLower);
  // 体用：无动爻之卦为体（自己），有动爻之卦为用（所测之事）；动爻在下卦则下卦为用，上卦为用则反之
  const ti = dong <= 3 ? upper : lower;
  const yong = dong <= 3 ? lower : upper;
  const tiWx = TRIGRAM_WX[ti];
  const yongWx = TRIGRAM_WX[yong];
  const rel =
    yongWx === tiWx
      ? "体用比和（吉）"
      : sheng(yongWx, tiWx)
        ? "用生体（吉，事来助我）"
        : sheng(tiWx, yongWx)
          ? "体生用（泄，我费心力）"
          : ke(tiWx, yongWx)
            ? "体克用（小吉，我可制事）"
            : ke(yongWx, tiWx)
              ? "用克体（凶，事克我）"
              : "互不制（平）";
  return {
    上卦: `${upper}（${TRIGRAM_BINARY[upper].join("")}）`,
    下卦: `${lower}（${TRIGRAM_BINARY[lower].join("")}）`,
    动爻: `第${dong}爻`,
    本卦: `${ben.name}（${ben.upper}上${ben.lower}下）`,
    变卦: bian,
    互卦: hu.name,
    体卦: `${ti}（${tiWx}）`,
    用卦: `${yong}（${yongWx}）`,
    体用关系: rel,
    应期: `动爻在${dong}位，其事多应于动爻之期；${rel.includes("凶") ? "凶应速、宜慎" : "吉应渐、可待"}`,
    报数: [num1, num2],
  };
}

function buildSteps(num1: number, num2: number, raw: ReturnType<typeof buildRaw>): StepResult[] {
  return [
    {
      key: "guashu",
      title: "一、以数起卦",
      desc: "先天八卦数：乾1兑2离3震4巽5坎6艮7坤8。余数定上下卦。",
      data: { 报数: raw.报数, 上卦: raw.上卦, 下卦: raw.下卦 },
    },
    {
      key: "dong",
      title: "二、定动爻",
      desc: "两数之和被6除取余定动爻，动爻所在卦性随变。",
      data: { 动爻: raw.动爻 },
    },
    {
      key: "tiyong",
      title: "三、别体用",
      desc: "无动爻之卦为体（我），有动爻之卦为用（所测之事），以五行生克断吉凶。",
      data: { 体卦: raw.体卦, 用卦: raw.用卦, 体用关系: raw.体用关系 },
    },
    { key: "ben", title: "四、得本卦", desc: "上卦与下卦相叠成本卦。", data: { 本卦: raw.本卦 } },
    {
      key: "hu",
      title: "五、取互卦",
      desc: "本卦二三四爻为下卦、三四五爻为上卦，成互卦以观事之中间。",
      data: { 互卦: raw.互卦 },
    },
    {
      key: "bian",
      title: "六、得变卦",
      desc: "动爻阴阳互变，成变卦以观事之结局。",
      data: { 变卦: raw.变卦 },
    },
  ];
}

export const meihuaAdapter: AlgorithmAdapter = {
  id: MEIHUA_ID,
  name: "梅花易数",
  description:
    "梅花易数（报数起卦）：取两个数字，先天八卦数定上下卦，以和定动爻，得本卦/互卦/变卦。输入 {num1, num2}。",

  parseInput(input: AlgorithmInput) {
    const a = Number(input.num1);
    const b = Number(input.num2);
    if (!Number.isInteger(a) || !Number.isInteger(b) || a <= 0 || b <= 0) return null;
    return { num1: a, num2: b };
  },

  build(input: AlgorithmInput): DivinationResult {
    const parsed = this.parseInput!(input);
    if (!parsed) {
      throw new Error(
        '梅花易数输入不合法：需要 { num1, num2 } 两个正整数（报数起卦），如 {"num1":17,"num2":32}',
      );
    }
    const raw = buildRaw(parsed.num1 as number, parsed.num2 as number);
    const steps = buildSteps(parsed.num1 as number, parsed.num2 as number, raw);
    return { algorithmId: this.id, algorithmName: this.name, input: parsed, steps, raw };
  },
};
