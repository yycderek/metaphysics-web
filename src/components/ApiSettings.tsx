"use client";
// AI API 设置：自定义 OpenAI 兼容服务（baseUrl / apiKey / model / temperature）。
// 存 localStorage，Agent 与 AI 解读共享读取；留空则用服务端默认。
import { useEffect, useId, useRef, useState } from "react";
import { IconCheck, IconSliders } from "@/components/icons";
import LiveNote from "@/components/LiveNote";
import {
  AI_CONFIG_LEGACY_STORAGE_KEY,
  AI_CONFIG_STORAGE_KEY,
  loadAIConfig,
} from "@/lib/ai-config";
import type { UserAIConfig } from "@/lib/aiTypes";

const inputCls =
  "w-full bg-ink-2 border border-ash/30 rounded-md px-2 py-1.5 text-sm text-paper placeholder:text-ash/80 focus:border-gold focus-visible:ring-2 focus-visible:ring-gold";
const labelCls = "block text-xs text-ash mb-1";

interface ApiSettingsFormProps {
  initial: UserAIConfig;
  onSaved: (cfg: UserAIConfig) => void;
  onReset: () => void;
  resetLabel?: string;
}

export function ApiSettingsForm({
  initial,
  onSaved,
  onReset,
  resetLabel = "恢复默认",
}: ApiSettingsFormProps) {
  const uid = useId();
  const [fBase, setFBase] = useState(initial.baseUrl ?? "");
  const [fKey, setFKey] = useState(initial.apiKey ?? "");
  const [fModel, setFModel] = useState(initial.model ?? "");
  const [fTemp, setFTemp] = useState(
    initial.temperature != null ? String(initial.temperature) : "",
  );

  const save = () => {
    const next: UserAIConfig = {};
    if (fBase.trim()) next.baseUrl = fBase.trim();
    if (fKey.trim()) next.apiKey = fKey.trim();
    if (fModel.trim()) next.model = fModel.trim();
    const t = parseFloat(fTemp);
    if (!Number.isNaN(t) && t > 0 && t <= 2) next.temperature = t;
    try {
      localStorage.setItem(AI_CONFIG_STORAGE_KEY, JSON.stringify(next));
      localStorage.removeItem(AI_CONFIG_LEGACY_STORAGE_KEY);
    } catch {
      /* ignore */
    }
    onSaved(next);
  };

  const reset = () => {
    setFBase("");
    setFKey("");
    setFModel("");
    setFTemp("");
    try {
      localStorage.removeItem(AI_CONFIG_STORAGE_KEY);
      localStorage.removeItem(AI_CONFIG_LEGACY_STORAGE_KEY);
    } catch {
      /* ignore */
    }
    onReset();
  };

  return (
    <>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div>
          <label htmlFor={`${uid}-base`} className={labelCls}>
            Base URL
          </label>
          <input
            id={`${uid}-base`}
            className={inputCls}
            type="url"
            inputMode="url"
            autoComplete="off"
            spellCheck={false}
            placeholder="https://api.deepseek.com"
            value={fBase}
            onChange={(e) => setFBase(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor={`${uid}-model`} className={labelCls}>
            Model
          </label>
          <input
            id={`${uid}-model`}
            className={inputCls}
            autoComplete="off"
            spellCheck={false}
            placeholder="deepseek-v4-flash"
            value={fModel}
            onChange={(e) => setFModel(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor={`${uid}-key`} className={labelCls}>
            API Key
          </label>
          <input
            id={`${uid}-key`}
            className={inputCls}
            type="password"
            autoComplete="off"
            spellCheck={false}
            placeholder="sk-…"
            value={fKey}
            onChange={(e) => setFKey(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor={`${uid}-temp`} className={labelCls}>
            Temperature（0-2）
          </label>
          <input
            id={`${uid}-temp`}
            className={inputCls}
            type="number"
            step="0.1"
            min="0"
            max="2"
            autoComplete="off"
            spellCheck={false}
            placeholder="0.7"
            value={fTemp}
            onChange={(e) => setFTemp(e.target.value)}
          />
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={save}
          className="rounded-md border border-gold/40 px-3 py-1 text-xs text-gold transition-colors hover:bg-gold/10"
        >
          保存
        </button>
        <button
          onClick={reset}
          className="rounded-md border border-ash/30 px-3 py-1 text-xs text-ash transition-colors hover:text-paper"
        >
          {resetLabel}
        </button>
      </div>
    </>
  );
}

export default function ApiSettings() {
  const [cfg, setCfg] = useState<UserAIConfig>(loadAIConfig);
  const [show, setShow] = useState(false);
  const [note, setNote] = useState("");
  const noteTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const configured = !!(cfg.baseUrl || cfg.apiKey || cfg.model);

  useEffect(
    () => () => {
      if (noteTimer.current) clearTimeout(noteTimer.current);
    },
    [],
  );

  const flash = (msg: string) => {
    setNote(msg);
    if (noteTimer.current) clearTimeout(noteTimer.current);
    noteTimer.current = setTimeout(() => setNote(""), 3000);
  };

  return (
    <div className="text-xs">
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-expanded={show}
        className="inline-flex items-center gap-1 text-ash transition-colors hover:text-gold"
      >
        {configured ? <IconCheck size={12} /> : <IconSliders size={12} />}
        {configured ? "自定义 AI" : "自定义 AI API"}
      </button>

      {show && (
        <div className="mt-2 space-y-2 rounded-md border border-ash/25 bg-ink p-4">
          <p className="leading-relaxed text-ash/85">
            使用 OpenAI 兼容服务（DeepSeek/通义/豆包/Kimi/智谱/Ollama/vLLM
            均可）。留空则用服务端默认模型。
          </p>
          <ApiSettingsForm
            initial={cfg}
            onSaved={(next) => {
              setCfg(next);
              setShow(false);
              flash("已保存");
            }}
            onReset={() => {
              setCfg({});
              setShow(false);
              flash("已恢复默认");
            }}
          />
        </div>
      )}
      <LiveNote className={note ? "mt-1 text-jade" : "sr-only"}>{note}</LiveNote>
    </div>
  );
}
