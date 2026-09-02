"use client";
// AI 断课对话面板：占卜结果下方，提问 → 流式断语 → 可追问
// 阶段5：支持任意算法（按算法 ID 分发断课模板，服务端选择 system prompt）
// 支持用户自定义 AI API（OpenAI 兼容协议），设置存 localStorage
import { useEffect, useRef, useState } from "react";
import { consumeSSE, parseSSEEvent } from "@/lib/sse";
import type { DivinationResult } from "@/lib/algorithms/types";
import type { UserAIConfig } from "@/lib/aiTypes";

interface Props {
  result: DivinationResult;
}

interface ChatMsg {
  role: "user" | "assistant";
  content: string;
  reasoning?: string; // 推理模型思考过程（仅 assistant）
}

const QUICK_QUESTIONS = ["综合运势", "看事业", "看感情", "看财运"];
const STORAGE_KEY = "metaphysics-ai-config";
const LEGACY_STORAGE_KEY = "liuren-ai-config";

function loadAIConfig(): UserAIConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(LEGACY_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as UserAIConfig) : {};
  } catch {
    return {};
  }
}

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
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const accRef = useRef("");
  const accReasonRef = useRef("");

  const isDaliuren = result.algorithmId === "daliuren";

  // ---- 用户自定义 AI 配置 ----
  const [aiConfig, setAiConfig] = useState<UserAIConfig>(loadAIConfig);
  const [showSettings, setShowSettings] = useState(false);
  const [fBaseUrl, setFBaseUrl] = useState(aiConfig.baseUrl ?? "");
  const [fApiKey, setFApiKey] = useState(aiConfig.apiKey ?? "");
  const [fModel, setFModel] = useState(aiConfig.model ?? "");
  const [fTemp, setFTemp] = useState(
    aiConfig.temperature != null ? String(aiConfig.temperature) : "",
  );

  const saveSettings = () => {
    const cfg: UserAIConfig = {};
    if (fBaseUrl.trim()) cfg.baseUrl = fBaseUrl.trim();
    if (fApiKey.trim()) cfg.apiKey = fApiKey.trim();
    if (fModel.trim()) cfg.model = fModel.trim();
    const t = parseFloat(fTemp);
    if (!Number.isNaN(t) && t > 0 && t <= 2) cfg.temperature = t;
    setAiConfig(cfg);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
      localStorage.removeItem(LEGACY_STORAGE_KEY); // 迁移：清除旧键
    } catch {
      /* 忽略存储失败 */
    }
    setShowSettings(false);
    setError("");
  };

  const resetSettings = () => {
    setAiConfig({});
    setFBaseUrl("");
    setFApiKey("");
    setFModel("");
    setFTemp("");
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(LEGACY_STORAGE_KEY);
    } catch {
      /* ignore */
    }
    setShowSettings(false);
  };

  // 占卜结果变化时清空对话（防止跨次占卜串断）
  const resultKey = `${result.algorithmId}-${JSON.stringify(result.input ?? {})}`;
  const prevKey = useRef(resultKey);
  useEffect(() => {
    if (prevKey.current !== resultKey) {
      prevKey.current = resultKey;
      setHistory([]);
      setError("");
    }
  }, [resultKey]);

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
    accRef.current = "";
    accReasonRef.current = "";
    setHistory((h) => [...h, { role: "assistant", content: "", reasoning: "" }]);

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
              setHistory((h) => [
                ...h.slice(0, -1),
                { role: "assistant", content: accRef.current, reasoning: accReasonRef.current },
              ]);
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

  const inputCls =
    "w-full bg-ink border border-ash/40 rounded-lg px-2 py-1.5 text-sm text-paper placeholder:text-ash/80 focus:border-gold outline-none";
  const labelCls = "block text-xs text-ash mb-1";

  return (
    <section className="rounded-xl border border-gold/40 bg-ink-2 p-4">
      <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
        <h3 className="text-gold font-bold">💬 AI 解读当前课盘</h3>
        <div className="flex items-center gap-2 text-xs text-ash">
          <button
            onClick={() => setShowSettings((s) => !s)}
            title="API 设置"
            aria-expanded={showSettings}
            aria-controls="ai-duanke-settings"
            className="px-2 py-1 rounded-lg border border-ash/40 hover:border-gold hover:text-gold transition-colors"
          >
            ⚙️ {aiConfig.baseUrl || aiConfig.model || aiConfig.apiKey ? "自定义 API" : "API 设置"}
          </button>
          {isDaliuren && (
            <>
              <span>季节</span>
              <select
                className="bg-ink border border-ash/40 rounded-lg px-2 py-1 text-paper text-sm focus:border-gold outline-none"
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
          className="mb-4 rounded-lg border border-ash/30 bg-ink p-3 space-y-3"
        >
          <p className="text-xs text-ash/80 leading-relaxed">
            使用 OpenAI 兼容协议（DeepSeek / 通义 / 豆包 / Kimi / 智谱 / 硅基流动 / Ollama / vLLM
            均可）。 留空的字段回退到服务端默认（DeepSeek + 环境变量）。API Key 仅保存在本浏览器。
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Base URL</label>
              <input
                className={inputCls}
                placeholder="https://api.deepseek.com"
                value={fBaseUrl}
                onChange={(e) => setFBaseUrl(e.target.value)}
              />
            </div>
            <div>
              <label className={labelCls}>Model</label>
              <input
                className={inputCls}
                placeholder="deepseek-v4-flash"
                value={fModel}
                onChange={(e) => setFModel(e.target.value)}
              />
            </div>
            <div>
              <label className={labelCls}>API Key</label>
              <input
                className={inputCls}
                type="password"
                placeholder="sk-..."
                value={fApiKey}
                onChange={(e) => setFApiKey(e.target.value)}
              />
            </div>
            <div>
              <label className={labelCls}>Temperature（0-2）</label>
              <input
                className={inputCls}
                type="number"
                step="0.1"
                min="0"
                max="2"
                placeholder="0.7"
                value={fTemp}
                onChange={(e) => setFTemp(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={saveSettings}
              className="rounded-lg bg-gold/20 border border-gold/50 px-3 py-1.5 text-xs text-gold hover:bg-gold/30 transition-colors"
            >
              保存
            </button>
            <button
              onClick={resetSettings}
              className="rounded-lg border border-ash/40 px-3 py-1.5 text-xs text-ash hover:text-paper transition-colors"
            >
              重置为默认
            </button>
          </div>
        </div>
      )}

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
          <p className="text-xs text-ash/85 leading-relaxed">
            基于上方程序精确算出的占卜结果（{result.algorithmName}，AI
            只负责解读），可问事业、感情、财运等。
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
                <details className="mb-2 text-xs text-ash/85 border-b border-ash/20 pb-1">
                  <summary className="cursor-pointer select-none">🧠 思考过程</summary>
                  <div className="mt-1 max-h-40 overflow-y-auto whitespace-pre-wrap">
                    {m.reasoning}
                  </div>
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
          className="flex-1 bg-ink border border-ash/40 rounded-lg px-3 py-2 text-sm text-paper placeholder:text-ash/85 focus:border-gold outline-none"
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
            className="rounded-lg bg-gold px-4 py-2 text-sm font-bold text-ink hover:bg-gold/90 transition-colors"
          >
            断课
          </button>
        )}
      </div>
    </section>
  );
}
