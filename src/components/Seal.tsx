"use client";
// 朱砂印章：结果盖印 / 品牌落款。stamp=true 时以「落印」动效盖下（尊重减少动效偏好）。
import { motion, useReducedMotion } from "framer-motion";

interface Props {
  char?: string;
  size?: number;
  className?: string;
  /** 以盖印动效出现 */
  stamp?: boolean;
}

export default function Seal({ char = "玄", size = 52, className = "", stamp = false }: Props) {
  const reduce = useReducedMotion();
  const svg = (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label={`朱砂印：${char}`}
    >
      <rect
        x="5"
        y="5"
        width="90"
        height="90"
        rx="16"
        fill="none"
        style={{ stroke: "var(--vermilion)" }}
        strokeWidth="6"
      />
      <rect
        x="17"
        y="17"
        width="66"
        height="66"
        rx="6"
        fill="none"
        style={{ stroke: "var(--vermilion)" }}
        strokeWidth="2"
        strokeOpacity="0.55"
      />
      <text
        x="50"
        y="50"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="46"
        style={{ fill: "var(--vermilion)", fontFamily: "var(--font-serif-cn)" }}
      >
        {char}
      </text>
    </svg>
  );

  if (!stamp || reduce) return svg;

  return (
    <motion.span
      className="inline-block"
      initial={{ scale: 2.4, opacity: 0, rotate: -14 }}
      animate={{ scale: 1, opacity: 1, rotate: 0 }}
      transition={{ type: "spring", stiffness: 240, damping: 15 }}
    >
      {svg}
    </motion.span>
  );
}
