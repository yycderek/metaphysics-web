// 用神（引擎锚定）测试 + 梅花/小六壬不受影响的回归
import { describe, it, expect } from "vitest";
import { yongShenFor, daliurenYongShen, liuyaoYongShen } from "./yongshen";
import { getDivineTemplate } from "./registry";
import "./index";
import { daliurenAdapter, rawKeShi } from "@/lib/algorithms/daliuren";
import { chuanTianjiang } from "@/lib/shike";
import { liuyaoAdapter } from "@/lib/algorithms/liuyao";
import { meihuaAdapter } from "@/lib/algorithms/meihua";
import { xiaoliurenAdapter } from "@/plugins/examples/xiaoliuren";
import type { DivinationResult } from "@/lib/algorithms/types";

describe("yongShenFor 映射", () => {
  it("按事类映射六亲", () => {
    expect(yongShenFor("daliuren", "看看事业晋职")).toBe("官鬼");
    expect(yongShenFor("daliuren", "求财运")).toBe("妻财");
    expect(yongShenFor("daliuren", "我和对象感情")).toBe("妻财");
    expect(yongShenFor("daliuren", "考试考公")).toBe("父母");
    expect(yongShenFor("daliuren", "随便问问")).toBeNull();
  });
});

describe("大六壬用神锚定", () => {
  it("黄金课例（官鬼/父母/妻财）事业→官鬼→初传巳·旬空", () => {
    const div = daliurenAdapter.build({
      rizhu: "庚子",
      shizhi: "午",
      yuejiang: "亥",
    }) as DivinationResult;
    const chuan = chuanTianjiang(rawKeShi(div));
    const line = daliurenYongShen(chuan, ["辰", "巳"], "官鬼", "夏");
    expect(line).toContain("用神：官鬼");
    expect(line).toContain("初传");
    expect(line).toContain("巳");
    expect(line).toContain("旬空");
  });
});

describe("六爻用神锚定", () => {
  it("乾为天（我=宫金）事业→官鬼→四爻午火", () => {
    const div = liuyaoAdapter.build({ tosses: "7,7,7,7,7,7" }) as DivinationResult;
    const line = liuyaoYongShen(div.raw, "官鬼", "夏");
    expect(line).toContain("用神：官鬼");
    expect(line).toContain("四爻");
    expect(line).toContain("午");
    expect(line).toContain("旺衰");
  });
});

describe("回归：梅花 / 小六壬 不受用神影响", () => {
  const build = (tpl: string, raw: unknown) => {
    const t = getDivineTemplate(tpl)!;
    return (
      t.buildMessages({
        algorithmId: tpl,
        algorithmName: tpl,
        input: {},
        raw,
        question: "看看事业",
        season: "夏",
        steps: [],
      })[1].content ?? ""
    );
  };

  it("梅花模板不含用神-六亲（用体用）", () => {
    const div = meihuaAdapter.build({ num1: 3, num2: 7 }) as DivinationResult;
    const ctx = build("meihua", div.raw);
    expect(ctx).not.toContain("用神：");
  });

  it("小六壬模板不含用神-六亲（用掌诀）", () => {
    const div = xiaoliurenAdapter.build({ month: 3, day: 18, hour: 7 }) as DivinationResult;
    const ctx = build("xiaoliuren", div.raw);
    expect(ctx).not.toContain("用神：");
  });
});
