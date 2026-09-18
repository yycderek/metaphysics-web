"use client";
// 六爻卦象（自上而下：上爻→初爻）：摇卦后逐爻落定，动爻以朱砂标记。
import { motion, useReducedMotion } from "framer-motion";

const YAO_NAMES = ["初", "二", "三", "四", "五", "上"];

function YaoBar({ yang, moving }: { yang: boolean; moving: boolean }) {
  const color = moving ? "var(--vermilion)" : "var(--paper)";
  return (
    <div className="flex h-2.5 w-24 items-center gap-1.5">
      <span className="h-full flex-1 rounded-sm" style={{ background: color }} />
      {!yang && <span className="h-full flex-1 rounded-sm" style={{ background: color }} />}
    </div>
  );
}

interface Props {
  /** 逗号分隔的六个数（6/7/8/9，初爻→上爻） */
  value: string;
  /** 变化即重放落爻动画 */
  animateKey?: number;
}

export default function YaoLines({ value, animateKey = 0 }: Props) {
  const reduce = useReducedMotion();
  const tosses = value
    .split(/[,\s]+/)
    .map((n) => Number(n))
    .filter((n) => !Number.isNaN(n))
    .slice(0, 6);

  if (tosses.length === 0) return null;

  // 倒序展示：上爻在最上
  const rows = [...tosses].reverse();

  return (
    <div className="flex flex-col items-center gap-1.5 py-1">
      {rows.map((t, i) => {
        const yang = t === 7 || t === 9;
        const moving = t === 6 || t === 9;
        const label = YAO_NAMES[5 - i];
        return (
          <motion.div
            key={`${animateKey}-${i}`}
            initial={reduce ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: reduce ? 0 : i * 0.08, duration: 0.32 }}
            className="flex items-center gap-3"
          >
            <span className="w-4 text-right text-[10px] text-ash">{label}</span>
            <YaoBar yang={yang} moving={moving} />
            <span
              className="w-6 text-[10px]"
              style={{ color: moving ? "var(--vermilion)" : "var(--ash)" }}
            >
              {t}
            </span>
            <span className="w-8 text-[10px] text-ash">{moving ? "动" : ""}</span>
          </motion.div>
        );
      })}
    </div>
  );
}
