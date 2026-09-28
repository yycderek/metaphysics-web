"use client";
// AI 断课对话面板：占卜结果下方，提问 → 流式断语 → 可追问
// 阶段5：支持任意算法（按算法 ID 分发断课模板，服务端选择 system prompt）
// 支持用户自定义 AI API（OpenAI 兼容协议），设置存 localStorage
import { useEffect, useMemo, useRef, useState } from "react";
import { IconChat, IconSliders } from "@/components/icons";
import { ApiSettingsForm } from "@/components/ApiSettings";
import { loadAIConfig } from "@/lib/ai-config";
import { consumeSSE, parseSSEEvent } from "@/lib/sse";
import type { DivinationResult } from "@/lib/algorithms/types";
import type { UserAIConfig } from "@/lib/aiTypes";

interface Props {
  result: DivinationResult;
}

interface ChatMsg {
  id: number;
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

export default function AiDuanke({ result }: Props) {
  const [season, setSeason] = useState(seasonFromNow());
  const [question, setQuestion] = useState("");
  const [history, setHistory] = useState<ChatMsg[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState("");
  const abortRef = useRef<AbortController | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const accRef = useRef("");
  const accReasonRef = useRef("");
  const flushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const msgIdRef = useRef(0);

  const isDaliuren = result.algorithmId === "daliuren";

  // ---- 用户自定义 AI 配置 ----
  const [aiConfig, setAiConfig] = useState<UserAIConfig>(loadAIConfig);
  const [showSettings, setShowSettings] = useState(false);

  // 占卜结果变化时清空对话（防止跨次占卜串断）
  const resultKey = useMemo(
    () => `${result.algorithmId}-${JSON.stringify(result.input ?? {})}`,
    [result],
  );
  const prevKey = useRef(resultKey);
  useEffect(() => {
    if (prevKey.current !== resultKey) {
      prevKey.current = resultKey;
      setHistory([]);
      setError("");
    }
  }, [resultKey]);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const reduced =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || typeof el.scrollTo !== "function") {
      el.scrollTop = el.scrollHeight;
    } else {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }
  }, [history, streaming]);

  useEffect(
    () => () => {
      if (flushTimerRef.current) clearTimeout(flushTimerRef.current);
    },
    [],
  );

  // 流式 token 高频到达，节流 ~50ms 批量刷新最后一条消息
  const flushAssistant = () => {
    flushTimerRef.current = null;
    const content = accRef.current;
    const reasoning = accReasonRef.current;
    setHistory((h) => {
      const last = h[h.length - 1];
      if (!last || last.role !== "assistant") return h;
      return [...h.slice(0, -1), { ...last, content, reasoning }];
    });
  };

  const scheduleFlush = () => {
    if (flushTimerRef.current) return;
    flushTimerRef.current = setTimeout(flushAssistant, 50);
  };

  const ask = async (q?: string) => {
    const text = (q ?? question).trim();
    if (!text || streaming) return;
    setQuestion("");
    setError("");
    setStreaming(true);
    setHistory((h) => [...h, { id: ++msgIdRef.current, role: "user", content: text }]);

    const controller = new AbortController();
    abortRef.current = controller;
    accRef.current = "";
    accReasonRef.current = "";
    setHistory((h) => [
      ...h,
      { id: ++msgIdRef.current, role: "assistant", content: "", reasoning: "" },
    ]);

    try {
      const resp = await fetch("/api/divine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          algorithmId: result.algorithmId,
          algorithmName: result.algorithmName,
          input: result.input,
          raw: result.raw,
          steps: result.steps,
          question: text,
          season,
          aiConfig,
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
        // 增量解析 SSE：归一化 CRLF，兼容 event 块分隔差异；未完整尾部保留续读
        const { events, rest } = consumeSSE(buf, decoder.decode(value, { stream: true }));
        buf = rest;
        for (const event of events) {
          const result = parseSSEEvent(event);
          if (result.type === "ignore") continue;
          if (result.type === "done") break;
          try {
            const json = JSON.parse(result.payload);
            const delta = json.choices?.[0]?.delta ?? {};
            const reason = delta.reasoning_content ?? "";
            const txt = delta.content ?? "";
            if (reason || txt) {
              accReasonRef.current += reason;
              accRef.current += txt;
              scheduleFlush();
            }
          } catch {
            /* 忽略不完整 chunk */
          }
        }
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") {
        setError(e instanceof Error ? e.message : String(e));
      }
    } finally {
      if (flushTimerRef.current) {
        clearTimeout(flushTimerRef.current);
        flushTimerRef.current = null;
      }
      setHistory((h) => {
        const last = h[h.length - 1];
        if (!last || last.role !== "assistant") return h;
        const content = accRef.current;
        const reasoning = accReasonRef.current;
        if (!content && !reasoning) return h.slice(0, -1); // 空回复移除
        return [...h.slice(0, -1), { ...last, content, reasoning }];
      });
      setStreaming(false);
      abortRef.current = null;
    }
  };

  const stop = () => abortRef.current?.abort();

  return (
    <section className="rounded-md border border-ash/25 bg-ink-2 p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 font-display font-bold tracking-[0.2em] text-gold">
          <IconChat size={16} />
          AI 解读当前课盘
        </h3>
        <div className="flex items-center gap-2 text-xs text-ash">
          <button
            onClick={() => setShowSettings((s) => !s)}
            title="API 设置"
            aria-expanded={showSettings}
            aria-controls="ai-duanke-settings"
            className="inline-flex items-center gap-1 rounded-md border border-ash/30 px-2 py-1 transition-colors hover:border-gold hover:text-gold"
          >
            <IconSliders size={12} />
            {aiConfig.baseUrl || aiConfig.model || aiConfig.apiKey ? "自定义 API" : "API 设置"}
          </button>
          {isDaliuren && (
            <>
              <span>季节</span>
              <select
                aria-label="季节"
                className="rounded-md border border-ash/30 bg-ink-2 px-2 py-1 text-sm text-paper focus:border-gold focus-visible:ring-2 focus-visible:ring-gold"
                value={season}
                onChange={(e) => setSeason(e.target.value as typeof season)}
              >
                {["春", "夏", "秋", "冬", "四季"].map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </>
          )}
        </div>
      </div>

      {showSettings && (
        <div
          id="ai-duanke-settings"
          className="mb-4 space-y-3 rounded-md border border-ash/25 bg-ink p-4"
        >
          <p className="text-xs leading-relaxed text-ash/80">
            使用 OpenAI 兼容协议（DeepSeek / 通义 / 豆包 / Kimi / 智谱 / 硅基流动 / Ollama / vLLM
            均可）。 留空的字段回退到服务端默认（DeepSeek + 环境变量）。API Key 仅保存在本浏览器。
          </p>
          <ApiSettingsForm
            initial={aiConfig}
            resetLabel="重置为默认"
            onSaved={(cfg) => {
              setAiConfig(cfg);
              setShowSettings(false);
              setError("");
            }}
            onReset={() => {
              setAiConfig({});
              setShowSettings(false);
            }}
          />
        </div>
      )}

      <div className="mb-3 flex flex-wrap gap-2">
        {QUICK_QUESTIONS.map((q) => (
          <button
            key={q}
            onClick={() => ask(q)}
            disabled={streaming}
            className="rounded-full border border-ash/30 px-3 py-1 text-xs text-ash transition-colors hover:border-gold hover:text-gold disabled:opacity-40"
          >
            {q}
          </button>
        ))}
      </div>

      <div ref={listRef} className="mb-3 max-h-96 space-y-3 overflow-y-auto pr-1">
        {history.length === 0 && (
          <p className="text-xs leading-relaxed text-ash/85">
            基于上方程序精确算出的占卜结果（{result.algorithmName}，AI
            只负责解读），可问事业、感情、财运等。
          </p>
        )}
        {history.map((m, i) => (
          <div key={m.id} className={m.role === "user" ? "text-right" : "text-left"}>
            <div
              className={
                "inline-block max-w-[85%] rounded-md border px-3 py-2 text-left text-sm leading-relaxed whitespace-pre-wrap " +
                (m.role === "user"
                  ? "border-ash/25 bg-ink text-paper"
                  : "border-ash/25 border-l-2 border-l-vermilion bg-ink text-paper/90")
              }
            >
              {m.role === "assistant" && m.reasoning && (
                <details className="mb-2 border-b border-ash/20 pb-1 text-xs text-ash/85">
                  <summary className="cursor-pointer select-none">思考过程</summary>
                  <div className="mt-1 max-h-40 overflow-y-auto whitespace-pre-wrap">
                    {m.reasoning}
                  </div>
                </details>
              )}
              {m.content || (streaming && i === history.length - 1 ? "……" : "")}
              {streaming && i === history.length - 1 && m.role === "assistant" && m.content && (
                <span className="ml-1 inline-block h-4 w-2 bg-vermilion motion-safe:animate-pulse" />
              )}
            </div>
          </div>
        ))}
      </div>

      {error && (
        <div role="alert" className="mb-3 text-sm text-vermilion">
          {error}
        </div>
      )}

      <div className="flex gap-2 border-t border-ash/20 pt-3">
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.nativeEvent.isComposing) ask();
          }}
          aria-label="输入想问的事"
          placeholder="输入想问的事，如：最近换工作合适吗？"
          className="flex-1 rounded-md border border-ash/30 bg-ink-2 px-3 py-2 text-sm text-paper placeholder:text-ash/85 focus:border-gold focus-visible:ring-2 focus-visible:ring-gold"
        />
        {streaming ? (
          <button
            onClick={stop}
            className="rounded-md border border-ash/30 px-4 py-2 text-sm text-ash transition-colors hover:text-paper"
          >
            停止
          </button>
        ) : (
          <button
            onClick={() => ask()}
            className="rounded-md bg-vermilion px-4 py-2 text-sm font-bold text-seal-ink transition-colors hover:bg-vermilion/90"
          >
            断课
          </button>
        )}
      </div>
    </section>
  );
}
