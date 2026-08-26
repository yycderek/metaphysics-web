// 黄金课例测试：庚子日 午时 亥将 → 重审课，三传巳→戌→卯
// 与 liuren-py scripts/selfcheck.py 的黄金课例保持一致
import { describe, expect, it } from "vitest";
import { build, chuanTianjiang, sikeEntries } from "@/lib/shike";
import { xunkong, shizhiFromHour } from "@/lib/data";
import { rizhuFromDate } from "@/lib/calendar";

describe("黄金课例：庚子日 午时 亥将", () => {
  const ks = build("庚子", "午", "亥");

  it("课名：重审课（贼克法·下克上）", () => {
    expect(ks.kename).toBe("重审课");
    expect(ks.method).toBe("贼克法");
  });

  it("三传：巳 → 戌 → 卯", () => {
    expect(ks.sanchuan).toEqual(["巳", "戌", "卯"]);
  });

  it("天将：初传勾陈、中传玄武、末传朱雀", () => {
    const chuan = chuanTianjiang(ks);
    expect(chuan.map((c) => c.tianjiang.short)).toEqual(["勾", "武", "朱"]);
    expect(chuan.map((c) => c.tianjiang.full)).toEqual(["勾陈", "玄武", "朱雀"]);
  });

  it("六亲：官鬼 / 父母 / 妻财", () => {
    const chuan = chuanTianjiang(ks);
    expect(chuan.map((c) => c.liuqin)).toEqual(["官鬼", "父母", "妻财"]);
  });

  it("贵人：丑·阳贵（午时白天）", () => {
    expect(ks.guiren).toBe("丑");
    expect(ks.guirenMode).toBe("阳贵");
  });

  it("旬空：辰巳", () => {
    expect(ks.xunkong).toEqual(["辰", "巳"]);
  });

  it("四课共 4 课，有克 1 处", () => {
    const entries = sikeEntries(ks);
    expect(entries).toHaveLength(4);
    expect(entries.filter((e) => e.isKe)).toHaveLength(1);
  });

  it("天盘：亥将加午时，地盘午上天盘亥", () => {
    expect(ks.tianpan["午"]).toBe("亥");
  });
});

describe("工具函数", () => {
  it("时辰换算：23-1 点子时，11-13 午时", () => {
    expect(shizhiFromHour(0)).toBe("子");
    expect(shizhiFromHour(12)).toBe("午");
    expect(shizhiFromHour(23)).toBe("子");
  });

  it("日柱锚点：1900-01-01 = 甲戌", () => {
    expect(rizhuFromDate(new Date(1900, 0, 1))).toBe("甲戌");
  });

  it("旬空：庚子日（甲午旬）空辰巳", () => {
    expect(xunkong("庚", "子")).toEqual(["辰", "巳"]);
  });
});

describe("九宗门分支（防回归）", () => {
  it("伏吟：月将加时令天地盘全同 → 伏吟课", () => {
    // 子将加子时：天盘=地盘
    const ks = build("甲子", "子", "子");
    expect(ks.kename).toBe("伏吟课");
  });

  it("返吟：月将冲时令天地盘对冲 → 返吟课", () => {
    // 午将加子时：天盘=地盘对冲
    const ks = build("甲子", "子", "午");
    expect(ks.kename).toBe("返吟课");
  });
});
