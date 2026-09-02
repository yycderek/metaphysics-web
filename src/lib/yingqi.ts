// 应期推算：从占日(now)往后推，找"日支命中目标支"的具体日期（值日/填实）。
// 用 rizhuFromDate 计算任意日期的日柱 → 日支，与目标支比对。供六爻/大六壬上下文给出可数的应期。
import { rizhuFromDate } from "./calendar";

export function fmtMonthDay(d: Date): string {
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

/**
 * 从 base 的次日开始，返回接下来"日支 ∈ zhis"的最多 max 个日期（如 ["3月21日"]）。
 * 用途：三传支 → 值日应期；旬空支 → 该支重新出现(填实)之日。
 */
export function nextDatesByZhi(base: Date, zhis: string[], max = 3): string[] {
  const want = new Set(zhis.filter(Boolean));
  if (!want.size) return [];
  const out: string[] = [];
  for (let i = 1; i <= 60 && out.length < max; i++) {
    const d = new Date(base.getTime() + i * 86_400_000);
    if (want.has(rizhuFromDate(d)[1])) out.push(fmtMonthDay(d));
  }
  return out;
}

/** 合并为一句易读的应期描述（找不到则返回空串） */
export function yingqiLine(base: Date, parts: { label: string; zhis: string[] }[]): string {
  const segs: string[] = [];
  for (const p of parts) {
    const dates = nextDatesByZhi(base, p.zhis, 1);
    if (dates.length) segs.push(`${p.label}≈${dates[0]}`);
  }
  return segs.join("；");
}
