"use client";
// 应验复盘：按算法 × 事类聚合应验率，标注可靠区间。反馈给 agent 校准断语置信度。
import { useEffect, useState } from "react";
import { changyanStats, loadChangyan, reliability, type ChangyanEntry } from "@/lib/changyan";

export default function ChangyanReview() {
  const [entries, setEntries] = useState<ChangyanEntry[]>([]);
  const [show, setShow] = useState(false);
  const stats = changyanStats(entries);

  // 挂载后从 localStorage 载入，避免与 SSR 首帧不一致（hydration 错误）
  useEffect(() => {
    setEntries(loadChangyan());
  }, []);

  const byAlgo = Object.entries(stats.byAlgo);
  const byTopic = Object.entries(stats.byTopic);

  const toneCls = (t: "ok" | "mid" | "low") =>
    t === "ok" ? "text-jade" : t === "mid" ? "text-gold" : "text-vermilion";

  return (
    <section className="rounded-xl border border-ash/30 bg-ink-2 p-4">
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-expanded={show}
        className="text-gold font-bold text-sm"
      >
        📊 应验复盘{stats.verified ? ` · 应验率 ${stats.acc}%` : ""}
      </button>
      {show && (
        <div className="mt-3 space-y-3">
          {!stats.verified && (
            <p className="text-xs text-ash/85">
              暂无已验证数据。给每卦打「应验/未应验」标记后，这里会汇总并反哺 agent 校准。
            </p>
          )}
          {byTopic.length > 0 && (
            <div>
              <div className="text-xs text-ash mb-1">按事类</div>
              <div className="grid grid-cols-2 gap-2">
                {byTopic.map(([t, s]) => {
                  const r = reliability(s.acc);
                  return (
                    <div key={t} className="rounded border border-ash/20 bg-ink p-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-paper">{t}</span>
                        <span className={toneCls(r.tone)}>{r.label}</span>
                      </div>
                      <div className="text-ash/80 mt-1">
                        {s.acc != null ? `应验率 ${s.acc}%` : "待验证"} · {s.total} 例
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {byAlgo.length > 0 && (
            <div className="text-xs">
              <div className="text-ash mb-1">按算法</div>
              <div className="grid grid-cols-2 gap-2">
                {byAlgo.map(([a, s]) => {
                  const r = reliability(s.acc);
                  return (
                    <div key={a} className="rounded border border-ash/20 bg-ink p-2">
                      <div className="flex items-center justify-between">
                        <span className="text-paper">{a}</span>
                        <span className={toneCls(r.tone)}>{r.label}</span>
                      </div>
                      <div className="text-ash/80 mt-1">
                        {s.acc != null ? `应验率 ${s.acc}%` : "待验证"} · {s.total} 例
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          <p className="text-xs text-ash/85">
            这些数据会随每次占卜自动注入 agent（见「历史应验校准」），让高可靠处敢断、低可靠处收敛。
          </p>
        </div>
      )}
    </section>
  );
}
