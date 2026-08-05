// 天地盘：月将加占时，顺排十二支
import { DIZHI, DIZHI_CHONG } from './data'

export function buildTianpan(yuejiang: string, shizhi: string): Record<string, string> {
  const start = DIZHI.indexOf(shizhi)
  const yj = DIZHI.indexOf(yuejiang)
  const tp: Record<string, string> = {}
  for (let i = 0; i < 12; i++) {
    tp[DIZHI[(start + i) % 12]] = DIZHI[(yj + i) % 12]
  }
  return tp
}

export function shangshen(tianpan: Record<string, string>, dizhi: string): string {
  return tianpan[dizhi]
}

// 伏吟：天地盘全同
export function isFuyin(tianpan: Record<string, string>): boolean {
  return DIZHI.every((d) => tianpan[d] === d)
}

// 返吟：天地盘对冲
export function isFanyin(tianpan: Record<string, string>): boolean {
  return DIZHI.every((d) => tianpan[d] === DIZHI_CHONG[d])
}
