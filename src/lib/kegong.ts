// 四课排法 + 上下生克
import { DIZHI_WUXING, GAN_JIGONG, ke } from './data'

export type Sike = [string, string][]
export type KeRelation = '上克下' | '下克上' | '无克'

export function buildSike(
  rigan: string,
  rizhi: string,
  tianpan: Record<string, string>,
): Sike {
  const jigong = GAN_JIGONG[rigan]
  const k1Bottom = jigong
  const k1Top = tianpan[jigong]
  const k2Bottom = k1Top
  const k2Top = tianpan[k1Top]
  const k3Bottom = rizhi
  const k3Top = tianpan[rizhi]
  const k4Bottom = k3Top
  const k4Top = tianpan[k3Top]
  return [
    [k1Bottom, k1Top],
    [k2Bottom, k2Top],
    [k3Bottom, k3Top],
    [k4Bottom, k4Top],
  ]
}

export function keRelation(bottom: string, top: string): KeRelation {
  const bw = DIZHI_WUXING[bottom]
  const tw = DIZHI_WUXING[top]
  if (ke(tw, bw)) return '上克下'
  if (ke(bw, tw)) return '下克上'
  return '无克'
}

export function sikeRelations(sike: Sike): KeRelation[] {
  return sike.map(([b, t]) => keRelation(b, t))
}

export function kePositions(sike: Sike): number[] {
  return sike
    .map(([b, t], i) => (keRelation(b, t) !== '无克' ? i : -1))
    .filter((i) => i >= 0)
}
