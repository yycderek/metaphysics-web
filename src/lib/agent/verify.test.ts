// 自校验测试：断语"依据"与引擎真实事实逐项比对
import { describe, it, expect } from "vitest";
import { verifyDivination } from "./verify";
import { daliurenAdapter } from "@/lib/algorithms/daliuren";
import type { AgentDivination } from "./types";
import type { DivinationResult } from "@/lib/algorithms/types";

const divination = daliurenAdapter.build({
  rizhu: "庚子",
  shizhi: "午",
  yuejiang: "亥",
}) as DivinationResult;

const base: AgentDivination = {
  卦象: "重审课（巳→戌→卯）",
  算法: "大六壬",
  结论: { 总断: "x", 现状: "y", 建议: "z" },
  逐步: [],
  依据: {
    三传: ["巳", "戌", "卯"],
    天将: ["勾陈", "玄武", "朱雀"],
    六亲: ["官鬼", "父母", "妻财"],
  },
  置信度: "中",
};

describe("verifyDivination", () => {
  it("依据与引擎一致 → ok", () => {
    expect(verifyDivination(divination, base).ok).toBe(true);
  });

  it("天将用简称也能匹配（玄武 vs 武）", () => {
    const x = { ...base, 依据: { ...base.依据!, 天将: ["勾", "武", "朱"] } };
    expect(verifyDivination(divination, x).ok).toBe(true);
  });

  it("三传不符 → 不通过并给出差异", () => {
    const x = { ...base, 依据: { ...base.依据!, 三传: ["午", "卯", "巳"] } };
    const v = verifyDivination(divination, x);
    expect(v.ok).toBe(false);
    expect(v.mismatch).toContain("三传");
  });

  it("六亲不匹配 → 不通过", () => {
    const x = { ...base, 依据: { ...base.依据!, 六亲: ["兄弟", "父母", "妻财"] } };
    expect(verifyDivination(divination, x).ok).toBe(false);
  });

  it("缺依据或无校验算法的结果 → 跳过（ok）", () => {
    const noFacts: AgentDivination = { ...base, 依据: undefined };
    expect(verifyDivination(divination, noFacts).ok).toBe(true);
  });
});
