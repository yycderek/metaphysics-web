// 类型定义：课式
export interface KeShi {
  rizhu: string; // 日柱 '庚子'
  rigan: string; // 日干
  rizhi: string; // 日支
  shizhi: string; // 时支
  yuejiang: string; // 月将地支
  tianpan: Record<string, string>; // {地盘: 天盘}
  sike: [string, string][]; // [(下,上)] 四课
  kename: string; // 课名
  sanchuan: string[]; // 三传 [初,中,末]
  method: string; // 九宗门方法
  tianjiang: Record<string, string>; // {天盘支: 天将简称}
  guiren: string; // 贵人支
  guirenMode: "阳贵" | "阴贵";
  xunkong: [string, string]; // 旬空
}

export interface SikeEntry {
  index: number; // 1-4
  bottom: string;
  top: string;
  relation: "上克下" | "下克上" | "无克";
  isKe: boolean; // 是否有克
}

export interface TianjiangDetail {
  short: string;
  full: string;
  jixiong: "吉" | "凶" | "中";
  zhushi: string;
}

export interface ChuanDetail {
  name: "初传" | "中传" | "末传";
  zhi: string;
  tianjiang: TianjiangDetail;
  liuqin: string;
}
