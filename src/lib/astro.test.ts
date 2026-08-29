// 天文工具测试：太阳黄经→月将、均时差、真太阳时
import { describe, it, expect } from "vitest";
import {
  yuejiangFromSolarLongitude,
  yuejiangFromDate,
  solarLongitude,
  trueSolarHour,
} from "./astro";

describe("月将（节气精确）", () => {
  it("黄经→月将映射（中气后换将）", () => {
    // 雨水(330)→亥，春分(0)→戌，谷雨(30)→酉，夏至(90)→未，冬至(270)→丑
    expect(yuejiangFromSolarLongitude(330)).toBe("亥");
    expect(yuejiangFromSolarLongitude(0)).toBe("戌");
    expect(yuejiangFromSolarLongitude(30)).toBe("酉");
    expect(yuejiangFromSolarLongitude(90)).toBe("未");
    expect(yuejiangFromSolarLongitude(270)).toBe("丑");
  });

  it("春分后为戌将（秋分后为辰将）", () => {
    // 用纯映射校验日期：春分(3/20)→谷雨(4/5) 区间为戌将；秋分(9/23)→霜降(10/7) 区间为辰将
    expect(yuejiangFromDate(new Date(2026, 2, 27))).toBe("戌");
    expect(yuejiangFromDate(new Date(2026, 8, 30))).toBe("辰");
  });

  it("太阳黄经落在 [0, 360)", () => {
    const l = solarLongitude(new Date(2026, 2, 20, 12));
    expect(l).toBeGreaterThanOrEqual(0);
    expect(l).toBeLessThan(360);
  });
});

describe("真太阳时", () => {
  it("东经120°（中国标准时）正午接近12点；均时差使不同日期略有差异", () => {
    const noon = new Date(2026, 5, 21, 12, 0); // 6月正午
    const h = trueSolarHour(noon, 120);
    expect(h).toBeGreaterThan(10);
    expect(h).toBeLessThan(15);
  });

  it("经度偏移：东经0° 相对120° 往西8小时", () => {
    const noon = new Date(2026, 5, 21, 12, 0);
    const h = trueSolarHour(noon, 0);
    // 12 + (0-120)/15 = 12 - 8 = 4（±均时差）
    expect(Math.round(h)).toBeGreaterThanOrEqual(3);
    expect(Math.round(h)).toBeLessThanOrEqual(5);
  });
});
