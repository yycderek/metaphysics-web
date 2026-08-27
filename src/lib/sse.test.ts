// SSE 增量解析测试：覆盖 CRLF、跨 chunk 边界、[DONE]、注释行等，防回归
import { describe, it, expect } from "vitest";
import { consumeSSE, parseSSEEvent } from "./sse";

const data = (o: unknown) => `data: ${JSON.stringify(o)}`;

describe("consumeSSE 分块与换行归一化", () => {
  it("单 chunk 多 event，按空行分离", () => {
    const chunk = `${data({ a: 1 })}\n\n${data({ a: 2 })}\n\n`;
    const { events, rest } = consumeSSE("", chunk);
    expect(events).toEqual([data({ a: 1 }), data({ a: 2 })]);
    expect(rest).toBe("");
  });

  it("CRLF（\\r\\n\\r\\n）也能正确切分", () => {
    const chunk = `${data({ a: 1 })}\r\n\r\n${data({ a: 2 })}\r\n\r\n`;
    const { events, rest } = consumeSSE("", chunk);
    expect(events).toHaveLength(2);
    expect(rest).toBe("");
  });

  it("不完整尾部块保留在 rest，下次续读", () => {
    const { events, rest } = consumeSSE("", `${data({ a: 1 })}\n\n${data({ a: 2 })}`);
    expect(events).toEqual([data({ a: 1 })]);
    expect(rest).toBe(data({ a: 2 }));
    const next = consumeSSE(rest, "\n\n");
    expect(next.events).toEqual([data({ a: 2 })]);
    expect(next.rest).toBe("");
  });

  it("event 块跨 chunk 边界拼在一起", () => {
    // 第一个 chunk 是前一半，第二个 chunk 补全
    const first = `${data({ a: 1 })}\n\ndata: {`;
    const second = `"a":2}\n\n`;
    const { events, rest } = consumeSSE(first, second);
    expect(events).toEqual([data({ a: 1 }), data({ a: 2 })]);
    expect(rest).toBe("");
  });
});

describe("parseSSEEvent", () => {
  it("解析 data 载荷并 trim", () => {
    expect(parseSSEEvent('data: {"a":1}')).toEqual({ type: "data", payload: `{"a":1}` });
    expect(parseSSEEvent(' data:  {"a":1}  ')).toEqual({ type: "data", payload: `{"a":1}` });
  });

  it("[DONE] 标记流结束", () => {
    expect(parseSSEEvent("data: [DONE]")).toEqual({ type: "done" });
  });

  it("注释行（:）与 event:/id: 行忽略", () => {
    expect(parseSSEEvent(": keep-alive")).toEqual({ type: "ignore" });
    expect(parseSSEEvent("event: message")).toEqual({ type: "ignore" });
    expect(parseSSEEvent("id: 1")).toEqual({ type: "ignore" });
  });
});
