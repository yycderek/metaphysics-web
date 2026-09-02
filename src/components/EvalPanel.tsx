"use client";
// 断课质量评估面板：对一个 provider 切多个 model 跑黄金题库，SSE 展示进度 + 评分矩阵。
import { useState } from "react";
import { changyanStats, loadChangyan } from "@/lib/changyan";

interface Row {
  model: string;
  caseId: string;
  title: string;
  卦象: string;
  total: number;
  grounding?: {
    score: number;
    卦象一致: boolean;
    自校验通过: boolean;
    步骤数: number;
    有出处: boolean;
  };
  quality?: { score: number; reason: string } | null;
  error?: string;
}

export default function EvalPanel() {
  const [models, setModels] = useState("deepseek-v4-flash");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<string[]>([]);
  const [rows, setRows] = useState<Row[]>([]);
  const [summary, setSummary] = useState<
    Record<string, { 平均分: number | null; 通过率: number | null }>
  >({});
  const [error, setError] = useState("");

  const run = async () => {
    const list = models
      .split(/[,，\s]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (!list.length || busy) return;
    setBusy(true);
    setProgress([]);
    setRows([]);
    setSummary({});
    setError("");
    const milestones: string[] = [];
    try {
      const resp = await fetch("/api/eval", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ models: list, 应验: changyanStats(loadChangyan()).acc }),
      });
      if (!resp.ok) {
        const j = await resp.json().catch(() => ({ error: `HTTP ${resp.status}` }));
        throw new Error(j.error ?? "请求失败");
      }
      if (!resp.body) throw new Error("无响应流");
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const parts = buf.split(/\r?\n\r?\n/);
        buf = parts.pop() ?? "";
        for (const p of parts) {
          const line = p.trim();
          if (!line.startsWith("data:")) continue;
          const ev = JSON.parse(line.slice(5).trim());
          if (ev.type === "progress" && ev.text) {
            milestones.push(ev.text);
            setProgress([...milestones]);
          } else if (ev.type === "case" && ev.row) {
            setRows((r) => [...r, ev.row]);
          } else if (ev.type === "done" && ev.matrix) {
            setSummary(ev.matrix.summary);
          } else if (ev.type === "error") {
            throw new Error(ev.error);
          }
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="rounded-xl border border-ash/30 bg-ink-2 p-4">
      <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
        <h3 className="text-gold font-bold">🧪 断课质量评估</h3>
        <span className="text-xs text-ash">同一 provider 切多个模型，跑黄金题库对比断语质量</span>
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        <input
          value={models}
          onChange={(e) => setModels(e.target.value)}
          placeholder="模型名，逗号分隔：deepseek-v4-flash, deepseek-chat"
          className="flex-1 min-w-[240px] bg-ink border border-ash/40 rounded-lg px-3 py-2 text-sm text-paper placeholder:text-ash/85 focus:border-gold outline-none"
        />
        <button
          onClick={run}
          disabled={busy}
          className="rounded-lg bg-gold px-6 py-2 text-sm font-bold text-ink hover:bg-gold/90 transition-colors disabled:opacity-40"
        >
          {busy ? "评估中…" : "开始评估"}
        </button>
      </div>

      {busy && progress.length > 0 && (
        <div className="mb-3 rounded-lg border border-ash/30 bg-ink px-3 py-2 space-y-1">
          {progress.map((p, i) => (
            <div key={i} className="flex items-center gap-2 text-xs text-ash">
              <span className="text-gold">{i === progress.length - 1 ? "●" : "✓"}</span>
              <span className={i === progress.length - 1 ? "text-paper/90" : ""}>{p}</span>
            </div>
          ))}
        </div>
      )}

      {error && <div className="mb-3 text-sm text-vermilion">{error}</div>}

      {rows.length > 0 && <EvalMatrix rows={rows} summary={summary} />}
    </section>
  );
}

function EvalMatrix({
  rows,
  summary,
}: {
  rows: Row[];
  summary: Record<string, { 平均分: number | null; 通过率: number | null }>;
}) {
  const models = Array.from(new Set(rows.map((r) => r.model)));
  const caseIds = Array.from(new Set(rows.map((r) => r.caseId)));
  const cell = (model: string, caseId: string) =>
    rows.find((r) => r.model === model && r.caseId === caseId);

  return (
    <div className="rounded-lg border border-ash/30 bg-ink overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="text-ash border-b border-ash/20">
            <th className="px-2 py-1 text-left">用例</th>
            {models.map((m) => (
              <th key={m} className="px-2 py-1 text-center whitespace-nowrap">
                {m}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {caseIds.map((id) => {
            const title = rows.find((r) => r.caseId === id)?.title ?? id;
            return (
              <tr key={id} className="border-b border-ash/10">
                <td className="px-2 py-1 text-paper">{title}</td>
                {models.map((m) => {
                  const r = cell(m, id);
                  const detail = r
                    ? (r.error ??
                      `卦象：${r.卦象}\n硬指标：${r.grounding?.score ?? "-"} 分（卦象一致${r.grounding?.卦象一致 ? "✓" : "✗"} / 校验${r.grounding?.自校验通过 ? "✓" : "✗"}）\n质量评分：${r.quality?.score ?? "-"}\n${r.quality?.reason ?? ""}`)
                    : "";
                  return (
                    <td key={m} className="px-2 py-1 text-center" title={detail}>
                      {r ? (
                        r.error ? (
                          <span className="text-vermilion">ERR</span>
                        ) : (
                          <span
                            className={
                              r.total >= 75
                                ? "text-jade"
                                : r.total >= 60
                                  ? "text-gold"
                                  : "text-vermilion"
                            }
                          >
                            {r.total}
                          </span>
                        )
                      ) : (
                        "-"
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="text-ash border-t border-ash/20">
            <td className="px-2 py-1">平均分</td>
            {models.map((m) => (
              <td key={m} className="px-2 py-1 text-center text-gold">
                {summary[m]?.平均分 ?? "-"}
              </td>
            ))}
          </tr>
          <tr className="text-ash">
            <td className="px-2 py-1">卦象一致率</td>
            {models.map((m) => (
              <td key={m} className="px-2 py-1 text-center">
                {summary[m]?.通过率 != null ? `${summary[m].通过率}%` : "-"}
              </td>
            ))}
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
