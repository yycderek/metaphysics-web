"use client";
// AI 断课对话面板：课式下方，提问 → 流式断语 → 可追问
import { useEffect, useRef, useState } from "react";
import type { KeShi } from "@/lib/types";

interface Props {
  ks: KeShi;
}

interface ChatMsg {
  role: "user" | "assistant";
  content: string;
  reasoning?: string; // 推理模型思考过程（仅 assistant）
}

const QUICK_QUESTIONS = ["综合运势", "看事业", "看感情", "看财运"];

function seasonFromNow(): "春" | "夏" | "秋" | "冬" | "四季" {
  const m = new Date().getMonth() + 1; // 1-12
  if ([3, 4, 5].includes(m)) return "春";
  if ([6, 7, 8].includes(m)) return "夏";
  if ([9, 10, 11].includes(m)) return "秋";
  if ([12, 1, 2].includes(m)) return "冬";
  return "四季"; // 农历季月不细分，兜底
}

export default function AiDuanke({ ks }: Props) {
  const [season, setSeason] = useState(seasonFromNow());
  const [question, setQuestion] = useState("");
  const [history, setHistory] = useState<ChatMsg[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState("");
  const abortRef = useRef<AbortController | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  // 课式变化时清空对话（防止跨课串断）
  const ksKey = `${ks.rizhu}-${ks.shizhi}-${ks.yuejiang}-${ks.sanchuan.join("")}`;
  const prevKey = useRef(ksKey);
  useEffect(() => {
    if (prevKey.current !== ksKey) {
      prevKey.current = ksKey;
      setHistory([]);
      setError("");
    }
  }, [ksKey]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, streaming]);

  const ask = async (q?: string) => {
    const text = (q ?? question).trim();
    if (!text || streaming) return;
    setQuestion("");
    setError("");
    setStreaming(true);
    setHistory((h) => [...h, { role: "user", content: text }]);

    const controller = new AbortController();
    abortRef.current = controller;
    let acc = "";
    let accReason = "";
    setHistory((h) => [...h, { role: "assistant", content: "", reasoning: "" }]);

    try {
      const resp = await fetch("/api/divine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          ks,
          question: text,
          season,
          history: history
            .filter((m) => m.content || m.reasoning)
            .map((m) => ({
              role: m.role,
              content: m.role === "assistant" ? m.content || m.reasoning || "" : m.content,
            }))
            .slice(-8),
        }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: `HTTP ${resp.status}` }));
        throw new Error(err.error ?? "请求失败");
      }
      if (!resp.body) throw new Error("无响应流");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        // 解析 SSE：data: {...}\n\n
        const parts = buf.split("\n\n");
        buf = parts.pop() ?? "";
        for (const part of parts) {
          const line = part.trim();
          if (!line.startsWith("data:")) continue;
          const payload = line.slice(5).trim();
          if (payload === "[DONE]") continue;
          try {
            const json = JSON.parse(payload);
            const delta = json.choices?.[0]?.delta ?? {};
            const reason = delta.reasoning_content ?? "";
            const txt = delta.content ?? "";
            if (reason || txt) {
              accReason += reason;
              acc += txt;
              setHistory((h) => {
                const nh = [...h];
                nh[nh.length - 1] = { role: "assistant", content: acc, reasoning: accReason };
                return nh;
              });
            }
          } catch {
            /* 忽略不完整 chunk */
          }
        }
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") {
        setError(e instanceof Error ? e.message : String(e));
        setHistory((h) => {
          const nh = [...h];
          if (nh.length && nh[nh.length - 1].role === "assistant" && !nh[nh.length - 1].content) {
            nh.pop(); // 空回复移除
          }
          return nh;
        });
      }
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  };

  const stop = () => abortRef.current?.abort();

  return (
    <section className="rounded-xl border border-gold/40 bg-ink-2 p-4">
      <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
        <h3 className="text-gold font-bold">🦉 AI 断课</h3>
        <div className="flex items-center gap-2 text-xs text-ash">
          <span>季节</span>
          <select
            className="bg-ink border border-ash/40 rounded-lg px-2 py-1 text-paper text-sm focus:border-gold outline-none"
            value={season}
            onChange={(e) => setSeason(e.target.value as typeof season)}
          >
            {["春", "夏", "秋", "冬", "四季"].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        {QUICK_QUESTIONS.map((q) => (
          <button
            key={q}
            onClick={() => ask(q)}
            disabled={streaming}
            className="rounded-full border border-ash/40 px-3 py-1 text-xs text-ash hover:text-gold hover:border-gold transition-colors disabled:opacity-40"
          >
            {q}
          </button>
        ))}
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto pr-1 mb-3">
        {history.length === 0 && (
          <p className="text-xs text-ash/70 leading-relaxed">
            基于上方已起好的课式（引擎精确起课，AI 只负责解读），可问事业、感情、财运等。
          </p>
        )}
        {history.map((m, i) => (
          <div key={i} className={m.role === "user" ? "text-right" : "text-left"}>
            <div
              className={
                "inline-block max-w-[85%] text-left rounded-lg px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap " +
                (m.role === "user"
                  ? "bg-gold/20 border border-gold/40 text-paper"
                  : "bg-ink border border-ash/30 text-paper/90")
              }
            >
              {m.role === "assistant" && m.reasoning && (
                <details className="mb-2 text-xs text-ash/70 border-b border-ash/20 pb-1">
                  <summary className="cursor-pointer select-none">🧠 思考过程</summary>
                  <div className="mt-1 max-h-40 overflow-y-auto whitespace-pre-wrap">{m.reasoning}</div>
                </details>
              )}
              {m.content || (streaming && i === history.length - 1 ? "……" : "")}
              {streaming && i === history.length - 1 && m.role === "assistant" && m.content && (
                <span className="inline-block w-2 h-4 bg-gold ml-1 animate-pulse" />
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {error && <div className="mb-3 text-sm text-vermilion">{error}</div>}

      <div className="flex gap-2">
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.nativeEvent.isComposing) ask();
          }}
          placeholder="输入想问的事，如：最近换工作合适吗？"
          className="flex-1 bg-ink border border-ash/40 rounded-lg px-3 py-2 text-sm text-paper placeholder:text-ash/60 focus:border-gold outline-none"
        />
        {streaming ? (
          <button
            onClick={stop}
            className="rounded-lg border border-ash/40 px-4 py-2 text-sm text-ash hover:text-paper transition-colors"
          >
            停止
          </button>
        ) : (
          <button
            onClick={() => ask()}
            className="rounded-lg bg-vermilion px-4 py-2 text-sm font-bold text-paper hover:bg-vermilion/80 transition-colors"
          >
            断课
          </button>
        )}
      </div>
    </section>
  );
}
