// Agent 用的"此刻"参数推导：季节、月将（节气精确）、真太阳时、日柱。
import type { Season } from "@/lib/divine/types";
import { rizhuFromDate } from "@/lib/calendar";
import { TIANGAN_WUXING } from "@/lib/data";
import { yuejiangFromDate } from "@/lib/astro";

export function seasonFromNow(now = new Date()): Season {
  const m = now.getMonth() + 1; // 1-12
  if ([3, 4, 5].includes(m)) return "春";
  if ([6, 7, 8].includes(m)) return "夏";
  if ([9, 10, 11].includes(m)) return "秋";
  if ([12, 1, 2].includes(m)) return "冬";
  return "四季";
}

export { yuejiangFromDate };

/**
 * 从可选的出生信息推导"求测者档案"（个人化断课，非必须）。
 * 若含日期（YYYY-MM-DD / YYYY年M月D日），尽力推 日柱 + 日干五行供参考；无则仅保留原文。
 */
export function derivePersona(profile?: string): string | null {
  const p = (profile ?? "").trim();
  if (!p) return null;
  const m = p.match(/(\d{4})[-年/](\d{1,2})[-月/](\d{1,2})/);
  let extra = "";
  if (m) {
    const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    if (!Number.isNaN(d.getTime())) {
      const rizhu = rizhuFromDate(d);
      const gan = rizhu[0];
      extra = `；出生日柱推定≈ ${rizhu}日（日干${gan}属${TIANGAN_WUXING[gan] ?? ""}）`;
    }
  }
  return `求测者：${p}${extra}`;
}
