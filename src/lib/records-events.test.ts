// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from "vitest";
import { saveHistory, RECORDS_CHANGED_EVENT } from "./history";
import { saveChangyan } from "./changyan";

beforeEach(() => {
  localStorage.clear();
});

describe("meta:records-changed 事件", () => {
  it("saveHistory 写入后派发事件", () => {
    const spy = vi.fn();
    window.addEventListener(RECORDS_CHANGED_EVENT, spy);
    saveHistory([]);
    window.removeEventListener(RECORDS_CHANGED_EVENT, spy);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("saveChangyan 写入后派发事件", () => {
    const spy = vi.fn();
    window.addEventListener(RECORDS_CHANGED_EVENT, spy);
    saveChangyan([]);
    window.removeEventListener(RECORDS_CHANGED_EVENT, spy);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("localStorage 写入失败时仍派发事件", () => {
    const spy = vi.fn();
    window.addEventListener(RECORDS_CHANGED_EVENT, spy);
    vi.spyOn(Storage.prototype, "setItem").mockImplementationOnce(() => {
      throw new Error("quota");
    });
    saveHistory([]);
    window.removeEventListener(RECORDS_CHANGED_EVENT, spy);
    expect(spy).toHaveBeenCalledTimes(1);
  });
});
