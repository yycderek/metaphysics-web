// 步骤视图分发（纯逻辑，供 StepRenderer 与测试使用）
// 有专属图形演示的：大六壬 / 六爻 / 梅花；其余回退通用 DataView（友好卡片，非 JSON）。

export type StepViewKind = "daliuren" | "liuyao" | "meihua" | "generic";

export const DALIUREN_STEP_KEYS = new Set([
  "di",
  "tian",
  "sike",
  "jiuzongmen",
  "sanchuan",
  "tianjiang",
]);
export const LIUYAO_STEP_KEYS = new Set(["qi", "ding", "najia", "shiying", "liushen"]);
export const MEIHUA_STEP_KEYS = new Set(["guashu", "dong", "tiyong", "ben", "hu", "bian"]);

/** 解析某算法某步骤用哪种视图渲染 */
export function resolveStepView(adapterId: string, key: string): StepViewKind {
  if (adapterId === "daliuren" && DALIUREN_STEP_KEYS.has(key)) return "daliuren";
  if (adapterId === "liuyao" && LIUYAO_STEP_KEYS.has(key)) return "liuyao";
  if (adapterId === "meihua" && MEIHUA_STEP_KEYS.has(key)) return "meihua";
  return "generic";
}
