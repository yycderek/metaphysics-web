// 天文工具：太阳视黄经（节气）、均时差、真太阳时、按月将（节气精确版）。
// 纯 Date 计算，客户端/服务端通用；太阳黄经用 J2000 低精度公式（误差 ~0.01°，月将精度足够）。
import { shizhiFromHour } from "@/lib/data";

const D2R = Math.PI / 180;
function norm(a: number): number {
  return ((a % 360) + 360) % 360;
}
function julianDay(date: Date): number {
  return date.getTime() / 86400000 + 2440587.5;
}

/** 太阳几何黄经（度，0=春分） */
export function solarLongitude(date: Date): number {
  const jd = julianDay(date);
  const T = (jd - 2451545.0) / 36525.0;
  const L = norm(280.46646 + 36000.76983 * T + 0.0003032 * T * T);
  const M = norm(357.52911 + 35999.05029 * T - 0.0001537 * T * T);
  const Mr = M * D2R;
  const C =
    (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(Mr) +
    (0.019993 - 0.000101 * T) * Math.sin(2 * Mr) +
    0.000289 * Math.sin(3 * Mr);
  return norm(L + C);
}

// 月将随中气换：雨水后亥、春分后戌、谷雨后酉……（黄经 330/0/30/60/90/120/150/180/210/240/270/300）
const YUEJIANG_ORDER = ["亥", "戌", "酉", "申", "未", "午", "巳", "辰", "卯", "寅", "丑", "子"];
export function yuejiangFromSolarLongitude(lambda: number): string {
  return YUEJIANG_ORDER[Math.floor(((lambda + 30) % 360) / 30) % 12];
}
export function yuejiangFromDate(date: Date): string {
  return yuejiangFromSolarLongitude(solarLongitude(date));
}

/** 均时差（分钟） */
export function equationOfTime(date: Date): number {
  const start = Date.UTC(date.getFullYear(), 0, 0);
  const N = Math.floor((date.getTime() - start) / 86400000);
  const B = (2 * Math.PI * (N - 81)) / 364;
  return 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B);
}

/**
 * 真太阳时小时（0-23 的小数）。
 * longitude：当地东经（东正西负）；中国标准时（UTC+8）取 120。
 * 修正 = 经度差(每 15° 一小时) + 均时差。
 */
export function trueSolarHour(date: Date, longitude = 120): number {
  const localHours = date.getHours() + date.getMinutes() / 60 + date.getSeconds() / 3600;
  const correctionH = (longitude - 120) / 15 + equationOfTime(date) / 60;
  return (((localHours + correctionH) % 24) + 24) % 24;
}

/** 由真太阳时取时支 */
export function trueSolarShizhi(date: Date, longitude = 120): string {
  return shizhiFromHour(trueSolarHour(date, longitude));
}
