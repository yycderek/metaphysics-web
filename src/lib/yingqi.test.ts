// 应期推算（纯函数）测试
import { describe, it, expect } from "vitest";
import { nextDatesByZhi, yingqiLine, fmtMonthDay } from "./yingqi";

describe("应期推算", () => {
  it("返回日支命中目标支的未来日期（每条为 月/日 文案）", () => {
    const base = new Date(2026, 3, 1);
    const out = nextDatesByZhi(base, ["申"], 3);
    expect(out.length).toBeGreaterThan(0);
    expect(out.length).toBeLessThanOrEqual(3);
    out.forEach((s) => expect(s).toMatch(/^\d+月\d+日$/));
  });

  it("目标支为空则无结果", () => {
    expect(nextDatesByZhi(new Date(2026, 0, 1), [], 3)).toEqual([]);
  });

  it("yingqiLine 生成 label≈date 分段", () => {
    const line = yingqiLine(new Date(2026, 3, 1), [
      { label: "动爻值日", zhis: ["申"] },
      { label: "出空", zhis: ["戌"] },
    ]);
    expect(line).toMatch(/动爻值日≈\d+月\d+日/);
    expect(line).toMatch(/出空≈\d+月\d+日/);
  });

  it("fmtMonthDay 输出中文日期", () => {
    expect(fmtMonthDay(new Date(2026, 2, 21))).toBe("3月21日");
  });
});
