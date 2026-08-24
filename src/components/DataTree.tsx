"use client";
// 通用数据树视图：递归渲染任意 JSON 数据（未知算法/远程算法的兜底展示）
export default function DataTree({ data }: { data: unknown }) {
  const render = (v: unknown, depth: number): React.ReactNode => {
    const pad = { paddingLeft: depth * 14 };
    if (v === null || v === undefined) return <span className="text-ash/60">null</span>;
    if (typeof v === "string") return <span className="text-jade">"{v}"</span>;
    if (typeof v === "number" || typeof v === "boolean") return <span className="text-gold">{String(v)}</span>;
    if (Array.isArray(v)) {
      if (v.length === 0) return <span className="text-ash/60">[]</span>;
      return (
        <div style={pad} className="space-y-0.5">
          {v.map((item, i) => (
            <div key={i} className="text-sm text-paper/80">
              <span className="text-ash/60">[{i}]</span> {render(item, depth + 1)}
            </div>
          ))}
        </div>
      );
    }
    if (typeof v === "object") {
      const entries = Object.entries(v as Record<string, unknown>);
      if (entries.length === 0) return <span className="text-ash/60">{"{}"}</span>;
      return (
        <div style={pad} className="space-y-0.5">
          {entries.map(([k, val]) => (
            <div key={k} className="text-sm">
              <span className="text-ash">{k}:</span> {render(val, depth + 1)}
            </div>
          ))}
        </div>
      );
    }
    return <span>{String(v)}</span>;
  };
  return <div className="rounded-lg border border-ash/30 bg-ink p-4 font-mono text-sm">{render(data, 0)}</div>;
}
