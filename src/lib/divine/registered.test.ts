// 六爻/梅花 断课模板注册测试：getDivineTemplate 应返回已注册模板
import { describe, it, expect } from "vitest";
import { getDivineTemplate } from "./registry";
import "./index"; // 副作用导入以注册
import { liuyaoAdapter } from "@/lib/algorithms/liuyao";
import { meihuaAdapter } from "@/lib/algorithms/meihua";
import type { DivinationResult } from "@/lib/algorithms/types";

describe("六爻/梅花断课模板", () => {
  it("已注册 liuyao / meihua 模板", () => {
    expect(getDivineTemplate("liuyao")).toBeDefined();
    expect(getDivineTemplate("meihua")).toBeDefined();
  });

  it("六爻上下文包含排盘（本卦/世应/六亲）", () => {
    const divination = liuyaoAdapter.build({ tosses: "7,7,7,7,7,7" }) as DivinationResult;
    const t = getDivineTemplate("liuyao")!;
    const msgs = t.buildMessages({
      algorithmId: "liuyao",
      algorithmName: "六爻",
      input: {},
      raw: divination.raw,
      question: "看事业",
      season: "夏",
      steps: divination.steps,
    });
    const user = msgs[msgs.length - 1].content ?? "";
    expect(user).toContain("本卦");
    expect(user).toContain("乾为天");
    expect(user).toContain("子孙");
  });

  it("梅花上下文包含本卦/变卦/动爻", () => {
    const divination = meihuaAdapter.build({ num1: 3, num2: 7 }) as DivinationResult;
    const t = getDivineTemplate("meihua")!;
    const msgs = t.buildMessages({
      algorithmId: "meihua",
      algorithmName: "梅花易数",
      input: {},
      raw: divination.raw,
      question: "看出行",
      season: "夏",
      steps: divination.steps,
    });
    const user = msgs[msgs.length - 1].content ?? "";
    expect(user).toContain("火山旅");
    expect(user).toContain("动爻");
  });
});
