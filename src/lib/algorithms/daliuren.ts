// 大六壬适配器：包一层现有 TS 引擎（与 build() 同源，零行为改动）
// 额外价值：把完整流水线拆成 6 个可观察步骤，供推导模式渲染
import { buildTianpan } from '../pan'
import { buildSike, keRelation } from '../kegong'
import { determineSanchuan } from '../sanchuan'
import { buildTianjiang } from '../tianjiang'
import { chuanTianjiang } from '../shike'
import { DIZHI, DIZHI_WUXING, GAN_JIGONG, TIANGAN_WUXING, liuqin, xunkong } from '../data'
import type { KeShi } from '../types'
import type { AlgorithmAdapter, AlgorithmInput, DivinationResult, StepResult } from './types'

export const DALIUREN_ID = 'daliuren'

function buildSteps(params: {
  rizhu: string
  rigan: string
  rizhi: string
  shizhi: string
  yuejiang: string
  tianpan: Record<string, string>
  sike: [string, string][]
  kename: string
  method: string
  chuan: string[]
  tianjiang: Record<string, string>
  guiren: string
  mode: '阳贵' | '阴贵'
  ks: KeShi
}): StepResult[] {
  const { rizhu, rigan, rizhi, shizhi, yuejiang, tianpan, sike, kename, method, chuan, tianjiang, guiren, mode, ks } = params
  const sikeEntries = sike.map(([bottom, top], i) => ({
    index: i + 1,
    bottom,
    top,
    relation: keRelation(bottom, top),
  }))
  return [
    {
      key: 'di',
      title: '一、定地盘',
      desc: '地盘十二支固定排布：子北午南，顺时针环列。这是整个课式的底座。',
      data: { dizhi: DIZHI },
    },
    {
      key: 'tian',
      title: '二、安天盘',
      desc: `月将加占时：把${yuejiang}将放在${shizhi}时支的位置上，其余十一支顺时针环排，天盘即成。`,
      data: { tianpan, yuejiang, shizhi },
    },
    {
      key: 'sike',
      title: '三、排四课',
      desc: `以日干${rigan}寄宫${GAN_JIGONG[rigan]}与日支${rizhi}为下神，逐课取天盘上神；第二课以下一课的上神为下神。`,
      data: { sike: sikeEntries },
    },
    {
      key: 'jiuzongmen',
      title: '四、九宗门定三传',
      desc: '检查四课上下生克：有克走贼克/比用/涉害，无克走遥克/昴星/别责/八专，天地盘全同或对冲则走伏吟/返吟。',
      data: { method, kename },
    },
    {
      key: 'sanchuan',
      title: '五、得三传',
      desc: '三传是课的灵魂：初传主事始，中传主事中，末传主事终。',
      data: { chuan },
    },
    {
      key: 'tianjiang',
      title: '六、布天将·断六亲',
      desc: `按日干${rigan}贵人诀起贵人（${guiren}·${mode}），昼夜分顺逆排十二天将；三传五行比照日干定六亲，吉凶昭然。`,
      data: { tianjiang, guiren, mode, chuanDetail: chuanTianjiang(ks), xunkong: ks.xunkong },
    },
  ]
}

export const daliurenAdapter: AlgorithmAdapter = {
  id: DALIUREN_ID,
  name: '大六壬',
  description: '大六壬起课：天地盘、四课、三传（九宗门）、天将六亲。输入日柱/时支/月将。',

  parseInput(input: AlgorithmInput) {
    const rizhu = String(input.rizhu ?? '').trim()
    const shizhi = String(input.shizhi ?? '').trim()
    const yuejiang = String(input.yuejiang ?? '').trim()
    if (rizhu.length !== 2 || !shizhi || !yuejiang) return null
    return { rizhu, shizhi, yuejiang }
  },

  build(input: AlgorithmInput): DivinationResult {
    const parsed = this.parseInput!(input)
    if (!parsed) {
      throw new Error('大六壬输入不合法：需要 rizhu(日柱，如"庚子") / shizhi(时支，如"午") / yuejiang(月将，如"亥")')
    }
    const rizhu = String(parsed.rizhu ?? '')
    const shizhi = String(parsed.shizhi ?? '')
    const yuejiang = String(parsed.yuejiang ?? '')
    const rigan = rizhu[0]
    const rizhi = rizhu[1]
    // 与 shike.build() 完全同源的调用序列（改动任何一步都会在黄金课例测试中暴露）
    const tianpan = buildTianpan(yuejiang, shizhi)
    const sike = buildSike(rigan, rizhi, tianpan)
    const { kename, chuan, method } = determineSanchuan(rigan, rizhi, tianpan, sike)
    const { tianjiang, guiren, mode } = buildTianjiang(rigan, shizhi, tianpan)
    const kong = xunkong(rigan, rizhi)

    const ks: KeShi = {
      rizhu, rigan, rizhi, shizhi, yuejiang,
      tianpan, sike, kename, sanchuan: chuan, method,
      tianjiang, guiren, guirenMode: mode, xunkong: kong,
    }

    const steps = buildSteps({
      rizhu, rigan, rizhi, shizhi, yuejiang,
      tianpan, sike, kename, method, chuan, tianjiang, guiren, mode, ks,
    })

    return { algorithmId: this.id, algorithmName: this.name, input: parsed, steps, raw: ks }
  },
}

// 供注册表与测试引用
export function rawKeShi(result: DivinationResult): KeShi {
  return result.raw as KeShi
}

// 便捷：适配器结果 → 断课上下文所需字段（AI 断课仍吃 KeShi，阶段2保持兼容）
export function liuqinOf(chuan: string[], rigan: string): string[] {
  const rx = TIANGAN_WUXING[rigan]
  return chuan.map((zhi) => liuqin(rx, DIZHI_WUXING[zhi]))
}
