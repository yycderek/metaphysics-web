// 步骤视图分发（纯逻辑，供 StepRenderer 与测试使用）
// 规则：大六壬的已知步骤 → 专属视图；其余（未知/其他算法）→ 通用 JSON 树视图

export type StepViewKind = 'daliuren' | 'generic'

export const DALIUREN_STEP_KEYS = new Set([
  'di',
  'tian',
  'sike',
  'jiuzongmen',
  'sanchuan',
  'tianjiang',
])

/** 解析某算法某步骤用哪种视图渲染 */
export function resolveStepView(adapterId: string, key: string): StepViewKind {
  if (adapterId === 'daliuren' && DALIUREN_STEP_KEYS.has(key)) return 'daliuren'
  return 'generic'
}
