// 断课模板注册表：algorithmId → DivineTemplate
import type { DivineTemplate } from "./types";

const registry = new Map<string, DivineTemplate>();

export function registerDivineTemplate(t: DivineTemplate): void {
  registry.set(t.id, t);
}

export function getDivineTemplate(id: string): DivineTemplate | undefined {
  return registry.get(id);
}

/** 已注册的模板 id 列表（调试/测试用） */
export function listDivineTemplateIds(): string[] {
  return [...registry.keys()];
}
