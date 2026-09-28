"use client";
// 术语 hover/聚焦 释义：单独包裹一个术语，或自动高亮文本中的已知术语。
import { useId } from "react";
import { GLOSSARY } from "@/lib/glossary";

export function Term({ term }: { term: string }) {
  const def = GLOSSARY[term];
  const defId = useId();
  if (!def) return <>{term}</>;
  return (
    <span
      tabIndex={0}
      aria-describedby={defId}
      className="relative inline group cursor-help text-gold/90 underline decoration-dotted decoration-gold/40 underline-offset-4"
    >
      {term}
      <span
        id={defId}
        role="tooltip"
        className="hidden group-hover:block group-focus-within:block absolute z-30 left-0 top-full mt-1 max-w-[260px] rounded-md border border-ash/25 bg-ink-2 p-2 text-xs text-paper/90 leading-relaxed"
      >
        {def}
      </span>
    </span>
  );
}

/** 自动把文本中的已知术语包成可悬停释义 */
export function TermText({ text }: { text: string }) {
  const keys = glossaryKeys();
  if (!keys.length) return <>{text}</>;
  const re = new RegExp(`(${keys.map((k) => escapeRe(k)).join("|")})`, "g");
  const parts = text.split(re);
  return (
    <>{parts.map((p, i) => (GLOSSARY[p] ? <Term key={i} term={p} /> : <span key={i}>{p}</span>))}</>
  );
}

let cached: string[] | null = null;
function glossaryKeys(): string[] {
  if (cached) return cached;
  cached = Object.keys(GLOSSARY).sort((a, b) => b.length - a.length);
  return cached;
}
function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
