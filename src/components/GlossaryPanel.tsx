"use client";
// 术语速查面板：列出全部玄学术语及其释义。
import { useState } from "react";
import { glossaryTerms, GLOSSARY } from "@/lib/glossary";

export default function GlossaryPanel() {
  const [show, setShow] = useState(false);
  const terms = glossaryTerms();
  return (
    <section className="rounded-xl border border-ash/30 bg-ink-2 p-4">
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-expanded={show}
        className="text-gold font-bold text-sm"
      >
        📖 术语速查{show ? "（收起）" : ""}
      </button>
      {show && (
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
          {terms.map((t) => (
            <div key={t} className="rounded border border-ash/20 bg-ink p-2 text-xs">
              <span className="text-gold font-bold mr-2">{t}</span>
              <span className="text-paper/80">{GLOSSARY[t]}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
