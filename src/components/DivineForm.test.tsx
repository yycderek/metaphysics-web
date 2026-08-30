// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import DivineForm from "@/components/DivineForm";
import type { AlgorithmAdapter } from "@/lib/algorithms/types";

const dummyBuild = () => ({
  algorithmId: "daliuren",
  algorithmName: "大六壬",
  input: {},
  steps: [] as never[],
  raw: {},
});

const daliuren: AlgorithmAdapter = {
  id: "daliuren",
  name: "大六壬",
  description: "",
  parseInput: (i) => i,
  build: dummyBuild,
};
const xiaoliuren: AlgorithmAdapter = {
  id: "xiaoliuren",
  name: "小六壬",
  description: "",
  build: dummyBuild,
};
const remote: AlgorithmAdapter = {
  id: "remote",
  name: "远程",
  description: "",
  build: dummyBuild,
};

const adapters = [daliuren, xiaoliuren, remote];

function renderForm(overrides: Record<string, unknown> = {}) {
  const onDivine = vi.fn().mockResolvedValue(undefined);
  const utils = render(
    <DivineForm
      adapters={adapters}
      selectedId="daliuren"
      onSelect={vi.fn()}
      onDivine={onDivine}
      {...overrides}
    />,
  );
  return { onDivine, ...utils };
}

describe("DivineForm 输入/校验", () => {
  it("大六壬模式渲染日干/日支/时支/月将下拉，无 JSON 输入框", () => {
    renderForm();
    expect(screen.getByText("日干")).toBeInTheDocument();
    expect(screen.getByText("时支")).toBeInTheDocument();
    expect(screen.getByText("月将")).toBeInTheDocument();
    expect(screen.queryByText("输入参数（JSON）")).not.toBeInTheDocument();
  });

  it("小六壬模式显示 月/日/时 数字输入（非 JSON）", () => {
    renderForm({ selectedId: "xiaoliuren" });
    expect(screen.getByText("月")).toBeInTheDocument();
    expect(screen.getAllByRole("spinbutton").length).toBeGreaterThanOrEqual(3);
    expect(screen.queryByText("输入参数（JSON）")).not.toBeInTheDocument();
  });

  it("六爻模式提供随机摇卦按钮", () => {
    renderForm({ selectedId: "liuyao" });
    expect(screen.getByText(/随机摇卦/)).toBeInTheDocument();
  });

  it("梅花易数显示两个报数输入", () => {
    renderForm({ selectedId: "meihua" });
    expect(screen.getByText("报数一")).toBeInTheDocument();
    expect(screen.getByText("报数二")).toBeInTheDocument();
  });

  it("远程/自定义算法显示 JSON 输入框", () => {
    renderForm({ selectedId: "remote" });
    expect(screen.getByText("输入参数（JSON）")).toBeInTheDocument();
    expect(screen.queryByText("日干")).not.toBeInTheDocument();
  });

  it("远程 JSON 输入非对象（数组）时报错且不触发起课", async () => {
    const { onDivine } = renderForm({ selectedId: "remote" });
    const textarea = screen.getByPlaceholderText(/key/);
    fireEvent.change(textarea, { target: { value: "[1,2,3]" } });
    fireEvent.click(screen.getByText("起课"));
    await waitFor(() => expect(screen.getByText(/JSON 输入必须是对象/)).toBeInTheDocument());
    expect(onDivine).not.toHaveBeenCalled();
  });

  it("远程 JSON 输入合法对象时以解析结果起课", async () => {
    const { onDivine } = renderForm({ selectedId: "remote" });
    const textarea = screen.getByPlaceholderText(/key/);
    fireEvent.change(textarea, { target: { value: '{"month": 3}' } });
    fireEvent.click(screen.getByText("起课"));
    await waitFor(() => expect(onDivine).toHaveBeenCalled());
    expect(onDivine).toHaveBeenCalledWith({ month: 3 });
  });
});
