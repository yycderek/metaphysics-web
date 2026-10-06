"use client";
// 起课仪式：占卜进行中展示缓慢旋转的八卦罗盘 + 里程碑，把等待变成仪式而非进度条。
import { LazyMotion, domAnimation, m, useReducedMotion } from "framer-motion";

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
        style={{ stroke: "var(--qinghua)" }}
        strokeOpacity="0.35"
        strokeWidth="1.5"
      />
      <circle
        cx="50"
        cy="50"
        r="30"
        fill="none"
        style={{ stroke: "var(--qinghua)" }}
        strokeOpacity="0.22"
        strokeWidth="1"
      />
      {Array.from({ length: 8 }).map((_, i) => (
        <g key={i} transform={`rotate(${i * 45} 50 50)`}>
          <path
            d="M50 8v7"
            style={{ stroke: "var(--qinghua)" }}
            strokeWidth="2"
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
    <LazyMotion features={domAnimation}>
      <div className="relative overflow-hidden rounded-md border border-ash/25 bg-ink-2 px-5 py-5">
        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            <div className={reduce ? "" : "animate-spin-slow"}>
              <BaguaRing />
            </div>
            <span
              className="pointer-events-none absolute inset-0 flex items-center justify-center font-display text-xl"
              style={{ color: "var(--qinghua)" }}
            >
              占
            </span>
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <div
              className="font-display text-sm font-bold tracking-[0.1em]"
              style={{ color: "var(--qinghua)" }}
            >
              正在起课{algorithm ? ` · ${algorithm}` : ""}…
            </div>
            <ul className="space-y-0.5" aria-live="polite">
              {progress.map((p, i) => {
                const current = i === progress.length - 1;
                return (
                  <m.li
                    key={`${i}-${p}`}
                    initial={reduce ? false : { opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.28 }}
                    className="flex items-center gap-2 text-xs"
                    style={{ color: current ? "var(--paper)" : "var(--ash)" }}
                  >
                    <span
                      aria-hidden="true"
                      className="h-1.5 w-1.5 shrink-0 rounded-[1px]"
                      style={{
                        background: current ? "var(--vermilion)" : "transparent",
                        border: current ? "none" : "1px solid var(--ash)",
                      }}
                    />
                    <span className="truncate">{p}</span>
                  </m.li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </LazyMotion>
  );
}
