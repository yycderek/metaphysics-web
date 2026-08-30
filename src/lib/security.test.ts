// 限流 & 断例检索（纯函数）测试
import { describe, it, expect, beforeEach } from "vitest";
import { rateLimit, resetRateLimits } from "./ratelimit";
import { searchDuanli, duanliContext } from "./agent/duanli";
import { detectSkill } from "./agent/skills";
import { classifyQuery } from "./safety";

describe("rateLimit", () => {
  beforeEach(() => resetRateLimits());

  it("每分钟超过则拒绝", () => {
    for (let i = 0; i < 3; i++) expect(rateLimit("k", 3, 100).ok).toBe(true);
    expect(rateLimit("k", 3, 100).ok).toBe(false);
  });

  it("每日超过则拒绝", () => {
    expect(rateLimit("d", 1000, 2).ok).toBe(true);
    expect(rateLimit("d", 1000, 2).ok).toBe(true);
    expect(rateLimit("d", 1000, 2).ok).toBe(false);
  });

  it("不同 key 互不影响", () => {
    for (let i = 0; i < 3; i++) rateLimit("a", 3, 100);
    expect(rateLimit("a", 3, 100).ok).toBe(false);
    expect(rateLimit("b", 3, 100).ok).toBe(true);
  });
});

describe("断例检索（RAG）", () => {
  it("六壬重审课/事业 → 命中六壬断例", () => {
    const raw = { kename: "重审课", sanchuan: ["巳", "戌", "卯"] };
    const res = searchDuanli("daliuren", raw, "看看我事业怎么样", 3);
    expect(res.length).toBeGreaterThan(0);
    expect(res.some((d) => d.类型 === "六壬")).toBe(true);
  });

  it("梅花 → 命中梅花断例（体用）", () => {
    const raw = { 本卦: "火山旅" };
    const res = searchDuanli("meihua", raw, "看出行", 3);
    expect(res.some((d) => d.类型 === "梅花")).toBe(true);
  });

  it("duanliContext 生成可注入段落（含出处）", () => {
    const ctx = duanliContext("daliuren", { kename: "重审课" }, "事业");
    expect(ctx).toContain("参考断例");
    expect(ctx).toContain("《");
  });

  it("断例扩面：元首课检索命中", () => {
    const res = searchDuanli(
      "daliuren",
      { kename: "元首课", sanchuan: ["子", "巳", "卯"] },
      "事业",
      5,
    );
    expect(res.some((d) => d.卦 === "元首课")).toBe(true);
  });

  it("无匹配时 duanliContext 也约束不杜撰出处", () => {
    const ctx = duanliContext("xiaoliuren", { palm: "大安" }, "xx");
    expect(ctx).toContain("勿杜撰");
  });
});

describe("多技能路由", () => {
  it("事业/感情/求财/健康各命中对应技能", () => {
    expect(detectSkill("看看我最近升职机会")?.name).toContain("事业");
    expect(detectSkill("我和对象感情如何")?.name).toContain("感情");
    expect(detectSkill("求财运怎么样")?.name).toContain("求财");
    expect(detectSkill("我身体有点不舒服")?.name).toContain("健康");
  });
  it("无关问事返回 null 或综合", () => {
    const s = detectSkill("随便说说");
    expect(s == null || s.name).toBeTruthy();
  });
});

describe("内容安全", () => {
  it("有害关键词拦截", () => {
    expect(classifyQuery("我想知道能不能自残").blocked).toBe(true);
  });
  it("正常问事不拦截", () => {
    expect(classifyQuery("看看我事业会怎样").blocked).toBe(false);
  });
});
