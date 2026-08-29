// 断课质量评估：黄金题库。每个用例固定输入 → 引擎确定起课 → 评判模型断语质量。
// 仅用确定性算法（大六壬/梅花/小六壬），保证可复现对比。
import type { AlgorithmInput } from "../algorithms/types";

export interface EvalCase {
  id: string;
  title: string;
  algorithm: "daliuren" | "meihua" | "xiaoliuren";
  input: AlgorithmInput;
  question: string;
  /** 期望卦名/课名（用于硬校验 卦象一致） */
  期望卦象: string;
  /** 期望断语应覆盖的关键卦理（供 judge 打分对照） */
  关键: string[];
  /** judge 评分标准 */
  rubric: string[];
}

export const EVAL_CASES: EvalCase[] = [
  {
    id: "daliuren-golden",
    title: "大六壬·重审课（事业）",
    algorithm: "daliuren",
    input: { rizhu: "庚子", shizhi: "午", yuejiang: "亥" },
    question: "看我最近事业运势",
    期望卦象: "重审课",
    关键: ["三传 巳→戌→卯", "初传巳官鬼·旬空", "中传戌父母·玄武", "末传卯妻财·朱雀", "旬空辰巳"],
    rubric: [
      "紧扣大六壬课式：课名、三传、天将、六亲、旬空，无虚构",
      "抓对了用神与关键（初传官鬼空亡、中传父母、末传妻财）",
      "断语先总断后分述、逻辑自洽，不与课式矛盾",
      "建议具体、可落地，不虚饰",
    ],
  },
  {
    id: "daliuren-fuyin",
    title: "大六壬·伏吟课（感情）",
    algorithm: "daliuren",
    input: { rizhu: "甲子", shizhi: "子", yuejiang: "子" },
    question: "看我和对象近来的感情",
    期望卦象: "伏吟课",
    关键: ["天地盘全同", "自刑/静守之象", "情意在而不动"],
    rubric: [
      "准确点出伏吟课（天地盘同、静守之象）",
      "紧扣六亲/旺衰，无凭空发挥",
      "先总断后分述、逻辑自洽",
      "建议贴合伏吟守静之意",
    ],
  },
  {
    id: "meihua-lv",
    title: "梅花·火山旅（出行）",
    algorithm: "meihua",
    input: { num1: 3, num2: 7 },
    question: "看明天出行",
    期望卦象: "火山旅",
    关键: ["本卦火山旅", "动爻第4爻→变艮为山", "体用关系"],
    rubric: [
      "紧扣梅花：本卦/变卦/动爻/体用，无虚构",
      "准确指出动爻与变卦",
      "断语与体用生克逻辑一致",
      "建议贴合出行主题、可落地",
    ],
  },
];
