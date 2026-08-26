// 课式编排：完整起课流水线
import { DIZHI_WUXING, TIANGAN_WUXING, xunkong } from "./data";
import { buildSike, keRelation } from "./kegong";
import { buildTianpan } from "./pan";
import { determineSanchuan } from "./sanchuan";
import { buildTianjiang, tianjiangInfo } from "./tianjiang";
import type { ChuanDetail, KeShi, SikeEntry, TianjiangDetail } from "./types";
import { liuqin } from "./data";

export function build(rizhu: string, shizhi: string, yuejiang: string): KeShi {
  if (rizhu.length !== 2) throw new Error(`日柱格式错误: ${rizhu}`);
  const rigan = rizhu[0];
  const rizhi = rizhu[1];
  const tianpan = buildTianpan(yuejiang, shizhi);
  const sike = buildSike(rigan, rizhi, tianpan);
  const { kename, chuan, method } = determineSanchuan(rigan, rizhi, tianpan, sike);
  const { tianjiang, guiren, mode } = buildTianjiang(rigan, shizhi, tianpan);
  const kong = xunkong(rigan, rizhi);
  return {
    rizhu,
    rigan,
    rizhi,
    shizhi,
    yuejiang,
    tianpan,
    sike,
    kename,
    sanchuan: chuan,
    method,
    tianjiang,
    guiren,
    guirenMode: mode,
    xunkong: kong,
  };
}

export function sikeEntries(ks: KeShi): SikeEntry[] {
  return ks.sike.map(([bottom, top], i) => {
    const relation = keRelation(bottom, top);
    return { index: i + 1, bottom, top, relation, isKe: relation !== "无克" };
  });
}

export function chuanTianjiang(ks: KeShi): ChuanDetail[] {
  const rx = TIANGAN_WUXING[ks.rigan];
  const names = ["初传", "中传", "末传"] as const;
  return ks.sanchuan.map((zhi, i) => {
    const short = ks.tianjiang[zhi];
    return {
      name: names[i],
      zhi,
      tianjiang: tianjiangInfo(short),
      liuqin: liuqin(rx, DIZHI_WUXING[zhi]),
    };
  });
}

export type { TianjiangDetail };
