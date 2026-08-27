// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import AiDuanke from "@/components/AiDuanke";
import type { DivinationResult } from "@/lib/algorithms/types";

const result: DivinationResult = {
  algorithmId: "daliuren",
  algorithmName: "大六壬",
  input: { rizhu: "庚子", shizhi: "午", yuejiang: "亥" },
  steps: [],
  raw: { rizhu: "庚子" },
};

function sseResponse(chunks: string[]): Response {
  const encoder = new TextEncoder();
  return new Response(
    new ReadableStream({
      start(controller) {
        for (const c of chunks) controller.enqueue(encoder.encode(c));
        controller.close();
      },
    }),
    { status: 200, headers: { "Content-Type": "text/event-stream" } },
  );
}

const DATA = (o: unknown) => `data: ${JSON.stringify(o)}\n\n`;

describe("AiDuanke SSR 流式断课", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("点击快捷问题后流式累积正文与思考过程", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        sseResponse([
          DATA({ choices: [{ delta: { reasoning_content: "思" } }] }),
          DATA({ choices: [{ delta: { reasoning_content: "考", content: "第一" } }] }),
          DATA({ choices: [{ delta: { content: "第二" } }] }),
          "data: [DONE]\n\n",
        ]),
      );
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    render(<AiDuanke result={result} />);
    fireEvent.click(screen.getByText("综合运势"));

    await waitFor(() => expect(screen.getByText(/第一第二/)).toBeInTheDocument());
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/divine",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("上游错误时展示错误信息", async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ error: "AI 上游错误 401" }), { status: 502 }),
      ) as unknown as typeof fetch;

    render(<AiDuanke result={result} />);
    fireEvent.click(screen.getByText("综合运势"));

    await waitFor(() => expect(screen.getByText(/AI 上游错误 401/)).toBeInTheDocument());
  });
});
