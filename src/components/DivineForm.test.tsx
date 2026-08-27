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

const adapters = [daliuren, xiaoliuren];

function renderForm(overrides: Record<string, unknown> = {}) {
  const onDivine = vi.fn().mockResolvedValue(undefined);
  const utils = render(
    <DivineForm
      adapters={adapters}
      selectedId="daliuren"
      onSelect={vi.fn()}
      onDivine={onDivine}
      services={[]}
      onServicesChange={vi.fn()}
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

  it("非大六壬模式切换为 JSON 输入框", () => {
    renderForm({ selectedId: "xiaoliuren" });
    expect(screen.getByText("输入参数（JSON）")).toBeInTheDocument();
    expect(screen.queryByText("日干")).not.toBeInTheDocument();
  });

  it("JSON 输入非对象（数组）时报错且不触发起课", async () => {
    const { onDivine } = renderForm({ selectedId: "xiaoliuren" });
    const textarea = screen.getByPlaceholderText(/month/);
    fireEvent.change(textarea, { target: { value: "[1,2,3]" } });
    fireEvent.click(screen.getByText("起课"));
    await waitFor(() => expect(screen.getByText(/JSON 输入必须是对象/)).toBeInTheDocument());
    expect(onDivine).not.toHaveBeenCalled();
  });

  it("JSON 输入合法对象时以解析结果起课", async () => {
    const { onDivine } = renderForm({ selectedId: "xiaoliuren" });
    const textarea = screen.getByPlaceholderText(/month/);
    fireEvent.change(textarea, { target: { value: '{"month": 3, "day": 18}' } });
    fireEvent.click(screen.getByText("起课"));
    await waitFor(() => expect(onDivine).toHaveBeenCalled());
    expect(onDivine).toHaveBeenCalledWith({ month: 3, day: 18 });
  });
});
