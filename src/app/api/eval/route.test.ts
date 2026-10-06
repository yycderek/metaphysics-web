// /api/eval 路由测试：非法 baseUrl 403、models 校验 400
// mock 上游 fetch，不发真实请求
import { describe, it, expect, vi, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "./route";

function makeReq(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/eval", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.AI_API_KEY;
  delete process.env.DEEPSEEK_API_KEY;
});

describe("POST /api/eval baseUrl 白名单", () => {
  it("自定义 baseUrl 不在允许名单 → 403，不请求上游", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const res = await POST(
      makeReq({
        models: "deepseek-v4-flash",
        aiConfig: { baseUrl: "https://evil.example.com", apiKey: "k" },
      }),
    );
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toContain("允许名单");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("非法 URL 字符串 → 403（URL 解析失败一律拒绝）", async () => {
    const res = await POST(
      makeReq({ models: ["deepseek-v4-flash"], aiConfig: { baseUrl: "not-a-url", apiKey: "k" } }),
    );
    expect(res.status).toBe(403);
  });
});

describe("POST /api/eval 输入校验", () => {
  it("请求体非 JSON → 400", async () => {
    const res = await POST(makeReq("not-json{"));
    expect(res.status).toBe(400);
  });

  it("缺 models 或解析后为空 → 400", async () => {
    const res1 = await POST(makeReq({}));
    expect(res1.status).toBe(400);
    const res2 = await POST(makeReq({ models: "  , ，" }));
    expect(res2.status).toBe(400);
    const res3 = await POST(makeReq({ models: 42 }));
    expect(res3.status).toBe(400);
  });
});
