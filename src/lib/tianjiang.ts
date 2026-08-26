// 十二天将：贵人起法 + 排布
import {
  DIZHI,
  GUI_REN,
  TIANJIANG_FULL,
  TIANJIANG_JIXIONG,
  TIANJIANG_ORDER,
  TIANJIANG_ZHUSHI,
} from "./data";
import type { TianjiangDetail } from "./types";

const DAY_BRANCHES = new Set(["卯", "辰", "巳", "午", "未", "申"]);

export function guiren(rigan: string, shizhi: string): [string, "阳贵" | "阴贵"] {
  const [yangGui, yinGui] = GUI_REN[rigan];
  if (DAY_BRANCHES.has(shizhi)) return [yangGui, "阳贵"];
  return [yinGui, "阴贵"];
}

export function buildTianjiang(
  rigan: string,
  shizhi: string,
  tianpan: Record<string, string>,
): { tianjiang: Record<string, string>; guiren: string; mode: "阳贵" | "阴贵" } {
  const [gui, mode] = guiren(rigan, shizhi);
  const pos = Object.keys(tianpan).find((p) => tianpan[p] === gui)!;
  const idx = DIZHI.indexOf(pos);
  const tianjiang: Record<string, string> = {};
  for (let i = 0; i < 12; i++) {
    const p = mode === "阳贵" ? DIZHI[(idx + i) % 12] : DIZHI[(((idx - i) % 12) + 12) % 12];
    tianjiang[tianpan[p]] = TIANJIANG_ORDER[i];
  }
  return { tianjiang, guiren: gui, mode };
}

export function tianjiangInfo(short: string): TianjiangDetail {
  return {
    short,
    full: TIANJIANG_FULL[short],
    jixiong: TIANJIANG_JIXIONG[short],
    zhushi: TIANJIANG_ZHUSHI[short],
  };
}
