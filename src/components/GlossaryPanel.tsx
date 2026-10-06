"use client";
// 术语速查面板：列出全部玄学术语及其释义。
import { useId, useState } from "react";
import { IconBook } from "@/components/icons";
import { glossaryTerms, GLOSSARY } from "@/lib/glossary";

const TERMS = glossaryTerms();

export default function GlossaryPanel() {
  const [show, setShow] = useState(false);
  const listId = useId();
  return (
    <section className="rounded-md border border-ash/25 bg-ink-2 p-5">
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-expanded={show}
        aria-controls={listId}
        className="flex items-center gap-2 font-display text-sm font-bold tracking-[0.2em] text-qinghua transition-colors hover:text-qinghua/80"
      >
        <IconBook size={15} />
        术语速查{show ? "（收起）" : ""}
      </button>
      {show && (
        <div id={listId} className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {TERMS.map((t) => (
            <div
              key={t}
              className="rounded-md border border-ash/25 bg-ink p-2.5 text-xs leading-relaxed"
            >
              <span className="mr-2 font-display font-bold tracking-wider text-qinghua">{t}</span>
              <span className="text-paper/80">{GLOSSARY[t] ?? "暂无释义"}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
