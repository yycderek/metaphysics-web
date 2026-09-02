// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import AgentResultCard from "./AgentResultCard";
import type { AgentDivination } from "@/lib/agent/types";

const interp: AgentDivination = {
  卦象: "重审课（巳→戌→卯）",
  算法: "大六壬",
  结论: { 总断: "先难后易", 现状: "事业有波折但可成", 建议: "宜稳不宜急" },
  逐步: [{ 步骤: "排四课", 解读: "有克取比用" }],
  置信度: "中",
  依据: { 三传: ["巳", "戌", "卯"] },
};

describe("AgentResultCard", () => {
  it("渲染出处/依据/结论", () => {
    render(<AgentResultCard divination={undefined} interpretation={interp} />);
    expect(screen.getByText("先难后易")).toBeInTheDocument();
    expect(screen.getByText("事业有波折但可成")).toBeInTheDocument();
    expect(screen.getByText("宜稳不宜急")).toBeInTheDocument();
    expect(screen.getByText(/重审课/)).toBeInTheDocument();
    expect(screen.getByText(/三传/)).toBeInTheDocument();
  });

  it("无课盘时提示未返回课式", () => {
    render(<AgentResultCard divination={undefined} interpretation={interp} />);
    expect(screen.getByText(/未返回课式/)).toBeInTheDocument();
  });
});
