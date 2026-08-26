// 断课模板测试（阶段5）：注册表 + 三个内置模板（大六壬/小六壬/通用）
import { describe, it, expect } from "vitest";
import "@/lib/divine"; // 副作用导入：注册模板
import {
  getDivineTemplate,
  listDivineTemplateIds,
  genericDivineTemplate,
  daliurenDivineTemplate,
  xiaoliurenDivineTemplate,
} from "@/lib/divine";
import { build } from "./shike";
import type { DivineRequest } from "@/lib/divine";

const golden = build("庚子", "午", "亥");

const daliurenReq: DivineRequest = {
  algorithmId: "daliuren",
  algorithmName: "大六壬",
  input: { rizhu: "庚子", shizhi: "午", yuejiang: "亥" },
  raw: golden,
  question: "看事业",
  season: "秋",
};

const xiaoliurenReq: DivineRequest = {
  algorithmId: "xiaoliuren",
  algorithmName: "小六壬",
  input: { month: 3, day: 18, hour: 7 },
  raw: {
    palm: "留连",
    auspicious: "凶",
    meaning: "卒未归时，五行属水，黑色，主事难成，宜缓不宜急",
    numerology: { month: 3, day: 18, hour: 7 },
  },
  steps: [
    {
      key: "yue",
      title: "一、大安起月",
      desc: "从大安起正月，顺数 3 个月，落速喜。",
      data: { landed: "速喜" },
    },
    {
      key: "ri",
      title: "二、月上起日",
      desc: "从速喜宫起初一，顺数 18 天，落留连。",
      data: { landed: "留连" },
    },
    {
      key: "shi",
      title: "三、日上起时",
      desc: "从留连宫起子时，顺数 7 个时辰，落留连。",
      data: { landed: "留连" },
    },
  ],
  question: "看感情",
  season: "四季",
};

const unknownReq: DivineRequest = {
  algorithmId: "bazi",
  algorithmName: "八字排盘",
  input: { year: 1998, month: 10, day: 20 },
  raw: { ganzhi: "戊寅 壬戌 庚子 辛巳", dayMaster: "庚金" },
  question: "看财运",
  season: "秋",
};

describe("断课模板注册表", () => {
  it("内置模板已注册：daliuren / xiaoliuren / __generic__", () => {
    const ids = listDivineTemplateIds();
    expect(ids).toContain("daliuren");
    expect(ids).toContain("xiaoliuren");
    expect(ids).toContain(genericDivineTemplate.id);
  });

  it("未知算法 ID 返回 undefined（路由层应回退通用模板）", () => {
    expect(getDivineTemplate("not-exist")).toBeUndefined();
  });

  it("已注册模板可被按 ID 取回", () => {
    expect(getDivineTemplate("daliuren")).toBe(daliurenDivineTemplate);
    expect(getDivineTemplate("xiaoliuren")).toBe(xiaoliurenDivineTemplate);
  });
});

describe("大六壬断课模板", () => {
  it("system 含大六壬断课原则，user 含完整课式（黄金课例：重审课 巳戌卯）", () => {
    const msgs = daliurenDivineTemplate.buildMessages(daliurenReq);
    expect(msgs).toHaveLength(2);
    expect(msgs[0].role).toBe("system");
    expect(msgs[0].content).toContain("大六壬");
    expect(msgs[0].content).toContain("绝不");
    expect(msgs[1].role).toBe("user");
    expect(msgs[1].content).toContain("重审课");
    expect(msgs[1].content).toContain("巳");
    expect(msgs[1].content).toContain("戌");
    expect(msgs[1].content).toContain("卯");
    expect(msgs[1].content).toContain("看事业");
  });

  it("raw 形状异常时回退通用模板（不崩溃）", () => {
    const bad = daliurenDivineTemplate.buildMessages({ ...daliurenReq, raw: { foo: 1 } });
    expect(bad[0].content).toContain("如实解读"); // 通用模板特征
    expect(bad[1].content).toContain("JSON");
  });
});

describe("小六壬断课模板", () => {
  it("system 含六宫掌诀，user 含三宫链与落宫", () => {
    const msgs = xiaoliurenDivineTemplate.buildMessages(xiaoliurenReq);
    expect(msgs[0].content).toContain("小六壬");
    expect(msgs[0].content).toContain("大安");
    expect(msgs[0].content).toContain("空亡");
    expect(msgs[1].content).toContain("速喜 → 留连 → 留连");
    expect(msgs[1].content).toContain("落宫吉凶：凶");
    expect(msgs[1].content).toContain("看感情");
  });

  it("raw 形状异常时回退通用模板", () => {
    const bad = xiaoliurenDivineTemplate.buildMessages({ ...xiaoliurenReq, raw: null });
    expect(bad[0].content).toContain("如实解读");
  });
});

describe("通用断课模板（fallback）", () => {
  it("未注册算法：system 告知基于数据解读，user 含完整 raw JSON", () => {
    const msgs = genericDivineTemplate.buildMessages(unknownReq);
    expect(msgs[0].content).toContain("八字排盘");
    expect(msgs[0].content).toContain("绝不");
    expect(msgs[1].content).toContain("戊寅");
    expect(msgs[1].content).toContain("dayMaster");
    expect(msgs[1].content).toContain("看财运");
  });

  it("含推导步骤时 user 上下文列出步骤", () => {
    const msgs = genericDivineTemplate.buildMessages({ ...unknownReq, steps: xiaoliurenReq.steps });
    expect(msgs[1].content).toContain("推导步骤");
    expect(msgs[1].content).toContain("大安起月");
  });
});
