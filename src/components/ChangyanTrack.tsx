"use client";
// 应验追踪：为这一卦标记应验/未应验，并展示历史准确率。
import { useEffect, useMemo, useState } from "react";
import {
  changyanStats,
  loadChangyan,
  saveChangyan,
  upsertChangyan,
  RECORDS_CHANGED_EVENT,
  type ChangyanOutcome,
  type ChangyanEntry,
} from "@/lib/changyan";

interface Props {
  id: string;
  algorithmId: string;
  topic?: string;
  卦象: string;
  总结: string;
}

const OPTIONS: ChangyanOutcome[] = ["应验", "未应验", "待验证"];

export default function ChangyanTrack({ id, algorithmId, topic, 卦象, 总结 }: Props) {
  const [entries, setEntries] = useState<ChangyanEntry[]>([]);
  const current = entries.find((e) => e.id === id)?.outcome;
  const stats = useMemo(() => changyanStats(entries), [entries]);

  // 挂载后从 localStorage 载入，避免与 SSR 首帧不一致（hydration 错误）；
  // 监听记录变更事件（多处 ChangyanTrack / 复盘同源数据）后重读
  useEffect(() => {
    const refresh = () => setEntries(loadChangyan());
    refresh();
    window.addEventListener(RECORDS_CHANGED_EVENT, refresh);
    return () => window.removeEventListener(RECORDS_CHANGED_EVENT, refresh);
  }, []);

  const pick = (o: ChangyanOutcome) => {
    const entry = {
      id,
      algorithmId,
      topic,
      卦象,
      总结,
      outcome: o,
      ts: Date.now(),
    };
    const next = upsertChangyan(entries, entry);
    setEntries(next);
    saveChangyan(next);
  };

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      <span className="tracking-[0.15em] text-ash">应验追踪：</span>
      {OPTIONS.map((o) => (
        <button
          key={o}
          type="button"
          aria-pressed={current === o}
          onClick={() => pick(o)}
          className={`inline-flex items-center rounded-md border px-2.5 py-1 transition-colors ${
            current === o
              ? "border-vermilion/70 text-vermilion before:mr-1.5 before:inline-block before:size-1.5 before:rounded-full before:bg-vermilion before:content-['']"
              : "border-ash/30 text-ash hover:border-ash/60 hover:text-paper"
          }`}
        >
          {o}
        </button>
      ))}
      {stats.acc !== null && (
        <span className="tabular-nums text-ash/85">
          已验证 {stats.verified} · 准确率 {stats.acc}%
        </span>
      )}
    </div>
  );
}
