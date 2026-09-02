"use client";
// 应验追踪：为这一卦标记应验/未应验，并展示历史准确率。
import { useEffect, useState } from "react";
import {
  changyanStats,
  loadChangyan,
  saveChangyan,
  upsertChangyan,
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
  const stats = changyanStats(entries);

  // 挂载后从 localStorage 载入，避免与 SSR 首帧不一致（hydration 错误）
  useEffect(() => {
    setEntries(loadChangyan());
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
      <span className="text-ash">应验追踪：</span>
      {OPTIONS.map((o) => (
        <button
          key={o}
          onClick={() => pick(o)}
          className={`px-2 py-1 rounded border transition-colors ${
            current === o
              ? o === "应验"
                ? "border-jade text-jade"
                : o === "未应验"
                  ? "border-vermilion text-vermilion"
                  : "border-gold text-gold"
              : "border-ash/40 text-ash hover:text-paper"
          }`}
        >
          {o}
        </button>
      ))}
      {stats.acc !== null && (
        <span className="text-ash/85">
          已验证 {stats.verified} · 准确率 {stats.acc}%
        </span>
      )}
    </div>
  );
}
