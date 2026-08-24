// 算法注册表：平台访问算法的唯一入口
// 阶段2：内置大六壬；阶段4：用户插件（本地文件/远程服务）注册到这里
import type { AlgorithmAdapter, AlgorithmInput, DivinationResult } from './types'
import { daliurenAdapter } from './daliuren'

const registry = new Map<string, AlgorithmAdapter>()

export function registerAdapter(adapter: AlgorithmAdapter): void {
  if (!adapter?.id) throw new Error('适配器缺少 id')
  registry.set(adapter.id, adapter)
}

export function getAdapter(id: string): AlgorithmAdapter | undefined {
  return registry.get(id)
}

export function listAdapters(): AlgorithmAdapter[] {
  return [...registry.values()]
}

/** 统一入口：按 id 起课 */
export function buildDivination(id: string, input: AlgorithmInput): DivinationResult {
  const adapter = getAdapter(id)
  if (!adapter) throw new Error(`未知算法: ${id}（可用: ${listAdapters().map((a) => a.id).join(', ')}）`)
  return adapter.build(input)
}

// 内置算法注册（模块加载即注册，未来插件在 plugins/ 动态 import 后同样调用 registerAdapter）
registerAdapter(daliurenAdapter)
