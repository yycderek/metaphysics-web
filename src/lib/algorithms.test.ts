// 阶段2：算法适配器测试
// 核心断言：daliuren 适配器输出与 shike.build()（黄金课例锚点）完全一致，且步骤化结构正确
import { describe, expect, it } from 'vitest'
import { build } from './shike'
import { daliurenAdapter, rawKeShi, DALIUREN_ID } from './algorithms/daliuren'
import { getAdapter, listAdapters, buildDivination, registerAdapter } from './algorithms/registry'
import type { AlgorithmAdapter } from './algorithms/types'
import { resolveStepView } from './algorithms/stepViews'

const GOLDEN_INPUT = { rizhu: '庚子', shizhi: '午', yuejiang: '亥' }

describe('算法注册表', () => {
  it('内置大六壬已注册', () => {
    expect(getAdapter(DALIUREN_ID)).toBeDefined()
    expect(listAdapters().map((a) => a.id)).toContain(DALIUREN_ID)
  })

  it('未知算法抛出明确错误', () => {
    expect(() => buildDivination('not-exist', {})).toThrow(/未知算法/)
  })

  it('支持运行时注册新算法（插件入口契约）', () => {
    const fake: AlgorithmAdapter = {
      id: 'test-plugin',
      name: '测试算法',
      description: '用于验证注册表可扩展',
      build: (input) => ({
        algorithmId: 'test-plugin',
        algorithmName: '测试算法',
        input,
        steps: [],
        raw: { ok: true },
      }),
    }
    registerAdapter(fake)
    expect(getAdapter('test-plugin')).toBe(fake)
    const r = buildDivination('test-plugin', { x: 1 })
    expect(r.algorithmId).toBe('test-plugin')
    expect(r.raw).toEqual({ ok: true })
  })
})

describe('大六壬适配器', () => {
  it('parseInput：合法输入通过，非法返回 null', () => {
    expect(daliurenAdapter.parseInput?.(GOLDEN_INPUT)).toEqual(GOLDEN_INPUT)
    expect(daliurenAdapter.parseInput?.({ rizhu: '庚', shizhi: '午', yuejiang: '亥' })).toBeNull()
    expect(daliurenAdapter.parseInput?.({ rizhu: '庚子', shizhi: '', yuejiang: '亥' })).toBeNull()
    expect(daliurenAdapter.parseInput?.({})).toBeNull()
  })

  it('黄金课例：适配器 raw 与 shike.build() 完全一致', () => {
    const result = daliurenAdapter.build(GOLDEN_INPUT)
    const ks = rawKeShi(result)
    const ref = build('庚子', '午', '亥')
    expect(ks).toEqual(ref) // 全字段深度一致（天地盘/四课/课名/三传/天将/贵人/旬空）
  })

  it('黄金课例关键锚点：重审课 巳戌卯 勾陈玄武朱雀 官鬼父母妻财', () => {
    const result = daliurenAdapter.build(GOLDEN_INPUT)
    const ks = rawKeShi(result)
    expect(ks.kename).toBe('重审课')
    expect(ks.sanchuan).toEqual(['巳', '戌', '卯'])
    expect([ks.tianjiang['巳'], ks.tianjiang['戌'], ks.tianjiang['卯']]).toEqual(['勾', '武', '朱'])
    expect(ks.guiren).toBe('丑')
    expect(ks.guirenMode).toBe('阳贵')
    expect(ks.xunkong).toEqual(['辰', '巳'])
  })

  it('推导过程：6 个步骤，标题与顺序符合大六壬教学', () => {
    const result = daliurenAdapter.build(GOLDEN_INPUT)
    expect(result.steps.map((s) => s.key)).toEqual(['di', 'tian', 'sike', 'jiuzongmen', 'sanchuan', 'tianjiang'])
    expect(result.steps.map((s) => s.title)).toEqual([
      '一、定地盘',
      '二、安天盘',
      '三、排四课',
      '四、九宗门定三传',
      '五、得三传',
      '六、布天将·断六亲',
    ])
    // 每步都有说明和中间数据
    for (const s of result.steps) {
      expect(s.desc.length).toBeGreaterThan(10)
      expect(s.data).toBeDefined()
    }
  })

  it('步骤数据可支撑推导展示', () => {
    const result = daliurenAdapter.build(GOLDEN_INPUT)
    const tian = result.steps[1].data as { tianpan: Record<string, string> }
    expect(tian.tianpan['午']).toBe('亥') // 亥将加午时
    const sike = result.steps[2].data as { sike: { index: number; bottom: string; top: string; relation: string }[] }
    expect(sike.sike).toHaveLength(4)
    expect(sike.sike[0]).toEqual({ index: 1, bottom: '申', top: '丑', relation: '无克' })
    // 黄金课例唯一有克处：第三课 子(水) 巳(火)，水克火 → 下克上 → 重审课
    expect(sike.sike[2]).toEqual({ index: 3, bottom: '子', top: '巳', relation: '下克上' })
    const last = result.steps[5].data as { chuanDetail: { name: string; zhi: string; liuqin: string }[] }
    expect(last.chuanDetail.map((c) => c.liuqin)).toEqual(['官鬼', '父母', '妻财'])
  })

  it('非法输入抛出明确错误', () => {
    expect(() => daliurenAdapter.build({})).toThrow(/输入不合法/)
  })
})

describe('步骤视图分发（阶段3）', () => {
  it('大六壬已知步骤 → 专属视图', () => {
    for (const key of ['di', 'tian', 'sike', 'jiuzongmen', 'sanchuan', 'tianjiang']) {
      expect(resolveStepView('daliuren', key)).toBe('daliuren')
    }
  })
  it('未知步骤 / 其他算法 → 通用视图兜底', () => {
    expect(resolveStepView('daliuren', 'whatever')).toBe('generic')
    expect(resolveStepView('xiaoliuren', 'di')).toBe('generic')
    expect(resolveStepView('custom', 'step1')).toBe('generic')
  })
})
