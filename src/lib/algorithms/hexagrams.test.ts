// 易学数据 & 六爻/梅花适配器测试
import { describe, it, expect } from "vitest";
import { trigramFromBinary, hexagram, TRIGRAM_ORDER, liuqinFor, yingOf } from "./yijing";
import { liuyaoAdapter } from "./liuyao";
import { meihuaAdapter } from "./meihua";
import type { DivinationResult } from "./types";

describe("yijing 数据查询", () => {
  it("三爻二进制 → 八卦", () => {
    expect(trigramFromBinary([1, 1, 1])).toBe("乾");
    expect(trigramFromBinary([1, 0, 0])).toBe("震");
    expect(trigramFromBinary([0, 0, 0])).toBe("坤");
  });

  it("先天八卦数顺序", () => {
    // 乾1兑2离3震4巽5坎6艮7坤8
    expect(TRIGRAM_ORDER).toEqual(["乾", "兑", "离", "震", "巽", "坎", "艮", "坤"]);
  });

  it("上下卦查卦名（乾上乾下→乾为天；坎上震下→水雷屯）", () => {
    expect(hexagram("乾", "乾").name).toBe("乾为天");
    expect(hexagram("坎", "震").name).toBe("水雷屯");
    expect(hexagram("乾", "震").name).toBe("天雷无妄");
  });

  it("应爻 = 世爻+3 循环", () => {
    expect(yingOf(6)).toBe(3);
    expect(yingOf(4)).toBe(1);
    expect(yingOf(1)).toBe(4);
  });

  it("六亲（我=土）", () => {
    expect(liuqinFor("土", "土")).toBe("兄弟"); // 子水: 土克水→妻财
    expect(liuqinFor("土", "水")).toBe("妻财");
    expect(liuqinFor("土", "木")).toBe("官鬼");
    expect(liuqinFor("土", "火")).toBe("父母");
    expect(liuqinFor("土", "金")).toBe("子孙");
  });
});

describe("六爻适配器", () => {
  it("全少阳 777777 → 乾为天，静爻，册五爻世应正确", () => {
    const r = liuyaoAdapter.build({ tosses: "7,7,7,7,7,7" }) as DivinationResult;
    const raw = r.raw as {
      本卦: string;
      变卦: string;
      宫: string;
      世爻: string;
      应爻: string;
      爻: unknown[];
    };
    expect(raw.本卦).toBe("乾为天");
    expect(raw.变卦).toBe("乾为天");
    expect(raw.宫).toBe("乾宫");
    expect(raw.世爻).toBe("上爻");
    expect(raw.应爻).toBe("三爻");
    expect(raw.爻).toHaveLength(6);
  });

  it("初爻老阳 97... → 变卦天风姤（初爻变阴，下卦成巽）", () => {
    const r = liuyaoAdapter.build({ tosses: "9,7,7,7,7,7" }) as DivinationResult;
    const raw = r.raw as { 本卦: string; 变卦: string };
    expect(raw.本卦).toBe("乾为天");
    expect(raw.变卦).toBe("天风姤");
  });

  it("非法输入拒绝", () => {
    expect(() => liuyaoAdapter.build({ tosses: "1,2,3,4,5,6" })).toThrow();
  });
});

describe("梅花易数适配器", () => {
  it("报数 4,13 → 上震下巽 → 雷风恒", () => {
    const r = meihuaAdapter.build({ num1: 4, num2: 13 }) as DivinationResult;
    const raw = r.raw as { 上卦: string; 本卦: string; 动爻: string };
    expect(raw.上卦).toContain("震");
    expect(raw.本卦).toContain("雷风恒");
    expect(typeof raw.动爻).toBe("string");
  });

  it("非法输入拒绝", () => {
    expect(() => meihuaAdapter.build({ num1: 0, num2: 13 })).toThrow();
  });
});
