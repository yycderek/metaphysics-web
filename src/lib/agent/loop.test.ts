// Agent 循环测试：工具调用→引擎起课→自校验→结构化输出 + 澄清 + 多轮，用 mock 的 callLLM
import { describe, it, expect } from "vitest";
import { runAgentLoop, tryParseStructured, type CallLLM } from "./loop";
import type { ToolCall } from "@/lib/aiTypes";

function toolCall(id: string, name: string, args: object): ToolCall {
  return { id, type: "function", function: { name, arguments: JSON.stringify(args) } };
}

// 黄金课例正确依据（三传 巳→戌→卯，勾/武/朱，官鬼/父母/妻财）
const CORRECT = {
  三传: ["巳", "戌", "卯"],
  天将: ["勾陈", "玄武", "朱雀"],
  六亲: ["官鬼", "父母", "妻财"],
};

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
  依据: CORRECT,
  置信度: "中",
  出处: "《六壬粹言》",
});

describe("runAgentLoop", () => {
  it("模型调用 divinate → 引擎起课 → 自校验通过 → 输出结构化 JSON", async () => {
    const callLLM: CallLLM = async (messages) => {
      if (messages.some((m) => m.role === "tool")) {
        return { content: VALID_JSON }; // 已有工具结果，输出断语
      }
      return {
        content: "",
        tool_calls: [
          toolCall("call_1", "divinate", {
            algorithm: "daliuren",
            params: { rizhu: "庚子", shizhi: "午", yuejiang: "亥" },
          }),
        ],
      };
    };

    const res = await runAgentLoop({
      system: "sys",
      question: "看看我最近事业",
      callLLM,
      now: new Date(2026, 7, 26, 12),
    });

    expect(res.ok).toBe(true);
    expect(res.kind).toBe("answer");
    expect(res.result?.卦象).toBe("重审课（巳→戌→卯）");
    expect(res.result?.依据?.三传).toEqual(["巳", "戌", "卯"]);
    expect(res.meta?.summary).toContain("重审课");
    expect(res.meta?.divination.algorithmId).toBe("daliuren");
    const toolMsg = res.trace.find((m) => m.role === "tool");
    expect(toolMsg?.content).toContain("重审课");
  });

  it("澄清：信息不足时模型调用 ask_clarification → 返回 kind=clarify", async () => {
    const callLLM: CallLLM = async () => ({
      content: "",
      tool_calls: [
        toolCall("call_1", "ask_clarification", { question: "你想看的是求职还是晋升机会？" }),
      ],
    });
    const res = await runAgentLoop({ system: "sys", question: "帮我看看事业", callLLM });
    expect(res.ok).toBe(true);
    expect(res.kind).toBe("clarify");
    expect(res.question).toContain("求职");
  });

  it("自校验不通过 → 追加纠正后重试成功", async () => {
    let n = 0;
    const callLLM: CallLLM = async (messages) => {
      if (messages.some((m) => m.role === "tool")) {
        n += 1;
        const wrong = JSON.stringify({
          ...JSON.parse(VALID_JSON),
          依据: { ...CORRECT, 三传: ["午", "卯", "巳"] },
        });
        // 第一次给错的三传，第二次改正
        return { content: n === 1 ? wrong : VALID_JSON };
      }
      return {
        content: "",
        tool_calls: [
          toolCall("call_1", "divinate", {
            algorithm: "daliuren",
            params: { rizhu: "庚子", shizhi: "午", yuejiang: "亥" },
          }),
        ],
      };
    };
    const res = await runAgentLoop({
      system: "sys",
      question: "看看事业",
      callLLM,
      now: new Date(2026, 7, 26, 12),
    });
    expect(res.ok).toBe(true);
    expect(res.result?.依据?.三传).toEqual(["巳", "戌", "卯"]);
  });

  it("非法 JSON 输出最终返回错误", async () => {
    const callLLM: CallLLM = async () => ({ content: "这不是 JSON" });
    const res = await runAgentLoop({ system: "sys", question: "测试", callLLM, maxIters: 3 });
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

describe("runAgentLoop 事件上报", () => {
  it("onEvent 收到 status 与 divination 里程碑", async () => {
    const events: Array<{ type: string; text?: string; summary?: string }> = [];
    const callLLM: CallLLM = async (messages) => {
      if (messages.some((m) => m.role === "tool")) return { content: VALID_JSON };
      return {
        content: "",
        tool_calls: [
          toolCall("call_1", "divinate", {
            algorithm: "daliuren",
            params: { rizhu: "庚子", shizhi: "午", yuejiang: "亥" },
          }),
        ],
      };
    };
    const res = await runAgentLoop({
      system: "sys",
      question: "看看事业",
      callLLM,
      onEvent: (e) => events.push(e),
      now: new Date(2026, 7, 26, 12),
    });
    expect(res.ok).toBe(true);
    const divinationEvents = events.filter((e) => e.type === "divination");
    expect(divinationEvents.length).toBeGreaterThan(0);
    expect(divinationEvents[0].summary).toContain("重审课");
    expect(events.some((e) => e.type === "status")).toBe(true);
  });
});

describe("tryParseStructured", () => {
  it("剥离 markdown 代码块后正确解析（含依据）", () => {
    expect(tryParseStructured("```json\n" + VALID_JSON + "\n```")?.依据?.六亲).toEqual([
      "官鬼",
      "父母",
      "妻财",
    ]);
  });

  it("拒绝缺字段 / 非法置信度", () => {
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
