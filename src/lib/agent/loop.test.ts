// Agent 循环测试：工具调用→引擎起课→结构化输出，用 mock 的 callLLM（真实引擎起课）
import { describe, it, expect } from "vitest";
import { runAgentLoop, tryParseStructured, type CallLLM } from "./loop";
import type { ToolCall } from "@/lib/aiTypes";

function toolCall(id: string, args: object): ToolCall {
  return { id, type: "function", function: { name: "divinate", arguments: JSON.stringify(args) } };
}

const VALID_JSON = JSON.stringify({
  卦象: "重审课（巳→戌→卯）",
  算法: "大六壬",
  吉凶: "中",
  结论: {
    总断: "此课初传官鬼空亡，起步多阻。",
    现状: "事业谋事反复，宜缓不宜急。",
    建议: "谋事宜缓，静待时机。",
    风险: "防口舌文书反复",
  },
  逐步: [
    { 步骤: "排四课", 解读: "第X课有克，取贼克为用。" },
    { 步骤: "得三传", 解读: "初传巳官鬼空亡，中传戌父母，末传卯妻财。" },
  ],
  置信度: "中",
  出处: "《六壬粹言》",
});

describe("runAgentLoop", () => {
  it("模型调用 divinate → 引擎起课 → 输出结构化 JSON（含卦象/结论/逐步）", async () => {
    const calls: number[] = [];
    const callLLM: CallLLM = async (messages) => {
      calls.push(messages.length);
      if (calls.length === 1) {
        return {
          content: "",
          tool_calls: [
            toolCall("call_1", {
              algorithm: "daliuren",
              params: { rizhu: "庚子", shizhi: "午", yuejiang: "亥" },
            }),
          ],
        };
      }
      return { content: VALID_JSON };
    };

    const res = await runAgentLoop({
      system: "sys",
      question: "看看我最近事业",
      callLLM,
      now: new Date(2026, 7, 26, 12),
    });

    expect(res.ok).toBe(true);
    expect(res.result?.卦象).toBe("重审课（巳→戌→卯）");
    expect(res.result?.结论.建议).toBe("谋事宜缓，静待时机。");
    expect(res.result?.逐步).toHaveLength(2);
    // 引擎真实起课（黄金课例 → 重审课，巳戌卯）供前端可视化
    expect(res.meta?.summary).toContain("重审课");
    expect(res.meta?.divination.algorithmId).toBe("daliuren");
    expect((res.meta?.divination.raw as { kename?: string })?.kename).toBe("重审课");
    expect(calls.length).toBe(2);
    const toolMsg = res.trace.find((m) => m.role === "tool");
    expect(toolMsg?.content).toContain("重审课");
  });

  it("多轮 history 被注入且不重复追加本轮问题两次", async () => {
    const callLLM: CallLLM = async (_messages) => {
      // 首轮应包含 history(user/assistant) + 本轮 user，总数由循环控制
      return { content: VALID_JSON };
    };
    const res = await runAgentLoop({
      system: "sys",
      question: "换个时辰",
      history: [
        { role: "user", content: "看看事业" },
        { role: "assistant", content: VALID_JSON },
      ],
      callLLM,
    });
    expect(res.ok).toBe(true);
  });

  it("非法 JSON 输出最终返回错误", async () => {
    const callLLM: CallLLM = async () => ({ content: "这不是 JSON" });
    const res = await runAgentLoop({
      system: "sys",
      question: "测试",
      callLLM,
      maxIters: 3,
    });
    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/不是合法 JSON/);
  });

  it("模型直接输出合法 JSON 且未调用工具也能通过（宽容，剥离代码块）", async () => {
    const callLLM: CallLLM = async () => ({ content: "```json\n" + VALID_JSON + "\n```" });
    const res = await runAgentLoop({ system: "sys", question: "测试", callLLM });
    expect(res.ok).toBe(true);
    expect(res.result?.结论.总断).toBe("此课初传官鬼空亡，起步多阻。");
  });
});

describe("tryParseStructured", () => {
  it("剥离 markdown 代码块后正确解析", () => {
    expect(tryParseStructured("```json\n" + VALID_JSON + "\n```")?.置信度).toBe("中");
  });

  it("拒绝缺字段 / 非法置信度", () => {
    expect(
      tryParseStructured(
        '{"卦象":"x","算法":"y","结论":{"总断":"a","现状":"b","建议":"c"},"逐步":[],"置信度":"高"}',
      ),
    ).toEqual(expect.objectContaining({ 卦象: "x" }));
    expect(
      tryParseStructured(
        '{"卦象":"x","算法":"y","结论":{"总断":"a","现状":"b","建议":"c"},"逐步":[],"置信度":"??"}',
      ),
    ).toBeNull();
    expect(
      tryParseStructured(
        '{"卦象":"x","算法":"y","结论":{"总断":"a","建议":"c"},"逐步":[],"置信度":"高"}',
      ),
    ).toBeNull(); // 缺现状
  });

  it("拒绝纯文本", () => {
    expect(tryParseStructured("这段占卜结果是……")).toBeNull();
  });
});
