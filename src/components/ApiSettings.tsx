"use client";
// AI API 设置：自定义 OpenAI 兼容服务（baseUrl / apiKey / model / temperature）。
// 存 localStorage，Agent 与 AI 解读共享读取；留空则用服务端默认。
import { useState } from "react";
import type { UserAIConfig } from "@/lib/aiTypes";

const STORAGE_KEY = "metaphysics-ai-config";
const LEGACY_KEY = "liuren-ai-config";

function load(): UserAIConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(LEGACY_KEY);
    return raw ? (JSON.parse(raw) as UserAIConfig) : {};
  } catch {
    return {};
  }
}

export default function ApiSettings() {
  const [cfg, setCfg] = useState<UserAIConfig>(load);
  const [show, setShow] = useState(false);
  const [fBase, setFBase] = useState(cfg.baseUrl ?? "");
  const [fKey, setFKey] = useState(cfg.apiKey ?? "");
  const [fModel, setFModel] = useState(cfg.model ?? "");
  const [fTemp, setFTemp] = useState(cfg.temperature != null ? String(cfg.temperature) : "");
  const [note, setNote] = useState("");

  const configured = !!(cfg.baseUrl || cfg.apiKey || cfg.model);

  const save = () => {
    const next: UserAIConfig = {};
    if (fBase.trim()) next.baseUrl = fBase.trim();
    if (fKey.trim()) next.apiKey = fKey.trim();
    if (fModel.trim()) next.model = fModel.trim();
    const t = parseFloat(fTemp);
    if (!Number.isNaN(t) && t > 0 && t <= 2) next.temperature = t;
    setCfg(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      localStorage.removeItem(LEGACY_KEY);
    } catch {
      /* ignore */
    }
    setShow(false);
    setNote("已保存");
  };

  const reset = () => {
    setCfg({});
    setFBase("");
    setFKey("");
    setFModel("");
    setFTemp("");
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(LEGACY_KEY);
    } catch {
      /* ignore */
    }
    setShow(false);
    setNote("已恢复默认");
  };

  const inputCls =
    "bg-ink border border-ash/40 rounded-lg px-2 py-1.5 text-sm text-paper placeholder:text-ash/80 focus:border-gold outline-none";

  return (
    <div className="text-xs">
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-expanded={show}
        className="text-ash hover:text-gold transition-colors"
      >
        {configured ? "✓ 自定义 AI" : "⚙️ 自定义 AI API"}
      </button>

      {show && (
        <div className="mt-2 rounded-lg border border-ash/30 bg-ink p-3 space-y-2">
          <p className="text-ash/85 leading-relaxed">
            使用 OpenAI 兼容服务（DeepSeek/通义/豆包/Kimi/智谱/Ollama/vLLM
            均可）。留空则用服务端默认模型。
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input
              className={inputCls}
              placeholder="Base URL"
              value={fBase}
              onChange={(e) => setFBase(e.target.value)}
            />
            <input
              className={inputCls}
              placeholder="Model（如 deepseek-chat / qwen-plus）"
              value={fModel}
              onChange={(e) => setFModel(e.target.value)}
            />
            <input
              className={inputCls}
              type="password"
              placeholder="API Key"
              value={fKey}
              onChange={(e) => setFKey(e.target.value)}
            />
            <input
              className={inputCls}
              type="number"
              step="0.1"
              min="0"
              max="2"
              placeholder="Temperature 0.7"
              value={fTemp}
              onChange={(e) => setFTemp(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={save}
              className="rounded bg-gold/20 border border-gold/50 px-3 py-1 text-gold hover:bg-gold/30"
            >
              保存
            </button>
            <button
              onClick={reset}
              className="rounded border border-ash/40 px-3 py-1 text-ash hover:text-paper"
            >
              恢复默认
            </button>
            {note && <span className="text-jade self-center">{note}</span>}
          </div>
        </div>
      )}
    </div>
  );
}
