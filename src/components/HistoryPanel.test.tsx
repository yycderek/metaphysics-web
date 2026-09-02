// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import HistoryPanel from "./HistoryPanel";
import type { HistoryEntry } from "@/lib/history";

const entry: HistoryEntry = {
  id: "1",
  question: "看看事业",
  卦象: "重审课",
  interpretation: {
    卦象: "重审课",
    算法: "大六壬",
    结论: { 总断: "先难后易", 现状: "x", 建议: "y" },
    逐步: [],
    置信度: "中",
  },
  ts: 1,
};

beforeEach(() => {
  const store = new Map<string, string>();
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => store.set(k, String(v)),
      removeItem: (k: string) => store.delete(k),
      clear: () => store.clear(),
    },
  });
  store.set("metaphysics-history", JSON.stringify([entry]));
});

describe("HistoryPanel", () => {
  it("展开后列出历史并显示摘要", () => {
    render(<HistoryPanel />);
    fireEvent.click(screen.getByText(/历史回看/));
    expect(screen.getByText(/看看事业/)).toBeInTheDocument();
    expect(screen.getByText("先难后易")).toBeInTheDocument();
  });
});
