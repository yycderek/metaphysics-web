"use client";
// 历史回看：列出 localStorage 中此前的占卜，可展开查看/删除。
import { useEffect, useState } from "react";
import AgentResultCard from "./AgentResultCard";
import { loadHistory, removeHistoryEntry, saveHistory, type HistoryEntry } from "@/lib/history";

export default function HistoryPanel() {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [show, setShow] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  // 挂载后从 localStorage 载入，避免与 SSR 首帧不一致（hydration 错误）
  useEffect(() => {
    setEntries(loadHistory());
  }, []);

  const del = (id: string) => {
    const next = removeHistoryEntry(entries, id);
    setEntries(next);
    saveHistory(next);
  };

  return (
    <section className="rounded-xl border border-ash/30 bg-ink-2 p-4">
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-expanded={show}
        className="text-gold font-bold text-sm"
      >
        📜 历史回看{entries.length ? `（${entries.length}）` : ""}
      </button>

      {show && (
        <div className="mt-3 space-y-3">
          {entries.length === 0 && (
            <p className="text-xs text-ash/70">暂无历史（每次 Agent 占卜会保存在本浏览器）。</p>
          )}
          {entries.map((h) => (
            <div key={h.id} className="rounded-lg border border-ash/30 bg-ink p-3 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-sm">
                    <span className="text-gold">问：{h.question}</span>
                    <span className="ml-2 text-xs text-ash">{h.卦象}</span>
                  </div>
                  <div className="mt-1 text-xs text-paper/80 leading-relaxed line-clamp-2">
                    {h.interpretation.结论?.总断 ?? ""}
                  </div>
                </div>
                <div className="flex gap-2 text-xs shrink-0">
                  <button
                    onClick={() => setOpenId((v) => (v === h.id ? null : h.id))}
                    className="border border-ash/40 px-2 py-0.5 rounded text-ash hover:text-paper"
                  >
                    {openId === h.id ? "收起" : "查看"}
                  </button>
                  <button
                    onClick={() => del(h.id)}
                    className="border border-ash/40 px-2 py-0.5 rounded text-vermilion"
                  >
                    删除
                  </button>
                </div>
              </div>
              {openId === h.id && (
                <AgentResultCard
                  divination={h.divination}
                  interpretation={h.interpretation}
                  divinations={h.divinations}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
