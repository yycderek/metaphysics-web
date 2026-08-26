// 阶段4：远程算法服务适配器测试（mock fetch）
import { describe, expect, it, vi, afterEach } from "vitest";
import { createRemoteAdapter } from "./algorithms/remote";
import { registerAdapter, buildDivination, getAdapter } from "./algorithms/registry";
import { xiaoliurenAdapter } from "../plugins/examples/xiaoliuren";

const VALID_RESULT = {
  algorithmId: "xiaoliuren-remote",
  algorithmName: "小六壬(远程)",
  input: { month: 3, day: 18, hour: 7 },
  steps: [{ key: "yue", title: "一、大安起月", desc: "顺数 3 个月。", data: { landed: "速喜" } }],
  raw: { palm: "速喜", auspicious: "吉" },
};

function mockFetchOnce(impl: (url: string, init?: RequestInit) => Promise<Response> | Response) {
  vi.stubGlobal("fetch", vi.fn(impl));
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("远程算法服务适配器", () => {
  it("成功路径：POST input → 解析 DivinationResult", async () => {
    const fetchMock = vi.fn(async (_url: string, _init?: RequestInit) => {
      return new Response(JSON.stringify(VALID_RESULT), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    const adapter = createRemoteAdapter({
      id: "xiaoliuren-remote",
      name: "小六壬(远程)",
      url: "https://example.com/divine",
    });
    const result = await adapter.build({ month: 3, day: 18, hour: 7 });

    const [calledUrl, calledInit] = fetchMock.mock.calls[0];
    expect(calledUrl).toBe("https://example.com/divine");
    expect(JSON.parse(String(calledInit?.body))).toEqual({ input: { month: 3, day: 18, hour: 7 } });
    expect(result.algorithmId).toBe("xiaoliuren-remote");
    expect(result.steps).toHaveLength(1);
    expect((result.raw as { palm: string }).palm).toBe("速喜");
  });

  it("HTTP 非 200 → 明确错误（含状态码）", async () => {
    mockFetchOnce(async () => new Response("bad request", { status: 400 }));
    const adapter = createRemoteAdapter({ id: "r1", name: "远程", url: "http://x/divine" });
    await expect(adapter.build({ a: 1 })).rejects.toThrow(/HTTP 400/);
  });

  it("非 JSON 响应 → 明确错误", async () => {
    mockFetchOnce(async () => new Response("<html>oops</html>", { status: 200 }));
    const adapter = createRemoteAdapter({ id: "r2", name: "远程", url: "http://x/divine" });
    await expect(adapter.build({ a: 1 })).rejects.toThrow(/非 JSON/);
  });

  it("结构不合法（缺 algorithmId）→ 明确错误", async () => {
    mockFetchOnce(
      async () =>
        new Response(JSON.stringify({ steps: [] }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
    );
    const adapter = createRemoteAdapter({ id: "r3", name: "远程", url: "http://x/divine" });
    await expect(adapter.build({ a: 1 })).rejects.toThrow(/响应格式不合法/);
  });

  it("网络不可达 → 明确错误", async () => {
    mockFetchOnce(async () => {
      throw new Error("fetch failed");
    });
    const adapter = createRemoteAdapter({ id: "r4", name: "远程", url: "http://x/divine" });
    await expect(adapter.build({ a: 1 })).rejects.toThrow(/不可达/);
  });

  it("parseInput：纯字符串/数字键值通过，其他拒绝", () => {
    const adapter = createRemoteAdapter({ id: "r5", name: "远程", url: "http://x/divine" });
    expect(adapter.parseInput?.({ month: 3, day: "18" })).toEqual({ month: 3, day: "18" });
    expect(adapter.parseInput?.({ nested: {} as unknown as string })).toBeNull();
  });

  it("注册到注册表后 buildDivination 可异步调用", async () => {
    mockFetchOnce(
      async () =>
        new Response(JSON.stringify(VALID_RESULT), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
    );
    registerAdapter(
      createRemoteAdapter({
        id: "xiaoliuren-remote",
        name: "小六壬(远程)",
        url: "https://example.com/divine",
      }),
    );
    expect(getAdapter("xiaoliuren-remote")).toBeDefined();
    const result = await buildDivination("xiaoliuren-remote", { month: 3, day: 18, hour: 7 });
    expect(result.algorithmName).toBe("小六壬(远程)");
  });
});

describe("本地插件示例：小六壬", () => {
  it("黄金用例：3月18日7时 → 留连（凶）", async () => {
    const r = await xiaoliurenAdapter.build({ month: 3, day: 18, hour: 7 });
    // 3月: 大安起1 → 速喜(3)；18日: 速喜起1 → 留连；7时: 留连起1 → 留连
    expect(r.raw).toMatchObject({ palm: "留连", auspicious: "凶" });
    expect(r.steps).toHaveLength(3);
  });

  it("非法输入抛出明确错误", () => {
    expect(() => xiaoliurenAdapter.build({ month: 0 })).toThrow(/输入不合法/);
    expect(xiaoliurenAdapter.parseInput?.({ month: 3, day: 18 })).toBeNull();
  });
});
