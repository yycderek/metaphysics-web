// 九宗门·定三传（核心，翻译自 liuren-py/sanchuan.py）
import {
  DIZHI_CHONG,
  DIZHI_LIUHE_MAP,
  DIZHI_MENGZHONGJI,
  DIZHI_WUXING,
  DIZHI_XING,
  DIZHI_YINYANG,
  GAN_JIGONG,
  TIANGAN_YINYANG,
  TIANGAN_WUXING,
  ke,
} from "./data";
import { Sike, kePositions, keRelation } from "./kegong";
import { isFanyin, isFuyin } from "./pan";

export interface SanchuanResult {
  kename: string;
  chuan: string[]; // [初,中,末]
  method: string;
}

// 驿马：寅午戌马在申，申子辰马在寅，巳酉丑马在亥，亥卯未马在巳
const YIMA: Record<string, string> = {
  寅: "申",
  午: "申",
  戌: "申",
  申: "寅",
  子: "寅",
  辰: "寅",
  巳: "亥",
  酉: "亥",
  丑: "亥",
  亥: "巳",
  卯: "巳",
  未: "巳",
};

const MZJ_ORDER: Record<string, number> = { 孟: 0, 仲: 1, 季: 2 };

export function chainChuan(chuchuan: string, tianpan: Record<string, string>): string[] {
  const chuan = [chuchuan];
  let cur = chuchuan;
  for (let i = 0; i < 2; i++) {
    cur = tianpan[cur];
    chuan.push(cur);
  }
  return chuan;
}

// 贼克法
function zeke(
  rigan: string,
  rizhi: string,
  tianpan: Record<string, string>,
  sike: Sike,
  positions: number[],
): SanchuanResult {
  const [bottom, top] = sike[positions[0]];
  const rel = keRelation(bottom, top);
  const kename = rel === "上克下" ? "元首课" : "重审课";
  return { kename, chuan: chainChuan(top, tianpan), method: "贼克法" };
}

// 涉害深浅
export function shehaiDepth(tianpan: Record<string, string>, bottom: string, top: string): number {
  const bx = DIZHI_WUXING[bottom];
  let count = 0;
  let cur = bottom;
  const seen = new Set<string>();
  while (cur !== top) {
    if (seen.has(cur)) break;
    seen.add(cur);
    const nxt = tianpan[cur];
    if (ke(DIZHI_WUXING[nxt], bx)) count++;
    cur = nxt;
  }
  return count;
}

function shehaiRank(tianpan: Record<string, string>, sike: Sike, positions: number[]): number {
  let bestPos = positions[0];
  let bestScore: [number, number, number] | null = null;
  for (const i of positions) {
    const [bottom, top] = sike[i];
    const depth = shehaiDepth(tianpan, bottom, top);
    const score: [number, number, number] = [depth, MZJ_ORDER[DIZHI_MENGZHONGJI[bottom]], -i];
    if (bestScore === null || score > bestScore) {
      bestScore = score;
      bestPos = i;
    }
  }
  return bestPos;
}

// 比用法
function biyong(
  rigan: string,
  rizhi: string,
  tianpan: Record<string, string>,
  sike: Sike,
  positions: number[],
): SanchuanResult {
  const yang = TIANGAN_YINYANG[rigan] === "阳";
  const cands = positions.filter((i) => {
    const top = sike[i][1];
    return DIZHI_YINYANG[top] === (yang ? "阳" : "阴");
  });
  if (cands.length === 1) {
    const chuchuan = sike[cands[0]][1];
    return { kename: "知一课", chuan: chainChuan(chuchuan, tianpan), method: "比用法" };
  }
  if (cands.length > 1) {
    const pos = shehaiRank(tianpan, sike, cands);
    return { kename: "涉害课", chuan: chainChuan(sike[pos][1], tianpan), method: "涉害法" };
  }
  const pos = shehaiRank(tianpan, sike, positions);
  return { kename: "涉害课", chuan: chainChuan(sike[pos][1], tianpan), method: "涉害法" };
}

// 遥克法
function yaoke(
  rigan: string,
  rizhi: string,
  tianpan: Record<string, string>,
  sike: Sike,
): SanchuanResult | null {
  const rx = TIANGAN_WUXING[rigan];
  for (const [, top] of sike) {
    if (ke(DIZHI_WUXING[top], rx)) {
      return { kename: "弹射课", chuan: chainChuan(top, tianpan), method: "遥克法" };
    }
  }
  for (const [, top] of sike) {
    if (ke(rx, DIZHI_WUXING[top])) {
      return { kename: "芜淫课", chuan: chainChuan(top, tianpan), method: "遥克法" };
    }
  }
  return null;
}

