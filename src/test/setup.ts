// Vitest 全局设置：注入 jest-dom 匹配器 + 每个用例后清理 DOM（未启用 vitest globals）
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(() => cleanup());

// jsdom 缺失的浏览器 API（部分组件用到）
if (typeof Element !== "undefined") {
  if (!Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = () => {};
  }
}
