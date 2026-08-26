// 数据层：从 liuren-py 导出的 data.json（scripts/export_data.py 生成，勿手改）
import raw from "./data.json";

export const TIANGAN = raw.tiangan.map((t) => t.gan);
export const DIZHI = raw.dizhi.map((d) => d.zhi);

export const TIANGAN_WUXING: Record<string, string> = Object.fromEntries(
  raw.tiangan.map((t) => [t.gan, t.wuxing]),
);
export const TIANGAN_YINYANG: Record<string, string> = Object.fromEntries(
  raw.tiangan.map((t) => [t.gan, t.yinyang]),
);
export const DIZHI_WUXING: Record<string, string> = Object.fromEntries(
  raw.dizhi.map((d) => [d.zhi, d.wuxing]),
);
export const DIZHI_YINYANG: Record<string, string> = Object.fromEntries(
  raw.dizhi.map((d) => [d.zhi, d.yinyang]),
);
export const DIZHI_SHENGXIAO: Record<string, string> = Object.fromEntries(
  raw.dizhi.map((d) => [d.zhi, d.shengxiao]),
);
export const DIZHI_SHICHEN: Record<string, string> = Object.fromEntries(
  raw.dizhi.map((d) => [d.zhi, d.shichen]),
);

export const GAN_JIGONG: Record<string, string> = raw.ganJigong;
export const GUI_REN: Record<string, [string, string]> = raw.guiRen as unknown as Record<
  string,
  [string, string]
>; // [阳贵, 阴贵]
export const DIZHI_CHONG: Record<string, string> = raw.dizhiChong;
export const DIZHI_HAI: Record<string, string> = raw.dizhiHai;
export const DIZHI_XING: Record<string, string> = raw.dizhiXing;
export const DIZHI_MENGZHONGJI: Record<string, string> = raw.mengzhongji;
export const DIZHI_LIUHE_MAP: Record<string, string> = Object.fromEntries(
  raw.dizhiLiuhe.map((h) => [h.a, h.b]),
);
export const JIAZI: string[] = raw.jiazi;
export const YUEJIANG_NAME: Record<string, string> = raw.yuejiangName;
export const YUEJIANG_BY_ZHONGQI: Record<string, string> = raw.yuejiangByZhongqi;
export const ZHONGQI_ORDER: string[] = raw.zhongqiOrder;
export const WUSHUDUN: Record<string, string> = raw.wushudun;

export const WUXING_SHENG: Record<string, string> = raw.wuxingSheng;
export const WUXING_KE: Record<string, string> = raw.wuxingKe;
export const WANGXIU: Record<string, Record<string, string>> = raw.wangxiu;
export const CHANGSHENG_QI: Record<string, string> = raw.changshengQi;
export const CHANGSHENG_STAGES: string[] = raw.changshengStages;

export const TIANJIANG_ORDER: string[] = raw.tiangjiangOrder;
export const TIANJIANG_FULL: Record<string, string> = raw.tianjiangFull;
export const TIANJIANG_JIXIONG: Record<string, "吉" | "凶" | "中"> = raw.tianjiangJixiong as Record<
  string,
  "吉" | "凶" | "中"
>;
export const TIANJIANG_ZHUSHI: Record<string, string> = raw.tianjiangZhushi;

// 五行生克
export function sheng(a: string, b: string): boolean {
  return WUXING_SHENG[a] === b;
}
export function ke(a: string, b: string): boolean {
  return WUXING_KE[a] === b;
}

// 六亲：以日干五行为我
export function liuqin(riganWx: string, otherWx: string): string {
  if (otherWx === riganWx) return "兄弟";
  if (sheng(riganWx, otherWx)) return "子孙";
  if (sheng(otherWx, riganWx)) return "父母";
  if (ke(riganWx, otherWx)) return "妻财";
  if (ke(otherWx, riganWx)) return "官鬼";
  throw new Error(`无法判定六亲: ${riganWx} vs ${otherWx}`);
}

// 六十甲子序号
export function ganzhiIndex(gan: string, zhi: string): number {
  const g = TIANGAN.indexOf(gan);
  const z = DIZHI.indexOf(zhi);
  return (((g * 6 - z * 5) % 60) + 60) % 60;
}

// 旬空
export function xunkong(gan: string, zhi: string): [string, string] {
  const n = ganzhiIndex(gan, zhi);
  const head = Math.floor(n / 10) * 10;
  return [JIAZI[(head + 10) % 60][1], JIAZI[(head + 11) % 60][1]];
}

// 时辰工具
export function shizhiFromHour(hour: number): string {
  return DIZHI[Math.floor((hour + 1) / 2) % 12];
}
export function shiganFromRi(rigan: string, shizhi: string): string {
  const ziGan = WUSHUDUN[rigan];
  return TIANGAN[(TIANGAN.indexOf(ziGan) + DIZHI.indexOf(shizhi)) % 10];
}
