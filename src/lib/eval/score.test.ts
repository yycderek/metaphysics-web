// 断课评分（纯函数）测试
import { describe, it, expect } from "vitest";
import { scoreGrounding, mentionsExpected, blendTotal } from "./score";
import { EVAL_CASES } from "./cases";
import { daliurenAdapter } from "../algorithms/daliuren";
import type { AgentDivination } from "../agent/types";
import type { DivinationResult } from "../algorithms/types";

const divination = daliurenAdapter.build({
  rizhu: "庚子",
  shizhi: "午",
  yuejiang: "亥",
}) as DivinationResult;

const good: AgentDivination = {
  卦象: "重审课（巳→戌→卯）",
  算法: "大六壬",
  结论: { 总断: "x", 现状: "y", 建议: "z" },
  逐步: [
    { 步骤: "定地盘", 解读: "a" },
    { 步骤: "安天盘", 解读: "b" },
    { 步骤: "排四课", 解读: "c" },
  ],
  依据: {
    三传: ["巳", "戌", "卯"],
    天将: ["勾陈", "玄武", "朱雀"],
    六亲: ["官鬼", "父母", "妻财"],
  },
  置信度: "中",
  出处: "《六壬粹言》",
};

describe("断课评分", () => {
  it("提到期望卦象 → 卦象一致", () => {
    expect(mentionsExpected(good, "重审课")).toBe(true);
    expect(mentionsExpected(good, "涉害课")).toBe(false);
  });

  it("优质断语 grounding 高分（卦象50 + 校验30 + 步骤≥3=20 → 100）", () => {
    const g = scoreGrounding(divination, good, EVAL_CASES[0]);
    expect(g.卦象一致).toBe(true);
    expect(g.自校验通过).toBe(true);
    expect(g.score).toBe(100);
  });

  it("错误卦象 + 依据不符 → 低分", () => {
    const bad: AgentDivination = {
      ...good,
      卦象: "涉害课",
      依据: { 三传: ["午", "卯", "巳"] },
    };
    const g = scoreGrounding(divination, bad, EVAL_CASES[0]);
    expect(g.卦象一致).toBe(false);
    expect(g.自校验通过).toBe(false);
    expect(g.score).toBeLessThan(50);
  });

  it("blendTotal：无 judge 用 grounding，有则加权", () => {
    expect(blendTotal(80, null)).toBe(80);
    expect(blendTotal(80, 100)).toBe(90);
  });
});
