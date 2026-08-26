// 日历工具（前端简化版）：日柱/时支公式。
// 日柱：锚点 1900-01-01 = 甲戌（六十甲子序号10）
// 月将：不做天文算法，由用户在下拉框选择（MVP）；可用中气速查表辅助
import { JIAZI, shizhiFromHour } from "./data";

const EPOCH = Date.UTC(1900, 0, 1);

export function rizhuFromDate(d: Date): string {
  const days = Math.floor(
    (Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - EPOCH) / 86400000,
  );
  return JIAZI[(((days + 10) % 60) + 60) % 60];
}

export { shizhiFromHour };
