"use client";
// 起课输入表单：日柱/时支/月将 + 当前时间快捷
import { useState } from "react";
import { DIZHI, TIANGAN, YUEJIANG_NAME, shizhiFromHour } from "@/lib/data";
import { rizhuFromDate } from "@/lib/calendar";
import type { KeShi } from "@/lib/types";
import { build } from "@/lib/shike";

interface Props {
  onDivine: (ks: KeShi) => void;
  initialRizhu?: string;
  initialShizhi?: string;
  initialYuejiang?: string;
}

const DEFAULT = { rizhu: "庚子", shizhi: "午", yuejiang: "亥" };

export default function DivineForm({
  onDivine,
  initialRizhu,
  initialShizhi,
  initialYuejiang,
}: Props) {
  const [gan, setGan] = useState((initialRizhu ?? DEFAULT.rizhu)[0]);
  const [zhi, setZhi] = useState((initialRizhu ?? DEFAULT.rizhu)[1]);
  const [shizhi, setShizhi] = useState(initialShizhi ?? DEFAULT.shizhi);
  const [yuejiang, setYuejiang] = useState(initialYuejiang ?? DEFAULT.yuejiang);
  const [error, setError] = useState("");

  const useNow = () => {
    const now = new Date();
    const rz = rizhuFromDate(now);
    setGan(rz[0]);
    setZhi(rz[1]);
    setShizhi(shizhiFromHour(now.getHours()));
    setError("");
  };

  const divine = () => {
    try {
      const ks = build(gan + zhi, shizhi, yuejiang);
      setError("");
      onDivine(ks);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const selectCls =
    "bg-ink-2 border border-ash/40 rounded-lg px-3 py-2 text-paper text-sm focus:border-gold outline-none";

  return (
    <div className="rounded-xl border border-ash/30 bg-ink-2 p-4">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <div className="text-xs text-ash mb-1">日干</div>
          <select className={selectCls} value={gan} onChange={(e) => setGan(e.target.value)}>
            {TIANGAN.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>
        <div>
          <div className="text-xs text-ash mb-1">日支</div>
          <select className={selectCls} value={zhi} onChange={(e) => setZhi(e.target.value)}>
            {DIZHI.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
        <div>
          <div className="text-xs text-ash mb-1">时支</div>
          <select className={selectCls} value={shizhi} onChange={(e) => setShizhi(e.target.value)}>
            {DIZHI.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
        <div>
          <div className="text-xs text-ash mb-1">月将</div>
          <select className={selectCls} value={yuejiang} onChange={(e) => setYuejiang(e.target.value)}>
            {DIZHI.map((d) => (
              <option key={d} value={d}>{d}·{YUEJIANG_NAME[d]}</option>
            ))}
          </select>
        </div>
        <button
          onClick={useNow}
          className="rounded-lg border border-ash/40 px-3 py-2 text-sm text-ash hover:text-paper hover:border-gold transition-colors"
        >
          ⌚ 当前时间
        </button>
        <button
          onClick={divine}
          className="rounded-lg bg-vermilion px-6 py-2 text-sm font-bold text-paper hover:bg-vermilion/80 transition-colors"
        >
          起课
        </button>
      </div>
      {error && <div className="mt-2 text-sm text-vermilion">{error}</div>}
    </div>
  );
}
