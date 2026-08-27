"use client";
// 智能占卜 Agent 面板（多轮）：用户直接说意图 → Agent 自主决定算法/参数并调用 divinate 起课
// → 引擎精确算课 → 输出结构化断语（卦象 + 简略结论 + 逐步详细解读 + 依据）。
// 支持：澄清追问（信息不足时先问再算）、把已算的卦作为记忆复读、换时辰/参数对比。
import { useRef, useState } from "react";
import AgentResultCard from "@/components/AgentResultCard";
import { toPriorDivination } from "@/lib/agent/divinate";
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
  clarify?: string;
  interpretation?: AgentDivination;
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
  const [pendingClarify, setPendingClarify] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const abortRef = useRef<AbortController | null>(null);
  const threadRef = useRef<HistoryMsg[]>([]);
  const divinationsRef = useRef<{ summary: string; facts: string }[]>([]);

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
          history: threadRef.current,
          divinations: divinationsRef.current,
          aiConfig: loadAIConfig(),
        }),
      });
      const json = (await resp.json()) as {
        ok: boolean;
        kind?: "answer" | "clarify";
        question?: string;
        error?: string;
        result?: AgentDivination;
        meta?: AgentMeta;
      };
      if (!json.ok) throw new Error(json.error ?? "请求失败");

      if (json.kind === "clarify" && json.question) {
        const qtext = json.question;
        threadRef.current = [...threadRef.current, { role: "assistant", content: qtext }];
        setTurns((t) => [...t, { question: text, clarify: qtext }]);
        setPendingClarify(qtext);
        return;
      }
      if (!json.result) throw new Error("未返回结构化结果");

      const prior = json.meta?.divination ? toPriorDivination(json.meta.divination) : null;
      if (prior) divinationsRef.current = [...divinationsRef.current, prior].slice(-6);
      const recap = `${json.result.卦象}｜${json.result.结论.总断}`;
      threadRef.current = [
        ...threadRef.current,
        { role: "user", content: text },
        { role: "assistant", content: recap },
      ];
      setTurns((t) => [
        ...t,
        { question: text, interpretation: json.result!, divination: json.meta?.divination },
      ]);
      setPendingClarify(null);
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
        <span className="text-xs text-ash">自主起课、追问澄清、可复读已算之卦、换参数对比</span>
      </div>

      <div className="mb-3">
        {pendingClarify && (
          <div className="mb-2 rounded-lg border border-gold/40 bg-gold/10 px-3 py-2 text-sm text-gold">
            🤔 请先回答：{pendingClarify}
          </div>
        )}
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
          placeholder={
            pendingClarify
              ? "在这里回答上面的问题…"
              : "如：帮我看看这周换工作合不合适（可指定日期/时辰）"
          }
          className={`${inputCls} h-20 resize-y`}
        />
        <div className="flex items-center gap-2 mt-2">
          <button
            onClick={() => run()}
            disabled={busy}
            className="rounded-lg bg-vermilion px-6 py-2 text-sm font-bold text-paper hover:bg-vermilion/80 transition-colors disabled:opacity-40"
          >
            {busy ? "起课中…" : pendingClarify ? "继续" : "开始占卜"}
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
          Agent
          会自主选择算法与参数、调用引擎精确起课，再给出卦象与解读。信息不足时会先追问澄清，也可要求「换个时辰/参数」对比。
        </p>
      )}

      <div className="space-y-4">
        {turns.map((t, idx) => (
          <div key={idx} className="space-y-2">
            <div className="text-sm text-gold">问：{t.question}</div>
            {t.clarify ? (
              <div className="rounded-lg border border-gold/40 bg-ink px-3 py-2 text-sm text-gold">
                🤔 Agent 追问：{t.clarify}
              </div>
            ) : t.error ? (
              <div className="text-sm text-vermilion">{t.error}</div>
            ) : t.interpretation ? (
              <AgentResultCard divination={t.divination} interpretation={t.interpretation} />
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}
