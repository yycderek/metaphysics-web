// 示例本地插件：小六壬（数字起课法）
// 规则：大安起月 → 月上起日 → 日上起时，六宫循环数数
// 掌诀顺序：大安(1) 留连(2) 速喜(3) 赤口(4) 小吉(5) 空亡(6)
// 用法示例：build({ month: 3, day: 18, hour: 7 })
import type { AlgorithmAdapter, AlgorithmInput, StepResult } from "@/lib/algorithms/types";

export const XIAOLIUREN_ID = "xiaoliuren";

const PALMS = ["大安", "留连", "速喜", "赤口", "小吉", "空亡"] as const;
type Palm = (typeof PALMS)[number];

const MEANING: Record<Palm, string> = {
  大安: "身不动时，五行属木，青色，主平安顺遂，谋事可成",
  留连: "卒未归时，五行属水，黑色，主事难成，宜缓不宜急",
  速喜: "人即至时，五行属火，红色，主喜事临门，求财可行",
  赤口: "官事凶时，五行属金，白色，主口舌是非，谨言慎行",
  小吉: "人来喜时，五行属水，六合，主凡事和合，有贵人助",
  空亡: "音信稀时，五行属土，黄色，主谋事落空，需待时机",
};

const AUSPICIOUS: Record<Palm, "吉" | "中" | "凶"> = {
  大安: "吉",
  留连: "凶",
  速喜: "吉",
  赤口: "凶",
  小吉: "吉",
  空亡: "凶",
};

/** 从 start（0-5）起数 count 步（1-based），返回落点索引 */
function countFrom(start: number, count: number): number {
  return (start + count - 1 + 6) % 6;
}

export const xiaoliurenAdapter: AlgorithmAdapter = {
  id: XIAOLIUREN_ID,
  name: "小六壬",
  description: "小六壬（数字起课）：输入月/日/时三个数字，大安起月、月上起日、日上起时。",

  parseInput(input: AlgorithmInput) {
    const month = Number(input.month);
    const day = Number(input.day);
    const hour = Number(input.hour);
    if (![month, day, hour].every((n) => Number.isInteger(n) && n >= 1 && n <= 30)) return null;
    return { month, day, hour };
  },

  build(input: AlgorithmInput) {
    const parsed = this.parseInput!(input);
    if (!parsed) {
      throw new Error(
        '小六壬输入不合法：需要 month/day/hour 三个 1-30 的整数，如 {"month":3,"day":18,"hour":7}',
      );
    }
    const month = Number(parsed.month);
    const day = Number(parsed.day);
    const hour = Number(parsed.hour);

    const yueIdx = countFrom(0, month);
    const riIdx = countFrom(yueIdx, day);
    const shiIdx = countFrom(riIdx, hour);
    const palm = PALMS[shiIdx];

    const steps: StepResult[] = [
      {
        key: "yue",
        title: "一、大安起月",
        desc: `从大安起正月，顺数 ${month} 个月，落${PALMS[yueIdx]}。`,
        data: { from: "大安", count: month, landed: PALMS[yueIdx] },
      },
      {
        key: "ri",
        title: "二、月上起日",
        desc: `从${PALMS[yueIdx]}宫起初一，顺数 ${day} 天，落${PALMS[riIdx]}。`,
        data: { from: PALMS[yueIdx], count: day, landed: PALMS[riIdx] },
      },
      {
        key: "shi",
        title: "三、日上起时",
        desc: `从${PALMS[riIdx]}宫起子时，顺数 ${hour} 个时辰，落${palm}。`,
        data: { from: PALMS[riIdx], count: hour, landed: palm },
      },
    ];

    return {
      algorithmId: XIAOLIUREN_ID,
      algorithmName: "小六壬",
      input: parsed,
      steps,
      raw: {
        palm,
        auspicious: AUSPICIOUS[palm],
        meaning: MEANING[palm],
        numerology: { month, day, hour },
      },
    };
  },
};
