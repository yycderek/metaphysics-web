// OpenAI 兼容 SSE 增量解析（纯逻辑，供 AiDuanke 与测试复用）
// 归一化 CRLF，兼容 \n\n / \r\n\r\n / 混用换行，避免 provider 使用 CRLF 时漏解析。

/** 每次读流后的解析结果：本轮已完整的事件块 + 未完整残留 */
export function consumeSSE(buf: string, chunk: string): { events: string[]; rest: string } {
  const whole = buf + chunk;
  const parts = whole.split(/\r?\n\r?\n/);
  const rest = parts.pop() ?? "";
  return { events: parts, rest };
}

export type SSEEventResult =
  { type: "data"; payload: string } | { type: "done" } | { type: "ignore" };

/** 解析单个 event 块：`:` 注释行与 event:/id: 行忽略，data: [DONE] 表示流结束 */
export function parseSSEEvent(event: string): SSEEventResult {
  const line = event.trim();
  if (!line.startsWith("data:")) return { type: "ignore" };
  const payload = line.slice(5).trim();
  if (payload === "[DONE]") return { type: "done" };
  return { type: "data", payload };
}
