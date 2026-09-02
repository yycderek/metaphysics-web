"use client";
// 友好的数据视图：把结构化数据（推导步骤中间值 / raw）渲染成可读的名值对、列表、小卡片，
// 彻底替代 raw JSON 树（不出现 JSON.stringify）。标签用肤色区分，数组/嵌套用缩进或小卡展示。
import type { ReactNode } from "react";

function isPrimitive(v: unknown): boolean {
  return typeof v === "string" || typeof v === "number" || typeof v === "boolean";
}

function Inline({ v }: { v: string | number | boolean }) {
  return <span className="text-paper/90">{String(v)}</span>;
}

/** 递归渲染 */
function render(v: unknown, depth: number): ReactNode {
  if (v === null || v === undefined) return <span className="text-ash/85">—</span>;
  if (isPrimitive(v)) return <Inline v={v as string | number | boolean} />;
  if (Array.isArray(v)) {
    if (v.length === 0) return <span className="text-ash/85">（无）</span>;
    // 全原始值 → 一行列出；否则逐项小卡
    if (v.every(isPrimitive)) {
      return <span className="text-paper/90">{v.map(String).join("、")}</span>;
    }
    return (
      <div className="space-y-1.5">
        {v.map((item, i) => (
          <div key={i} className="rounded-md border border-ash/20 bg-ink px-2.5 py-1.5 space-y-0.5">
            {render(item, depth + 1)}
          </div>
        ))}
      </div>
    );
  }
  if (typeof v === "object") {
    const entries = Object.entries(v as Record<string, unknown>);
    if (entries.length === 0) return <span className="text-ash/85">（空）</span>;
    return (
      <div className="space-y-1">
        {entries.map(([k, val]) => (
          <div key={k} className="flex gap-2 text-sm">
            <span className="w-20 shrink-0 text-gold">{k}</span>
            <div className="flex-1 min-w-0">{render(val, depth + 1)}</div>
          </div>
        ))}
      </div>
    );
  }
  return <span className="text-paper/90">{String(v)}</span>;
}

export default function DataView({ data }: { data: unknown }) {
  return <div className="space-y-1 text-sm leading-relaxed">{render(data, 0)}</div>;
}
