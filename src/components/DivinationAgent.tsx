"use client";
// 智能占卜 Agent 面板（多轮）：用户直接说意图 → 模型自主决定算法/参数并调用 divinate 起课
// → 引擎精确算课 → 模型输出结构化断语（卦象 + 简略结论 + 逐步详细解读）。
// 支持多轮：会话保留，可深化当前卦，也可"换个时辰/参数"再占对比。
import { useRef, useState } from "react";
import AgentResultCard from "@/components/AgentResultCard";
import type { AgentDivination, AgentMeta } from "@/lib/agent/types";
import type { DivinationResult } from "@/lib/algorithms/types";

const STORAGE_KEY = "metaphysics-ai-config";
const LEGACY_STORAGE_KEY = "liuren-ai-config";

const EXAMPLES = ["看看我最近的事业运势", "测测我明天出行的吉凶", "帮我看看这周换工作合不合适"];

interface HistoryMsg {
  role: "user" | "assistant";
  content: string;
}

interface AgentTurn {
  question: string;
  interpretation: AgentDivination;
  divination?: DivinationResult;
  error?: string;
}

function loadAIConfig(): Record<string, unknown> | undefined {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(LEGACY_STORAGE_KEY);
    return raw ? JSON.parse(raw) : undefined;
  } catch {
    return undefined;
  }
}

export default function DivinationAgent() {
  const [input, setInput] = useState("");
  const [turns, setTurns] = useState<AgentTurn[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const abortRef = useRef<AbortController | null>(null);
  const historyRef = useRef<HistoryMsg[]>([]);

  const run = async (q?: string) => {
    const text = (q ?? input).trim();
    if (!text || busy) return;
    setInput("");
    setBusy(true);
    setError("");
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const resp = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          question: text,
          history: historyRef.current,
          aiConfig: loadAIConfig(),
        }),
      });
      const json = (await resp.json()) as {
        ok: boolean;
        error?: string;
        result?: AgentDivination;
        meta?: AgentMeta;
      };
      if (!json.ok) throw new Error(json.error ?? "请求失败");
      if (!json.result) throw new Error("未返回结构化结果");
      const turn: AgentTurn = {
        question: text,
        interpretation: json.result!,
        divination: json.meta?.divination,
      };
      setTurns((t) => [...t, turn]);
      historyRef.current = [
        ...historyRef.current,
        { role: "user", content: text },
        { role: "assistant", content: JSON.stringify(json.result!) },
      ];
    } catch (e) {
      if ((e as Error).name !== "AbortError") setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
      abortRef.current = null;
    }
  };

  const inputCls =
    "flex-1 bg-ink border border-ash/40 rounded-lg px-3 py-2 text-sm text-paper placeholder:text-ash/60 focus:border-gold outline-none";

  return (
    <section className="rounded-xl border border-gold/40 bg-ink-2 p-4">
      <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
        <h3 className="text-gold font-bold">🧬 智能占卜 Agent</h3>
        <span className="text-xs text-ash">Agent 自主起课，支持追问与「换个时辰/参数」再占</span>
      </div>

      <div className="mb-3">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              run();
            }
          }}
          rows={2}
          placeholder="如：帮我看看这周换工作合不合适（可指定日期/时辰）"
          className={`${inputCls} h-20 resize-y`}
        />
        <div className="flex items-center gap-2 mt-2">
          <button
            onClick={() => run()}
            disabled={busy}
            className="rounded-lg bg-vermilion px-6 py-2 text-sm font-bold text-paper hover:bg-vermilion/80 transition-colors disabled:opacity-40"
          >
            {busy ? "起课中…" : "开始占卜"}
          </button>
          {busy && (
            <span className="text-xs text-ash animate-pulse">Agent 正在自主起课并解读…</span>
          )}
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {EXAMPLES.map((q) => (
            <button
              key={q}
              onClick={() => run(q)}
              disabled={busy}
              className="rounded-full border border-ash/40 px-3 py-1 text-xs text-ash hover:text-gold hover:border-gold transition-colors disabled:opacity-40"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="mb-3 text-sm text-vermilion">{error}</div>}

      {turns.length === 0 && !busy && (
        <p className="text-xs text-ash/70 leading-relaxed">
          Agent 会自主选择算法与参数、调用引擎精确起课，再给出卦象与解读。你可以在「简略 / 详细」
          间切换查看结果，也可继续追问，或要求「换个时辰/参数」对比再占。
        </p>
      )}

      <div className="space-y-4">
        {turns.map((t, idx) => (
          <div key={idx} className="space-y-2">
            <div className="text-sm text-gold">问：{t.question}</div>
            {t.error ? (
              <div className="text-sm text-vermilion">{t.error}</div>
            ) : (
              <AgentResultCard divination={t.divination} interpretation={t.interpretation} />
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
