// 限流 & 断例检索（纯函数）测试
import { describe, it, expect, beforeEach } from "vitest";
import { rateLimit, resetRateLimits } from "./ratelimit";
import { searchDuanli, duanliContext } from "./agent/duanli";

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
});
