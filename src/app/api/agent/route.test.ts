// /api/agent 路由测试：非法输入 400（不触发上游请求）
import { describe, it, expect, vi, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "./route";

function makeReq(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/agent", {
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

describe("POST /api/agent 输入校验", () => {
  it("请求体非 JSON → 400", async () => {
    const res = await POST(makeReq("not-json{"));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.ok).toBe(false);
  });

  it("缺 question / 空白 question → 400，不请求上游", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const res1 = await POST(makeReq({}));
    expect(res1.status).toBe(400);
    const res2 = await POST(makeReq({ question: "   " }));
    expect(res2.status).toBe(400);
    expect((await res2.json()).error).toContain("问事");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("question 超过 2000 字 → 400", async () => {
    const res = await POST(makeReq({ question: "问".repeat(2001) }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain("过长");
  });

  it("自定义 baseUrl 不在白名单 → 403", async () => {
    const res = await POST(
      makeReq({
        question: "看看最近运势",
        aiConfig: { baseUrl: "https://evil.example.com", apiKey: "k" },
      }),
    );
    expect(res.status).toBe(403);
  });
});
