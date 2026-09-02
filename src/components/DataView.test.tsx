// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import DataView from "./DataView";

describe("DataView（友好视图，无 JSON）", () => {
  it("名值对显示标签与值", () => {
    render(<DataView data={{ 三传: ["巳", "戌", "卯"] }} />);
    expect(screen.getByText("三传")).toBeInTheDocument();
    expect(screen.getByText("巳、戌、卯")).toBeInTheDocument();
  });

  it("数组对象渲染为小卡（字段名+值）", () => {
    render(<DataView data={{ 爻: [{ 六亲: "子孙", 六神: "青龙" }] }} />);
    expect(screen.getByText("六亲")).toBeInTheDocument();
    expect(screen.getByText("子孙")).toBeInTheDocument();
    expect(screen.getByText("六神")).toBeInTheDocument();
  });

  it("不出现 JSON 花括号", () => {
    const { container } = render(<DataView data={{ a: [{ b: 1 }], 名: "值" }} />);
    expect(container.textContent).not.toContain("{");
  });
});
