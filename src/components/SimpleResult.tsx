"use client";
// 友好结果卡：为没有专属视图的算法（小六壬 / 通用）展示醒目、可读的结果，而不是 raw JSON 树。
interface XiaoRaw {
  palm?: string;
  auspicious?: "吉" | "中" | "凶" | string;
  meaning?: string;
  numerology?: Record<string, number>;
}

function jxColor(a?: string): string {
  if (a === "吉") return "text-jade";
  if (a === "凶") return "text-vermilion";
  return "text-gold";
}

function XiaoLiuRenCard({ raw }: { raw: XiaoRaw }) {
  return (
    <div className="rounded-xl border border-gold/40 bg-ink p-5 text-center space-y-3">
      <div className="text-sm text-ash">六壬掌诀 · 落宫</div>
      <div className="text-5xl font-bold text-gold">{raw.palm ?? "?"}</div>
      <div className={`text-xl ${jxColor(raw.auspicious)} font-bold`}>
        吉凶 · {raw.auspicious ?? "-"}
      </div>
      <p className="text-sm text-paper/90 leading-relaxed">{raw.meaning ?? ""}</p>
      {raw.numerology && (
        <div className="text-xs text-ash">
          起课：月 {raw.numerology.month} · 日 {raw.numerology.day} · 时 {raw.numerology.hour}
        </div>
      )}
    </div>
  );
}

/** 通用：把 top-level 字段渲染成清晰的名值对（嵌套对象折叠为代码块） */
function GenericCard({ raw }: { raw: Record<string, unknown> }) {
  const rows = Object.entries(raw);
  return (
    <div className="rounded-xl border border-ash/30 bg-ink p-4 space-y-2">
      {rows.length === 0 && <p className="text-sm text-ash">（无结果数据）</p>}
      {rows.map(([k, v]) => {
        const isPrimitive =
          typeof v === "string" || typeof v === "number" || typeof v === "boolean";
        return (
          <div
            key={k}
            className="flex gap-3 text-sm border-b border-ash/10 pb-2 last:border-0 last:pb-0"
          >
            <span className="w-20 shrink-0 text-gold">{k}</span>
            {isPrimitive ? (
              <span className="text-paper/90">{String(v)}</span>
            ) : (
              <code className="bg-ink-2 rounded px-2 py-0.5 text-xs text-paper/80 whitespace-pre-wrap break-all">
                {JSON.stringify(v)}
              </code>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function SimpleResult({ algorithmId, raw }: { algorithmId: string; raw: unknown }) {
  const r = (raw ?? {}) as Record<string, unknown>;
  if (algorithmId === "xiaoliuren") {
    return <XiaoLiuRenCard raw={r as XiaoRaw} />;
  }
  return <GenericCard raw={r} />;
}
