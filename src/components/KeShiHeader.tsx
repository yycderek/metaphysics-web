"use client";
// 课式头部：日柱/时支/月将/课名/方法/贵人/旬空
import {
  DIZHI_WUXING,
  DIZHI_YINYANG,
  TIANGAN_WUXING,
  TIANGAN_YINYANG,
  YUEJIANG_NAME,
} from "@/lib/data";
import type { KeShi } from "@/lib/types";

export default function KeShiHeader({ ks }: { ks: KeShi }) {
  return (
    <div className="rounded-xl border border-gold/40 bg-ink-2 p-5">
      <div className="flex items-baseline justify-between flex-wrap gap-2">
        <h2 className="text-3xl font-bold text-gold">{ks.kename}</h2>
        <span className="text-sm text-ash">九宗门·{ks.method}</span>
      </div>
      <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
        <div>
          <div className="text-ash text-xs">日柱</div>
          <div className="text-lg text-paper">
            {ks.rizhu}日
            <span className="text-xs text-ash ml-1">
              {TIANGAN_WUXING[ks.rigan]}·{TIANGAN_YINYANG[ks.rigan]}
            </span>
          </div>
        </div>
        <div>
          <div className="text-ash text-xs">时支</div>
          <div className="text-lg text-paper">
            {ks.shizhi}
            <span className="text-xs text-ash ml-1">
              {DIZHI_WUXING[ks.rizhi]}·{DIZHI_YINYANG[ks.rizhi]}
            </span>
          </div>
        </div>
        <div>
          <div className="text-ash text-xs">月将</div>
          <div className="text-lg text-paper">
            {ks.yuejiang}·{YUEJIANG_NAME[ks.yuejiang]}
          </div>
        </div>
        <div>
          <div className="text-ash text-xs">旬空 / 贵人</div>
          <div className="text-lg text-paper">
            {ks.xunkong.join(" ")}
            <span className="text-xs text-gold ml-2">
              {ks.guiren}·{ks.guirenMode}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
