"use client";
// 起课仪式：占卜进行中展示缓慢旋转的八卦罗盘 + 里程碑，把等待变成仪式而非进度条。
import { motion, useReducedMotion } from "framer-motion";

interface Props {
  /** SSE 里程碑文本，最后一条为进行中 */
  progress: string[];
  /** 当前算法名（可选） */
  algorithm?: string;
}

function BaguaRing() {
  return (
    <svg viewBox="0 0 100 100" width="68" height="68" aria-hidden="true" focusable="false">
      <circle
        cx="50"
        cy="50"
        r="44"
        fill="none"
        style={{ stroke: "var(--gold)" }}
        strokeOpacity="0.35"
        strokeWidth="1.5"
      />
      <circle
        cx="50"
        cy="50"
        r="30"
        fill="none"
        style={{ stroke: "var(--gold)" }}
        strokeOpacity="0.22"
        strokeWidth="1"
      />
      {Array.from({ length: 8 }).map((_, i) => (
        <g key={i} transform={`rotate(${i * 45} 50 50)`}>
          <path
            d="M50 8v7"
            style={{ stroke: "var(--gold)" }}
            strokeWidth="3"
            strokeLinecap="round"
            strokeOpacity={i % 2 === 0 ? 0.85 : 0.4}
          />
        </g>
      ))}
      {Array.from({ length: 12 }).map((_, i) => (
        <g key={`t${i}`} transform={`rotate(${i * 30} 50 50)`}>
          <path
            d="M50 36.5v3"
            style={{ stroke: "var(--ash)" }}
            strokeWidth="1"
            strokeOpacity="0.5"
          />
        </g>
      ))}
    </svg>
  );
}

export default function CastingRitual({ progress, algorithm }: Props) {
  const reduce = useReducedMotion();
  return (
    <div className="relative overflow-hidden rounded-xl border border-gold/30 bg-ink px-4 py-4">
      <div className="flex items-center gap-4">
        <div className="relative shrink-0">
          <div className={reduce ? "" : "animate-spin-slow"}>
            <BaguaRing />
          </div>
          <span
            className="pointer-events-none absolute inset-0 flex items-center justify-center text-xl"
            style={{ color: "var(--gold)" }}
          >
            占
          </span>
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <div className="text-sm font-bold" style={{ color: "var(--gold)" }}>
            正在起课{algorithm ? ` · ${algorithm}` : ""}…
          </div>
          <ul className="space-y-0.5">
            {progress.map((p, i) => {
              const current = i === progress.length - 1;
              return (
                <motion.li
                  key={`${i}-${p}`}
                  initial={reduce ? false : { opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.28 }}
                  className="flex items-center gap-2 text-xs"
                  style={{ color: current ? "var(--paper)" : "var(--ash)" }}
                >
                  <span style={{ color: "var(--gold)" }}>{current ? "◉" : "✓"}</span>
                  <span className="truncate">{p}</span>
                </motion.li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