function xingOrChong(zhi: string, seen: Set<string>): string {
  if (DIZHI_XING[zhi]) {
    const nxt = DIZHI_XING[zhi];
    if (!seen.has(nxt)) return nxt;
    return DIZHI_CHONG[zhi];
  }
  return DIZHI_CHONG[zhi];
}

// 伏吟
function fuyin(
  rigan: string,
  rizhi: string,
  _tianpan: Record<string, string>,
  _sike: Sike,
): SanchuanResult {
  const yang = TIANGAN_YINYANG[rigan] === "阳";
  const start = yang ? GAN_JIGONG[rigan] : rizhi;
  const chuan: string[] = [];
  let cur = start;
  const seen = new Set<string>();
  for (let i = 0; i < 3; i++) {
    const nxt = xingOrChong(cur, seen);
    seen.add(nxt);
    chuan.push(nxt);
    cur = nxt;
  }
  return { kename: "伏吟课", chuan, method: "伏吟法" };
}

// 返吟
function fanyin(
  rigan: string,
  rizhi: string,
  tianpan: Record<string, string>,
  sike: Sike,
): SanchuanResult {
  const positions = kePositions(sike);
  const chuchuan = positions.length > 0 ? sike[positions[0]][1] : YIMA[rizhi];
  return { kename: "返吟课", chuan: chainChuan(chuchuan, tianpan), method: "返吟法" };
}

// 别责
function bieze(
  rigan: string,
  rizhi: string,
  tianpan: Record<string, string>,
  _sike: Sike,
): SanchuanResult {
  const jigong = GAN_JIGONG[rigan];
  const he = DIZHI_LIUHE_MAP[jigong];
  const chuchuan = tianpan[he];
  return { kename: "别责课", chuan: [chuchuan, chuchuan, chuchuan], method: "别责法" };
}

// 八专
function bazhuan(
  rigan: string,
  rizhi: string,
  tianpan: Record<string, string>,
  _sike: Sike,
): SanchuanResult {
  const yang = TIANGAN_YINYANG[rigan] === "阳";
  const chuchuan = yang ? tianpan[GAN_JIGONG[rigan]] : tianpan[rizhi];
  return { kename: "八专课", chuan: chainChuan(chuchuan, tianpan), method: "八专法" };
}

// 昴星
function maoxing(
  rigan: string,
  rizhi: string,
  tianpan: Record<string, string>,
  _sike: Sike,
): SanchuanResult {
  const yang = TIANGAN_YINYANG[rigan] === "阳";
  let chuchuan: string;
  let zhongchuan: string;
  if (yang) {
    chuchuan = tianpan["酉"];
    zhongchuan = tianpan[rizhi];
  } else {
    const pos = Object.keys(tianpan).find((p) => tianpan[p] === "酉")!;
    chuchuan = pos;
    zhongchuan = tianpan[GAN_JIGONG[rigan]];
  }
  const mochuan = tianpan[chuchuan];
  return { kename: "昴星课", chuan: [chuchuan, zhongchuan, mochuan], method: "昴星法" };
}

// 主调度
export function determineSanchuan(
  rigan: string,
  rizhi: string,
  tianpan: Record<string, string>,
  sike: Sike,
): SanchuanResult {
  if (isFuyin(tianpan)) return fuyin(rigan, rizhi, tianpan, sike);
  if (isFanyin(tianpan)) return fanyin(rigan, rizhi, tianpan, sike);

  const positions = kePositions(sike);
  if (positions.length === 1) return zeke(rigan, rizhi, tianpan, sike, positions);
  if (positions.length > 1) return biyong(rigan, rizhi, tianpan, sike, positions);

  const r = yaoke(rigan, rizhi, tianpan, sike);
  if (r) return r;

  const unique = new Set(sike.map(([b, t]) => `${b}${t}`));
  if (unique.size === 3) return bieze(rigan, rizhi, tianpan, sike);
  if (unique.size === 2 && GAN_JIGONG[rigan] === rizhi) return bazhuan(rigan, rizhi, tianpan, sike);
  return maoxing(rigan, rizhi, tianpan, sike);
}
