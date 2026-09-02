// 用神（锚定引擎，不靠 LLM 猜）：按问事事类确定用神六亲，并从课式/排盘算出其旺衰/旬空/位置。
// 只影响依赖六亲用神的算法（六爻、大六壬）；梅花（体用）、小六壬（掌诀）不涉及。
import { DIZHI_WUXING, sheng, ke } from "@/lib/data";
import type { Season } from "@/lib/divine/types";

export const LING_WUXING: Record<Season, string> = {
  春: "木",
  夏: "火",
  秋: "金",
  冬: "水",
  四季: "土",
};

/** 日干/用神五行相对当令五行的旺衰 */
export function wangShuai(wo: string, ling: string): string {
  if (wo === ling) return "旺（有力）";
  if (sheng(ling, wo)) return "相（得令生，有力）";
  if (sheng(wo, ling)) return "休（泄气）";
  if (ke(ling, wo)) return "囚（受制）";
  if (ke(wo, ling)) return "死（耗竭）";
  return "平";
}

/** 按问事事类 → 用神六亲（确定性映射；无法判定返回 null） */
export function yongShenFor(algorithmId: string, question: string): string | null {
  const q = question;
  if (/事业|官|升职|求职|工作|仕途|职场|官职/.test(q)) return "官鬼";
  if (/财|投资|求财|收入|挣钱|生意/.test(q)) return "妻财";
  if (/父母|文书|房产|长辈|房子|合同|考试|学业|成绩/.test(q)) return "父母";
  if (/子女|子孙|孩子|口福|福/.test(q)) return "子孙";
  if (/兄弟|朋友|同辈|对手|竞争/.test(q)) return "兄弟";
  if (/感情|婚姻|对象|桃花|恋爱|合婚/.test(q)) return "妻财";
  return null;
}

/** 大六壬用神事实（chuan = chuanTianjiang(ks)，已含六亲） */
export function daliurenYongShen(
  chuan: Array<{ name: string; zhi: string; tianjiang: { full: string }; liuqin: string }>,
  kong: string[] | undefined,
  yongShen: string,
  season: Season,
): string {
  const idx = chuan.findIndex((c) => c.liuqin === yongShen);
  if (idx < 0) return `用神：${yongShen}（未现于三传，主需伏藏或另应，见正色伏神）`;
  const c = chuan[idx];
  const wx = DIZHI_WUXING[c.zhi];
  const sx = wangShuai(wx, LING_WUXING[season]);
  const isKong = kong?.includes(c.zhi);
  return `用神：${yongShen}（${c.name}·${c.zhi}（${wx}）·${c.tianjiang.full}·旺衰【${sx}】${isKong ? "·旬空" : ""}）`;
}

/** 六爻用神事实（raw.爻 自初爻至上爻排列） */
export function liuyaoYongShen(raw: unknown, yongShen: string, season: Season): string {
  const r = raw as {
    世位?: number;
    应位?: number;
    旬空?: string[];
    爻?: Array<{ 爻位: string; 变: string; 纳: string; 五行: string; 六亲: string }>;
  };
  const ys = r.爻 ?? [];
  const i = ys.findIndex((y) => y.六亲 === yongShen);
  if (i < 0) return `用神：${yongShen}（未现，需伏神看）`;
  const y = ys[i];
  const zhi = y.纳[1] ?? "";
  const sx = wangShuai(y.五行, LING_WUXING[season]);
  const posLabel = ["初", "二", "三", "四", "五", "上"][i] ?? String(i + 1);
  const isGui = i + 1 === r.世位;
  const isYing = i + 1 === r.应位;
  const kong = (r.旬空 ?? []).includes(zhi);
  const marks = [
    y.变 === "动" ? "动爻" : "",
    isGui ? "世" : isYing ? "应" : "",
    kong ? "旬空" : "",
  ].filter(Boolean);
  return `用神：${yongShen}（${posLabel}爻·${y.纳}（${y.五行}）·旺衰【${sx}】${marks.length ? "·" + marks.join("·") : ""}）`;
}
