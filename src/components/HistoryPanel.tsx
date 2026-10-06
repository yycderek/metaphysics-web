"use client";
// 历史回看：列出 localStorage 中此前的占卜，可展开查看 / 删除（删除需二次确认）。
import { useEffect, useId, useRef, useState } from "react";
import AgentResultCard from "./AgentResultCard";
import LiveNote from "./LiveNote";
import { IconHistory } from "@/components/icons";
import {
  loadHistory,
  removeHistoryEntry,
  saveHistory,
  RECORDS_CHANGED_EVENT,
  type HistoryEntry,
} from "@/lib/history";

export default function HistoryPanel() {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [show, setShow] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const listId = useId();
  const timerRef = useRef<number | null>(null);

  // 挂载后从 localStorage 载入，避免与 SSR 首帧不一致（hydration 错误）；
  // 监听记录变更事件（导入备份 / 别处写入）后重读
  useEffect(() => {
    const refresh = () => setEntries(loadHistory());
    refresh();
    window.addEventListener(RECORDS_CHANGED_EVENT, refresh);
    return () => {
      window.removeEventListener(RECORDS_CHANGED_EVENT, refresh);
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    };
  }, []);

  const del = (id: string) => {
    const next = removeHistoryEntry(entries, id);
    setEntries(next);
    saveHistory(next);
    setConfirmId(null);
    setNote("已删除一条记录");
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setNote(""), 2500);
  };

  return (
    <section className="rounded-md border border-ash/25 bg-ink-2 p-5">
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-expanded={show}
        aria-controls={listId}
        className="flex items-center gap-2 font-display text-sm font-bold tracking-[0.2em] text-qinghua transition-colors hover:text-qinghua/80"
      >
        <IconHistory size={15} />
        历史回看{entries.length ? `（${entries.length}）` : ""}
      </button>

      {show && (
        <div id={listId} className="mt-3 divide-y divide-ash/15 [content-visibility:auto]">
          <LiveNote className="text-xs text-jade">{note}</LiveNote>
          {entries.length === 0 && (
            <p className="text-xs text-ash/85">暂无历史（每次 Agent 占卜会保存在本浏览器）。</p>
          )}
          {entries.map((h) => (
            <div key={h.id} className="space-y-2 py-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate text-sm">
                    <span className="text-qinghua">问：{h.question}</span>
                    <span className="ml-2 text-xs text-ash">{h.卦象}</span>
                  </div>
                  <div className="mt-1 line-clamp-2 text-xs leading-relaxed text-paper/80">
                    {h.interpretation.结论?.总断 ?? ""}
                  </div>
                </div>
                <div className="flex shrink-0 gap-2 text-xs">
                  {confirmId === h.id ? (
                    <>
                      <span className="self-center text-vermilion">确认删除？</span>
                      <button
                        onClick={() => del(h.id)}
                        className="rounded-md border border-vermilion/60 px-2.5 py-1.5 text-vermilion hover:bg-vermilion/10"
                      >
                        删除
                      </button>
                      <button
                        onClick={() => setConfirmId(null)}
                        className="rounded-md border border-ash/40 px-2.5 py-1.5 text-ash hover:text-paper"
                      >
                        取消
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => setOpenId((v) => (v === h.id ? null : h.id))}
                        className="rounded-md border border-ash/40 px-2.5 py-1.5 text-ash hover:text-paper"
                      >
                        {openId === h.id ? "收起" : "查看"}
                      </button>
                      <button
                        onClick={() => setConfirmId(h.id)}
                        className="rounded-md border border-ash/40 px-2.5 py-1.5 text-vermilion hover:border-vermilion/60"
                      >
                        删除
                      </button>
                    </>
                  )}
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
